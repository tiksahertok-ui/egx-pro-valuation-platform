import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let stocks;
    try {
      stocks = await db.stock.findMany({
        orderBy: { marketCap: 'desc' },
        include: {
          valuationResults: true,
        },
      });
    } catch {
      stocks = [];
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
        valuationResults: [],
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
      valuationResults: [],
    }));
    return NextResponse.json({ stocks: masterStocks, total: masterStocks.length, source: 'master_fallback' });
  }
}
