// GET /api/stocks - List all stocks with current valuation summary
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stocks = await db.stock.findMany({
      orderBy: { marketCap: 'desc' },
      include: {
        valuations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          where: { model: 'Composite (Weighted)' },
        },
      },
    });

    const result = stocks.map((stock) => {
      const latestValuation = stock.valuations[0];
      return {
        id: stock.id,
        ticker: stock.ticker,
        name: stock.name,
        nameAr: stock.nameAr,
        sector: stock.sector,
        industry: stock.industry,
        marketCap: stock.marketCap,
        price: stock.price,
        change: 0, // Would need previous close
        beta: stock.beta,
        dividendYield: stock.dividendYield,
        peRatio: stock.peRatio,
        pbRatio: stock.pbRatio,
        eps: stock.eps,
        fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
        avgVolume: stock.avgVolume,
        currency: stock.currency,
        fairValue: latestValuation?.fairValue ?? null,
        upside: latestValuation?.upside ?? null,
        valuationModel: latestValuation?.model ?? null,
        confidence: latestValuation?.confidence ?? null,
      };
    });

    return NextResponse.json({ stocks: result, count: result.length });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
  }
}
