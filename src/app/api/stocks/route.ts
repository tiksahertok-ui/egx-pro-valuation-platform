// GET /api/stocks - List all stocks with current valuation summary
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';

const StocksQuerySchema = z.object({
  sector: z.string().optional(),
  sortBy: z.enum(['marketCap', 'ticker', 'peRatio', 'pbRatio', 'dividendYield']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
}).optional();

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError.error;
  try {
    // Parse and validate query params
    const url = request.url;
    const params = new URL(url).searchParams;
    const queryParams = Object.fromEntries(params.entries());
    const parsed = StocksQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
    }
    const query = parsed.data;

    const sector = query?.sector;
    const sortBy = query?.sortBy ?? 'marketCap';
    const order = query?.order ?? 'desc';
    const limit = query?.limit;

    const stocks = await db.stock.findMany({
      where: sector ? { sector } : undefined,
      orderBy: { [sortBy]: order },
      take: limit,
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
