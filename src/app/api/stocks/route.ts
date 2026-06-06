import { NextResponse } from 'next/server';
import { supabase, type SupabaseStock } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';
import { getFinancialDataByTicker } from '@/lib/data/egx-financial-data';

export const dynamic = 'force-dynamic';

// Helper: convert a master-list entry to a SupabaseStock-like shape with hardcoded financial data
function masterToStock(s: typeof EGX_STOCKS[number]): SupabaseStock {
  const finData = getFinancialDataByTicker(s.ticker);
  return {
    id: s.ticker,
    ticker: s.ticker,
    name: s.name,
    nameAr: s.nameAr,
    sector: s.sector,
    industry: s.industry,
    price: finData?.price || 0,
    marketCap: finData?.marketCap || 0,
    peRatio: finData?.peRatio || 0,
    pbRatio: finData?.pbRatio || 0,
    eps: finData?.eps || 0,
    bookValuePerShare: finData?.bookValuePerShare || 0,
    dividendYield: finData?.dividendYield || 0,
    beta: finData?.beta || 1.0,
    sharesOutstanding: finData?.sharesOutstanding || 0,
    fiftyTwoWeekHigh: finData?.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: finData?.fiftyTwoWeekLow || 0,
    avgVolume: finData?.avgVolume || 0,
    egx30Beta: 0,
    exchange: 'EGX',
    currency: 'EGP',
    listedDate: null,
    description: s.description,
    descriptionAr: s.descriptionAr,
    logo: null,
    lastPriceAt: null,
    lastFinancialsAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    // 1. Get stocks from Supabase DB
    let dbStocks: SupabaseStock[] = [];
    try {
      const { data, error } = await supabase
        .from('Stock')
        .select('*')
        .order('marketCap', { ascending: false, nullsFirst: false });

      if (!error && data) {
        dbStocks = data as SupabaseStock[];
      }
    } catch (err) {
      console.warn('Supabase query failed:', err);
    }

    // 2. Build a map of DB stocks by ticker for quick lookup
    const dbMap = new Map<string, SupabaseStock>();
    for (const s of dbStocks) {
      dbMap.set(s.ticker, s);
    }

    // 3. Merge: for each master list stock, use DB data if available, otherwise use hardcoded/master entry
    const mergedStocks: SupabaseStock[] = EGX_STOCKS.map(masterStock => {
      const dbStock = dbMap.get(masterStock.ticker);
      if (dbStock) {
        // If DB stock has no financial data, enrich from hardcoded data
        const finData = getFinancialDataByTicker(masterStock.ticker);
        if (finData && (dbStock.price === 0 || dbStock.eps === 0)) {
          return {
            ...dbStock,
            price: dbStock.price || finData.price,
            eps: dbStock.eps || finData.eps,
            bookValuePerShare: dbStock.bookValuePerShare || finData.bookValuePerShare,
            peRatio: dbStock.peRatio || finData.peRatio,
            pbRatio: dbStock.pbRatio || finData.pbRatio,
            marketCap: dbStock.marketCap || finData.marketCap,
            dividendYield: dbStock.dividendYield || finData.dividendYield,
            beta: dbStock.beta || finData.beta,
            sharesOutstanding: dbStock.sharesOutstanding || finData.sharesOutstanding,
            fiftyTwoWeekHigh: dbStock.fiftyTwoWeekHigh || finData.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: dbStock.fiftyTwoWeekLow || finData.fiftyTwoWeekLow,
            avgVolume: dbStock.avgVolume || finData.avgVolume,
          };
        }
        return dbStock;
      }
      return masterToStock(masterStock);
    });

    // 4. Also include any DB stocks that are NOT in the master list (edge case)
    const masterTickers = new Set(EGX_STOCKS.map(s => s.ticker));
    for (const dbStock of dbStocks) {
      if (!masterTickers.has(dbStock.ticker)) {
        mergedStocks.push(dbStock);
      }
    }

    // 5. Sort: stocks with data (price > 0) first, then alphabetically
    mergedStocks.sort((a, b) => {
      const aHasData = a.price > 0 || a.marketCap > 0 ? 1 : 0;
      const bHasData = b.price > 0 || b.marketCap > 0 ? 1 : 0;
      if (bHasData !== aHasData) return bHasData - aHasData;
      return a.ticker.localeCompare(b.ticker);
    });

    return NextResponse.json({
      stocks: mergedStocks,
      total: mergedStocks.length,
      dbCount: dbStocks.length,
      masterCount: EGX_STOCKS.length,
      source: 'merged',
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    // Fallback to master list with financial data
    const masterStocks = EGX_STOCKS.map(s => masterToStock(s));
    return NextResponse.json({
      stocks: masterStocks,
      total: masterStocks.length,
      dbCount: 0,
      masterCount: EGX_STOCKS.length,
      source: 'master_fallback',
    });
  }
}
