/**
 * P2.1: Single Portfolio Operations
 * GET    /api/portfolio/[id]  - Get portfolio with holdings and computed valuation metrics
 * DELETE /api/portfolio/[id]  - Delete a portfolio
 */

import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabase, type SupabaseStock, type SupabaseSectorStats } from '@/lib/supabase';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { runAllModels, DEFAULT_MARKET_PARAMS, type StockFundamentals, type SectorAverages } from '@/lib/valuation-engine';
import { getFinancialDataByTicker, getHardcodedSectorAverages } from '@/lib/data/egx-financial-data';

export const dynamic = 'force-dynamic';

/**
 * Normalized financial data interface used for portfolio valuation.
 * Extends SupabaseFinancialData with fields that exist in the DB
 * but are not in the TypeScript interface.
 */
interface NormalizedFinancialData {
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
  operatingCashflow: number;
  freeCashflow: number;
  grossMargin: number;
  operatingMargin: number;
  profitMargin: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  evToEbitda: number;
  eps: number;
  bookValuePerShare: number;
  revenueGrowth: number;
  earningsGrowth: number;
  cashEquivalents: number;
  ebitda: number;
}

const PortfolioIdSchema = z.string().min(1).max(50);

// ── GET: Portfolio with computed valuation metrics ──────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(
    'api/portfolio',
    ip,
    RATE_LIMITS.portfolio.limit,
    RATE_LIMITS.portfolio.windowMs,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } },
    );
  }

  const { id } = await params;
  const idValidation = PortfolioIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Invalid portfolio ID', details: idValidation.error.issues },
      { status: 400 },
    );
  }

  try {
    // Fetch portfolio with holdings
    const { data: portfolio, error: portfolioError } = await supabase
      .from('Portfolio')
      .select('*, holdings:PortfolioHolding(*)')
      .eq('id', id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 },
      );
    }

    const holdings = portfolio.holdings ?? [];

    // If no holdings, return portfolio with zeroed metrics
    if (holdings.length === 0) {
      return NextResponse.json({
        portfolio: {
          ...portfolio,
          holdings: [],
        },
        valuation: {
          totalValue: 0,
          totalCost: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          weightedPE: 0,
          weightedPB: 0,
          weightedDividendYield: 0,
          averageFairValue: 0,
          averageUpside: 0,
          holdingsValuation: [],
        },
      });
    }

    // Fetch stock data for all holdings
    const stockIds = holdings.map((h: { stockId: string }) => h.stockId);
    const { data: stocks } = await supabase
      .from('Stock')
      .select('*')
      .in('id', stockIds);

    const stockMap = new Map<string, SupabaseStock>();
    if (stocks) {
      for (const s of stocks as SupabaseStock[]) {
        stockMap.set(s.id, s);
      }
    }

    // Compute per-holding valuation and aggregate metrics
    let totalValue = 0;
    let totalCost = 0;
    let totalWeightedPE = 0;
    let totalWeightedPB = 0;
    let totalWeightedDivYield = 0;
    let totalWeightedFairValue = 0;
    let totalSharesValue = 0;
    const holdingsValuation: Array<{
      stockId: string;
      ticker: string;
      name: string;
      shares: number;
      avgCost: number;
      currentPrice: number;
      marketValue: number;
      costBasis: number;
      pnl: number;
      pnlPercent: number;
      fairValue: number | null;
      upside: number | null;
      sector: string;
    }> = [];

    for (const holding of holdings) {
      const stock = stockMap.get(holding.stockId);
      const finData = getFinancialDataByTicker(stock?.ticker ?? '');

      // Current price: prefer DB stock, then hardcoded data, then avgCost fallback
      const currentPrice = stock?.price || finData?.price || holding.avgCost || 0;
      const shares = holding.shares || 0;
      const avgCost = holding.avgCost || 0;
      const marketValue = currentPrice * shares;
      const costBasis = avgCost * shares;
      const pnl = marketValue - costBasis;
      const pnlPercent = costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0;

      totalValue += marketValue;
      totalCost += costBasis;

      // Weighted metrics: weight = market value share
      const pe = stock?.peRatio || finData?.peRatio || 0;
      const pb = stock?.pbRatio || finData?.pbRatio || 0;
      const divYield = stock?.dividendYield || finData?.dividendYield || 0;

      if (marketValue > 0) {
        totalWeightedPE += pe * marketValue;
        totalWeightedPB += pb * marketValue;
        totalWeightedDivYield += divYield * marketValue;
        totalSharesValue += marketValue;
      }

      // Compute individual stock valuation
      let fairValue: number | null = null;
      let upside: number | null = null;

      if (currentPrice > 0) {
        try {
          // Fetch latest financial data from Supabase
          let effectiveFin: NormalizedFinancialData | null = null;
          try {
            const { data: finRows } = await supabase
              .from('FinancialData')
              .select('*')
              .eq('stockId', holding.stockId)
              .order('year', { ascending: false })
              .limit(1);
            if (finRows && finRows.length > 0) {
              // Cast to any first since DB may have extra fields not in SupabaseFinancialData
              const row = finRows[0] as Record<string, unknown>;
              effectiveFin = {
                revenue: (row.revenue as number) || 0,
                netIncome: (row.netIncome as number) || 0,
                totalAssets: (row.totalAssets as number) || 0,
                totalEquity: (row.totalEquity as number) || 0,
                totalDebt: (row.totalDebt as number) || 0,
                operatingCashflow: (row.operatingCashflow as number) || 0,
                freeCashflow: (row.freeCashflow as number) || 0,
                grossMargin: (row.grossMargin as number) || 0,
                operatingMargin: (row.operatingMargin as number) || 0,
                profitMargin: (row.profitMargin as number) || 0,
                roe: (row.roe as number) || 0,
                roa: (row.roa as number) || 0,
                debtToEquity: (row.debtToEquity as number) || 0,
                evToEbitda: (row.evToEbitda as number) || 0,
                eps: (row.eps as number) || 0,
                bookValuePerShare: (row.bookValuePerShare as number) || 0,
                revenueGrowth: (row.revenueGrowth as number) || 0,
                earningsGrowth: (row.earningsGrowth as number) || 0,
                cashEquivalents: (row.cashEquivalents as number) || 0,
                ebitda: (row.ebitda as number) || 0,
              };
            }
          } catch { /* use fallback */ }

          // Fallback financial data from hardcoded
          if (!effectiveFin && finData) {
            effectiveFin = {
              revenue: finData.revenue,
              netIncome: finData.netIncome,
              totalAssets: finData.totalAssets,
              totalEquity: finData.totalEquity,
              totalDebt: finData.totalDebt,
              operatingCashflow: finData.operatingCashflow,
              freeCashflow: finData.freeCashflow,
              grossMargin: finData.grossMargin,
              operatingMargin: finData.operatingMargin,
              profitMargin: finData.profitMargin,
              roe: finData.roe,
              roa: finData.roa,
              debtToEquity: finData.debtToEquity,
              evToEbitda: finData.evToEbitda,
              eps: finData.eps,
              bookValuePerShare: finData.bookValuePerShare,
              revenueGrowth: finData.revenueGrowth,
              earningsGrowth: finData.earningsGrowth,
              cashEquivalents: 0,
              ebitda: 0,
            };
          }

          const sector = stock?.sector || finData?.sector || '';
          const fundamentals: StockFundamentals = {
            ticker: stock?.ticker || '',
            price: currentPrice,
            eps: stock?.eps || finData?.eps || effectiveFin?.eps || 0,
            bookValuePerShare: stock?.bookValuePerShare || finData?.bookValuePerShare || effectiveFin?.bookValuePerShare || 0,
            sharesOutstanding: stock?.sharesOutstanding || finData?.sharesOutstanding || 0,
            marketCap: stock?.marketCap || finData?.marketCap || 0,
            dividendYield: stock?.dividendYield || finData?.dividendYield || 0,
            peRatio: pe,
            pbRatio: pb,
            beta: stock?.beta || finData?.beta || 1.0,
            roe: effectiveFin?.roe || finData?.roe || 0,
            roa: effectiveFin?.roa || finData?.roa || 0,
            debtToEquity: effectiveFin?.debtToEquity || finData?.debtToEquity || 0,
            evToEbitda: effectiveFin?.evToEbitda || finData?.evToEbitda || 0,
            revenue: effectiveFin?.revenue || finData?.revenue || 0,
            netIncome: effectiveFin?.netIncome || finData?.netIncome || 0,
            totalAssets: effectiveFin?.totalAssets || finData?.totalAssets || 0,
            totalEquity: effectiveFin?.totalEquity || finData?.totalEquity || 0,
            totalDebt: effectiveFin?.totalDebt || finData?.totalDebt || 0,
            operatingCashflow: effectiveFin?.operatingCashflow || finData?.operatingCashflow || 0,
            freeCashflow: effectiveFin?.freeCashflow || finData?.freeCashflow || 0,
            grossMargin: effectiveFin?.grossMargin || finData?.grossMargin || 0,
            operatingMargin: effectiveFin?.operatingMargin || finData?.operatingMargin || 0,
            profitMargin: effectiveFin?.profitMargin || finData?.profitMargin || 0,
            revenueGrowth: effectiveFin?.revenueGrowth || finData?.revenueGrowth || 0,
            earningsGrowth: effectiveFin?.earningsGrowth || finData?.earningsGrowth || 0,
            usdRevenuePct: finData?.usdRevenuePct || 0,
            cashEquivalents: effectiveFin?.cashEquivalents ?? Math.max(0, (effectiveFin?.totalAssets || 0) - (effectiveFin?.totalEquity || 0) - (effectiveFin?.totalDebt || 0)),
            minorityInterests: 0,
            ebitda: effectiveFin?.ebitda || 0,
          };

          // Sector averages
          let sectorAvg: SectorAverages = {
            avgPE: 8.5, avgPB: 1.2, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05,
          };
          try {
            const { data: sectorData } = await supabase
              .from('SectorStats')
              .select('*')
              .eq('sector', sector)
              .single();
            if (sectorData) {
              const stats = sectorData as SupabaseSectorStats;
              sectorAvg = {
                avgPE: stats.avgPE || 8.5,
                avgPB: stats.avgPB || 1.2,
                avgROE: stats.avgROE || 0.14,
                avgEVEbitda: stats.avgEVEbitda || 6.5,
                avgDividendYield: (stats.avgDividendYield || 5.0) / 100,
              };
            }
          } catch { /* use defaults */ }

          if (sectorAvg.avgPE === 8.5 && sectorAvg.avgPB === 1.2 && sector) {
            const hardcoded = getHardcodedSectorAverages(sector);
            sectorAvg = hardcoded;
          }

          const valuation = runAllModels(fundamentals, sectorAvg, DEFAULT_MARKET_PARAMS, sector);
          fairValue = valuation.averageFairValue;
          upside = valuation.averageUpside;

          if (fairValue > 0 && marketValue > 0) {
            totalWeightedFairValue += fairValue * shares;
          }
        } catch (valErr) {
          console.warn('Valuation failed for holding:', holding.stockId, valErr);
        }
      }

      holdingsValuation.push({
        stockId: holding.stockId,
        ticker: stock?.ticker || '',
        name: stock?.name || '',
        shares,
        avgCost,
        currentPrice,
        marketValue,
        costBasis,
        pnl,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        fairValue: fairValue !== null ? Math.round(fairValue * 100) / 100 : null,
        upside: upside !== null ? Math.round(upside * 100) / 100 : null,
        sector: stock?.sector || '',
      });
    }

    // Compute portfolio-level weighted averages
    const weightedPE = totalSharesValue > 0 ? totalWeightedPE / totalSharesValue : 0;
    const weightedPB = totalSharesValue > 0 ? totalWeightedPB / totalSharesValue : 0;
    const weightedDivYield = totalSharesValue > 0 ? totalWeightedDivYield / totalSharesValue : 0;
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    const averageFairValue = totalSharesValue > 0 ? totalWeightedFairValue / (totalSharesValue / (holdings.length > 0 ? holdings.reduce((sum: number, h: { shares: number; avgCost: number }) => sum + h.shares * h.avgCost, 0) / totalValue : 1)) : 0;
    const averageUpside = totalValue > 0 ? ((totalWeightedFairValue - totalValue) / totalValue) * 100 : 0;

    return NextResponse.json({
      portfolio: {
        ...portfolio,
        holdings,
      },
      valuation: {
        totalValue: Math.round(totalValue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalPnL: Math.round(totalPnL * 100) / 100,
        totalPnLPercent: Math.round(totalPnLPercent * 100) / 100,
        weightedPE: Math.round(weightedPE * 100) / 100,
        weightedPB: Math.round(weightedPB * 100) / 100,
        weightedDividendYield: Math.round(weightedDivYield * 10000) / 100,
        averageFairValue: Math.round(averageFairValue * 100) / 100,
        averageUpside: Math.round(averageUpside * 100) / 100,
        holdingsValuation,
      },
    });
  } catch (err) {
    console.error('Unexpected error fetching portfolio:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// ── DELETE: Delete a portfolio ──────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(
    'api/portfolio',
    ip,
    RATE_LIMITS.portfolio.limit,
    RATE_LIMITS.portfolio.windowMs,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } },
    );
  }

  const { id } = await params;
  const idValidation = PortfolioIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Invalid portfolio ID', details: idValidation.error.issues },
      { status: 400 },
    );
  }

  try {
    // Check portfolio exists
    const { data: existing, error: findError } = await supabase
      .from('Portfolio')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 },
      );
    }

    // Delete holdings first (cascade should handle this, but be explicit)
    await supabase.from('PortfolioHolding').delete().eq('portfolioId', id);

    // Delete portfolio
    const { error: deleteError } = await supabase
      .from('Portfolio')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase error deleting portfolio:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete portfolio', details: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Portfolio deleted successfully' });
  } catch (err) {
    console.error('Unexpected error deleting portfolio:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
