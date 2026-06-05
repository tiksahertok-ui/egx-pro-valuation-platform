import { NextResponse } from 'next/server';
import { supabase, type SupabaseStock, type SupabaseFinancialData, type SupabasePriceHistory, type SupabaseTechnicalIndicator, type SupabaseSectorStats } from '@/lib/supabase';
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    // Get stock from Supabase
    let stock: SupabaseStock | null = null;

    try {
      const { data, error } = await supabase
        .from('Stock')
        .select('*')
        .eq('ticker', ticker.toUpperCase())
        .single();

      if (!error && data) {
        stock = data as SupabaseStock;
      }
    } catch (err) {
      console.warn('Supabase stock query failed:', err);
    }

    // Fallback to master list
    if (!stock) {
      const masterStock = EGX_STOCKS.find(s => s.ticker === ticker.toUpperCase());
      if (!masterStock) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
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

    // Get financial data
    let financialData: SupabaseFinancialData[] = [];
    try {
      const { data, error } = await supabase
        .from('FinancialData')
        .select('*')
        .eq('stockId', stock.id)
        .order('year', { ascending: false })
        .limit(5);

      if (!error && data) {
        financialData = data as SupabaseFinancialData[];
      }
    } catch (err) {
      console.warn('Supabase financial data query failed:', err);
    }

    // Get price history
    let priceHistory: SupabasePriceHistory[] = [];
    try {
      const { data, error } = await supabase
        .from('PriceHistory')
        .select('*')
        .eq('stockId', stock.id)
        .order('date', { ascending: false })
        .limit(365);

      if (!error && data) {
        priceHistory = data as SupabasePriceHistory[];
      }
    } catch (err) {
      console.warn('Supabase price history query failed:', err);
    }

    // Get technical indicators
    let technicalIndicators: Array<Record<string, unknown>> = [];
    try {
      const { data, error } = await supabase
        .from('TechnicalIndicator')
        .select('*')
        .eq('stockId', stock.id)
        .order('date', { ascending: false })
        .limit(30);

      if (!error && data) {
        technicalIndicators = data as Array<Record<string, unknown>>;
      }
    } catch (err) {
      console.warn('Supabase technical indicators query failed:', err);
    }

    // Get sector averages for valuation
    let sectorAvg: SectorAverages = {
      avgPE: 8.5, avgPB: 1.2, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05,
    };
    try {
      const { data, error } = await supabase
        .from('SectorStats')
        .select('*')
        .eq('sector', stock.sector)
        .single();

      if (!error && data) {
        const stats = data as SupabaseSectorStats;
        sectorAvg = {
          avgPE: stats.avgPE || 8.5,
          avgPB: stats.avgPB || 1.2,
          avgROE: stats.avgROE || 0.14,
          avgEVEbitda: stats.avgEVEbitda || 6.5,
          // SectorStats.avgDividendYield is stored as percentage (e.g. 5.0), convert to decimal
          avgDividendYield: (stats.avgDividendYield || 5.0) / 100,
        };
      }
    } catch {
      // Use defaults
    }

    // Run valuation if we have enough data
    let valuation = null;
    const latestFinancial = financialData?.[0];
    const hasBasicData = stock.price > 0 || (latestFinancial && (latestFinancial.eps > 0 || latestFinancial.bookValuePerShare > 0));

    if (hasBasicData) {
      try {
        // DB stores dividendYield as decimal (0.05). Keep as-is for the valuation engine.
        const fundamentals: StockFundamentals = {
          ticker: stock.ticker,
          price: stock.price || 0,
          eps: stock.eps || latestFinancial?.eps || 0,
          bookValuePerShare: stock.bookValuePerShare || latestFinancial?.bookValuePerShare || 0,
          sharesOutstanding: stock.sharesOutstanding || 0,
          marketCap: stock.marketCap || 0,
          dividendYield: stock.dividendYield || 0, // stored as decimal in DB
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
        console.warn('Valuation computation failed:', valErr);
        // Continue without valuation rather than crashing
      }
    }

    // Map technical indicators to normalize field names
    const mappedTechIndicators = technicalIndicators.map(mapTechnicalIndicator);

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
    console.error('Error fetching stock:', error);
    // Never return 500 - always return a meaningful error
    return NextResponse.json(
      { error: 'Failed to load stock data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 } // Return 200 with error info to avoid frontend crashes
    );
  }
}
