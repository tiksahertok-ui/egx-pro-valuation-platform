import { NextResponse } from 'next/server';
import { supabase, type SupabaseStock } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let stocks: SupabaseStock[] = [];

    try {
      const { data, error } = await supabase
        .from('Stock')
        .select('*')
        .order('marketCap', { ascending: false, nullsFirst: false });

      if (!error && data) {
        stocks = data as SupabaseStock[];
      }
    } catch (err) {
      console.warn('Supabase query failed:', err);
    }

    // If no stocks in DB, use master list
    if (stocks.length === 0) {
      const masterStocks = EGX_STOCKS.map(s => ({
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
        lastPriceAt: null,
        description: s.description,
        descriptionAr: s.descriptionAr,
      }));
      return NextResponse.json({ stocks: masterStocks, total: masterStocks.length, source: 'master' });
    }

    return NextResponse.json({ stocks, total: stocks.length, source: 'database' });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    // Fallback to master list
    const masterStocks = EGX_STOCKS.map(s => ({
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
      lastPriceAt: null,
      description: s.description,
      descriptionAr: s.descriptionAr,
    }));
    return NextResponse.json({ stocks: masterStocks, total: masterStocks.length, source: 'master_fallback' });
  }
}
