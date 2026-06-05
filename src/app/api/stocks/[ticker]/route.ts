import { NextResponse } from 'next/server';
import { supabase, type SupabaseStock, type SupabaseFinancialData, type SupabasePriceHistory, type SupabaseSectorStats } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';
import { runAllModels, type StockFundamentals, type SectorAverages, DEFAULT_MARKET_PARAMS } from '@/lib/valuation-engine';

export const dynamic = 'force-dynamic';

// Helper to safely map technical indicators, handling macdHistogram vs macdHist field name
function mapTechnicalIndicator(ti: Record<string, unknown>) {
  return {
    date: (ti.date as string) || '',
    rsi14: (ti.rsi14 as number) ?? 0,
    macdLine: (ti.macdLine as number) ?? 0,
    macdSignal: (ti.macdSignal as number) ?? 0,
    // DB stores as macdHistogram, frontend expects macdHist
    macdHist: ((ti.macdHistogram as number) ?? (ti.macdHist as number)) ?? 0,
    bbUpper: (ti.bbUpper as number) ?? 0,
    bbMiddle: (ti.bbMiddle as number) ?? 0,
    bbLower: (ti.bbLower as number) ?? 0,
    sma20: (ti.sma20 as number) ?? 0,
    sma50: (ti.sma50 as number) ?? 0,
    sma200: (ti.sma200 as number) ?? 0,
    ema12: (ti.ema12 as number) ?? 0,
    ema26: (ti.ema26 as number) ?? 0,
    atr14: (ti.atr14 as number) ?? 0,
    adx14: (ti.adx14 as number) ?? 0,
    stochasticK: (ti.stochasticK as number) ?? 0,
    stochasticD: (ti.stochasticD as number) ?? 0,
    williamsR: (ti.williamsR as number) ?? 0,
    cci14: (ti.cci14 as number) ?? 0,
    obv: (ti.obv as number) ?? 0,
  };
}

// Safe Supabase query wrapper - always returns data or null, never throws
async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string; code: string } | null }>,
  label: string
): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn(`[stocks/[ticker]] ${label} query error:`, error.message, error.code);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`[stocks/[ticker]] ${label} query exception:`, err);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    // ============================================================
    // 1. Get stock from Supabase or fall back to master list
    // ============================================================
    let stock: SupabaseStock | null = null;

    const dbStock = await safeQuery<SupabaseStock>(
      () => supabase
        .from('Stock')
        .select('*')
        .eq('ticker', ticker.toUpperCase())
        .single(),
      'Stock'
    );

    if (dbStock) {
      stock = dbStock;
    }

    // Fallback to master list if not found in DB
    if (!stock) {
      const masterStock = EGX_STOCKS.find(s => s.ticker === ticker.toUpperCase());
      if (!masterStock) {
        return NextResponse.json({
          stock: null,
          valuation: null,
          sectorAvg: { avgPE: 0, avgPB: 0, avgROE: 0, avgEVEbitda: 0 },
          error: 'Stock not found',
        }, { status: 200 }); // Return 200 with null data so frontend doesn't crash
      }
      stock = {
        id: `stock_${masterStock.ticker.toLowerCase()}`,
        ticker: masterStock.ticker,
        name: masterStock.name,
        nameAr: masterStock.nameAr,
        sector: masterStock.sector,
        industry: masterStock.industry,
        marketCap: 0,
        price: 0,
        sharesOutstanding: 0,
        beta: 1.0,
        egx30Beta: 0,
        dividendYield: 0,
        peRatio: 0,
        pbRatio: 0,
        eps: 0,
        bookValuePerShare: 0,
        fiftyTwoWeekHigh: 0,
        fiftyTwoWeekLow: 0,
        avgVolume: 0,
        exchange: 'EGX',
        currency: 'EGP',
        listedDate: null,
        description: masterStock.description,
        descriptionAr: masterStock.descriptionAr,
        logo: null,
        lastPriceAt: null,
        lastFinancialsAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // ============================================================
    // 2. Get financial data
    // ============================================================
    let financialData: SupabaseFinancialData[] = [];
    const dbFinancials = await safeQuery<SupabaseFinancialData[]>(
      () => supabase
        .from('FinancialData')
        .select('*')
        .eq('stockId', stock!.id)
        .order('year', { ascending: false })
        .limit(5),
      'FinancialData'
    );
    if (dbFinancials && dbFinancials.length > 0) {
      financialData = dbFinancials;
    }

    // ============================================================
    // 3. Get price history
    // ============================================================
    let priceHistory: SupabasePriceHistory[] = [];
    const dbPrices = await safeQuery<SupabasePriceHistory[]>(
      () => supabase
        .from('PriceHistory')
        .select('*')
        .eq('stockId', stock!.id)
        .order('date', { ascending: false })
        .limit(365),
      'PriceHistory'
    );
    if (dbPrices && dbPrices.length > 0) {
      priceHistory = dbPrices;
    }

    // ============================================================
    // 4. Get technical indicators
    // ============================================================
    let technicalIndicators: Array<Record<string, unknown>> = [];
    const dbTech = await safeQuery<Array<Record<string, unknown>>>(
      () => supabase
        .from('TechnicalIndicator')
        .select('*')
        .eq('stockId', stock!.id)
        .order('date', { ascending: false })
        .limit(30) as unknown as Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string; code: string } | null }>,
      'TechnicalIndicator'
    );
    if (dbTech && dbTech.length > 0) {
      technicalIndicators = dbTech;
    }

    // ============================================================
    // 5. Get sector averages for valuation
    // ============================================================
    let sectorAvg: SectorAverages = {
      avgPE: 8.5, avgPB: 1.2, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05,
    };
    const dbSectorStats = await safeQuery<SupabaseSectorStats>(
      () => supabase
        .from('SectorStats')
        .select('*')
        .eq('sector', stock!.sector)
        .single(),
      'SectorStats'
    );
    if (dbSectorStats) {
      sectorAvg = {
        avgPE: dbSectorStats.avgPE || 8.5,
        avgPB: dbSectorStats.avgPB || 1.2,
        avgROE: dbSectorStats.avgROE || 0.14,
        avgEVEbitda: dbSectorStats.avgEVEbitda || 6.5,
        avgDividendYield: (dbSectorStats.avgDividendYield || 5.0) / 100,
      };
    }

    // ============================================================
    // 6. Run valuation if we have enough data
    // ============================================================
    let valuation = null;
    const latestFinancial = financialData?.[0];
    const hasBasicData = stock.price > 0 || (latestFinancial && (latestFinancial.eps > 0 || latestFinancial.bookValuePerShare > 0));

    if (hasBasicData) {
      try {
        const fundamentals: StockFundamentals = {
          ticker: stock.ticker,
          price: stock.price || 0,
          eps: stock.eps || latestFinancial?.eps || 0,
          bookValuePerShare: stock.bookValuePerShare || latestFinancial?.bookValuePerShare || 0,
          sharesOutstanding: stock.sharesOutstanding || 0,
          marketCap: stock.marketCap || 0,
          dividendYield: stock.dividendYield || 0,
          peRatio: stock.peRatio || (latestFinancial?.eps ? stock.price / latestFinancial.eps : 0),
          pbRatio: stock.pbRatio || (latestFinancial?.bookValuePerShare ? stock.price / latestFinancial.bookValuePerShare : 0),
          beta: stock.beta || 1.0,
          roe: latestFinancial?.roe || 0,
          roa: latestFinancial?.roa || 0,
          debtToEquity: latestFinancial?.debtToEquity || 0,
          evToEbitda: latestFinancial?.evToEbitda || 0,
          revenue: latestFinancial?.revenue || 0,
          netIncome: latestFinancial?.netIncome || 0,
          totalAssets: latestFinancial?.totalAssets || 0,
          totalEquity: latestFinancial?.totalEquity || 0,
          totalDebt: latestFinancial?.totalDebt || 0,
          operatingCashflow: latestFinancial?.operatingCashflow || 0,
          freeCashflow: latestFinancial?.freeCashflow || 0,
          grossMargin: latestFinancial?.grossMargin || 0,
          operatingMargin: latestFinancial?.operatingMargin || 0,
          profitMargin: latestFinancial?.profitMargin || 0,
          revenueGrowth: latestFinancial?.revenueGrowth || 0,
          earningsGrowth: latestFinancial?.earningsGrowth || 0,
        };

        valuation = runAllModels(fundamentals, sectorAvg, DEFAULT_MARKET_PARAMS);
      } catch (valErr) {
        console.warn('[stocks/[ticker]] Valuation computation failed:', valErr);
        // Continue without valuation rather than crashing
      }
    }

    // Map technical indicators to normalize field names
    const mappedTechIndicators = technicalIndicators.map(mapTechnicalIndicator);

    // ============================================================
    // 7. Build and return response - ALWAYS return a valid shape
    // ============================================================
    return NextResponse.json({
      stock: {
        ...stock,
        financialData: financialData.map(fd => ({
          year: fd.year,
          revenue: fd.revenue || 0,
          netIncome: fd.netIncome || 0,
          totalAssets: fd.totalAssets || 0,
          totalEquity: fd.totalEquity || 0,
          totalDebt: fd.totalDebt || 0,
          roe: fd.roe || 0,
          roa: fd.roa || 0,
          debtToEquity: fd.debtToEquity || 0,
          grossMargin: fd.grossMargin || 0,
          operatingMargin: fd.operatingMargin || 0,
          profitMargin: fd.profitMargin || 0,
          eps: fd.eps || 0,
          bookValuePerShare: fd.bookValuePerShare || 0,
          operatingCashflow: fd.operatingCashflow || 0,
          freeCashflow: fd.freeCashflow || 0,
          revenueGrowth: fd.revenueGrowth || 0,
          earningsGrowth: fd.earningsGrowth || 0,
          evToEbitda: fd.evToEbitda || 0,
        })),
        priceHistory: priceHistory.map(ph => ({
          date: ph.date,
          open: ph.open || 0,
          high: ph.high || 0,
          low: ph.low || 0,
          close: ph.close || 0,
          volume: ph.volume || 0,
        })),
        technicalIndicators: mappedTechIndicators,
      },
      valuation,
      sectorAvg,
    });
  } catch (error) {
    console.error('[stocks/[ticker]] Unhandled error:', error);
    // Never return 500 - always return a meaningful error with 200 status
    // so the frontend can handle it gracefully
    return NextResponse.json(
      {
        stock: null,
        valuation: null,
        sectorAvg: { avgPE: 0, avgPB: 0, avgROE: 0, avgEVEbitda: 0 },
        error: 'Failed to load stock data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
