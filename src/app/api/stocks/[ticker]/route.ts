import { NextResponse } from 'next/server';
import { supabase, type SupabaseStock, type SupabaseFinancialData, type SupabasePriceHistory, type SupabaseTechnicalIndicator, type SupabaseSectorStats } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';
import { runAllModels, type StockFundamentals, type SectorAverages, DEFAULT_MARKET_PARAMS } from '@/lib/valuation-engine';

export const dynamic = 'force-dynamic';

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
        id: masterStock.ticker,
        ticker: masterStock.ticker,
        name: masterStock.name,
        nameAr: masterStock.nameAr,
        sector: masterStock.sector,
        industry: masterStock.industry,
        isin: '',
        yahooSymbol: masterStock.yahooSymbol,
        price: 0,
        marketCap: 0,
        peRatio: 0,
        pbRatio: 0,
        eps: 0,
        bookValuePerShare: 0,
        dividendYield: 0,
        beta: 1.0,
        sharesOutstanding: 0,
        fiftyTwoWeekHigh: 0,
        fiftyTwoWeekLow: 0,
        avgVolume: 0,
        description: masterStock.description,
        descriptionAr: masterStock.descriptionAr,
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
    let technicalIndicators: SupabaseTechnicalIndicator[] = [];
    try {
      const { data, error } = await supabase
        .from('TechnicalIndicator')
        .select('*')
        .eq('stockId', stock.id)
        .order('date', { ascending: false })
        .limit(30);

      if (!error && data) {
        technicalIndicators = data as SupabaseTechnicalIndicator[];
      }
    } catch (err) {
      console.warn('Supabase technical indicators query failed:', err);
    }

    // Get sector averages for valuation
    let sectorAvg: SectorAverages = {
      avgPE: 8.5, avgPB: 1.2, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 5.0,
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
          avgDividendYield: stats.avgDividendYield || 5.0,
        };
      }
    } catch {
      // Use defaults
    }

    // Run valuation if we have enough data
    let valuation = null;
    const latestFinancial = financialData?.[0];
    if (stock.price > 0 || (latestFinancial && latestFinancial.eps > 0)) {
      const fundamentals: StockFundamentals = {
        ticker: stock.ticker,
        price: stock.price,
        eps: stock.eps || latestFinancial?.eps || 0,
        bookValuePerShare: stock.bookValuePerShare || latestFinancial?.bookValuePerShare || 0,
        sharesOutstanding: stock.sharesOutstanding,
        marketCap: stock.marketCap,
        dividendYield: stock.dividendYield,
        peRatio: stock.peRatio || (latestFinancial?.eps ? stock.price / latestFinancial.eps : 0),
        pbRatio: stock.pbRatio || (latestFinancial?.bookValuePerShare ? stock.price / latestFinancial.bookValuePerShare : 0),
        beta: stock.beta,
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
    }

    return NextResponse.json({
      stock: {
        ...stock,
        financialData,
        priceHistory,
        technicalIndicators,
      },
      valuation,
      sectorAvg,
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
