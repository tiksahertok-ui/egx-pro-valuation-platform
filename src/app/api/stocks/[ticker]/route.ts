// GET /api/stocks/[ticker] - Get stock detail with latest financial data
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';

const TickerParamsSchema = z.object({
  ticker: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError.error;
  try {
    const { ticker } = await params;

    const parsed = TickerParamsSchema.safeParse({ ticker: ticker.toUpperCase() });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ticker', details: parsed.error.flatten() }, { status: 400 });
    }

    const stock = await db.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: {
        financials: {
          orderBy: { year: 'desc' },
          take: 5,
        },
        valuations: {
          orderBy: { createdAt: 'desc' },
          take: 8,
        },
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    // Calculate some quick metrics from latest financials
    const latestFinancial = stock.financials[0];
    const previousFinancial = stock.financials[1];

    const metrics = latestFinancial ? {
      grossMargin: latestFinancial.revenue > 0 ? latestFinancial.grossProfit / latestFinancial.revenue : 0,
      operatingMargin: latestFinancial.revenue > 0 ? latestFinancial.operatingIncome / latestFinancial.revenue : 0,
      netMargin: latestFinancial.revenue > 0 ? latestFinancial.netIncome / latestFinancial.revenue : 0,
      roe: latestFinancial.totalEquity > 0 ? latestFinancial.netIncome / latestFinancial.totalEquity : 0,
      revenueGrowth: previousFinancial && previousFinancial.revenue > 0
        ? (latestFinancial.revenue - previousFinancial.revenue) / previousFinancial.revenue : 0,
      epsGrowth: previousFinancial && previousFinancial.eps !== 0
        ? (latestFinancial.eps - previousFinancial.eps) / Math.abs(previousFinancial.eps) : 0,
      debtToEquity: latestFinancial.totalEquity > 0
        ? (latestFinancial.longTermDebt + latestFinancial.shortTermDebt) / latestFinancial.totalEquity : 0,
      currentRatio: latestFinancial.currentLiabilities > 0
        ? latestFinancial.currentAssets / latestFinancial.currentLiabilities : 0,
    } : null;

    return NextResponse.json({
      stock: {
        id: stock.id,
        ticker: stock.ticker,
        name: stock.name,
        nameAr: stock.nameAr,
        sector: stock.sector,
        industry: stock.industry,
        marketCap: stock.marketCap,
        price: stock.price,
        beta: stock.beta,
        dividendYield: stock.dividendYield,
        peRatio: stock.peRatio,
        pbRatio: stock.pbRatio,
        eps: stock.eps,
        bookValuePerShare: stock.bookValuePerShare,
        fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
        avgVolume: stock.avgVolume,
        exchange: stock.exchange,
        currency: stock.currency,
        description: stock.description,
        descriptionAr: stock.descriptionAr,
        sharesOutstanding: stock.sharesOutstanding,
      },
      financials: stock.financials,
      valuations: stock.valuations,
      recentPrices: stock.priceHistory,
      quickMetrics: metrics,
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 });
  }
}
