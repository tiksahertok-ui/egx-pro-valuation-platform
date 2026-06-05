import { NextResponse } from 'next/server';
import { supabase, type SupabaseStock } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';

export const dynamic = 'force-dynamic';

// Helper: convert a master-list entry to a SupabaseStock-like shape with zeroed financials
function masterToStock(s: typeof EGX_STOCKS[number]): SupabaseStock {
  return {
    id: s.ticker,
    ticker: s.ticker,
    name: s.name,
    nameAr: s.nameAr,
    sector: s.sector,
    industry: s.industry,
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

    // 3. Merge: for each master list stock, use DB data if available, otherwise use zeroed master entry
    const mergedStocks: SupabaseStock[] = EGX_STOCKS.map(masterStock => {
      const dbStock = dbMap.get(masterStock.ticker);
      if (dbStock) {
        // Stock exists in DB - use DB data (which has real prices/financials)
        return dbStock;
      }
      // Stock NOT in DB - add it with zeroed financial data from master list
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
    // Fallback to master list
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
