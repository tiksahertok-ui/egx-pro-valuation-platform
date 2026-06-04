// GET /api/health/[ticker] - Get financial health score for a stock
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';
import { calculateFinancialHealth } from '@/lib/valuation/financial-health';

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
          take: 1,
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    const latestFinancial = stock.financials[0];
    if (!latestFinancial) {
      return NextResponse.json({ error: 'No financial data available for health score' }, { status: 400 });
    }

    const healthResult = calculateFinancialHealth({
      totalAssets: latestFinancial.totalAssets,
      totalLiabilities: latestFinancial.totalLiabilities,
      currentAssets: latestFinancial.currentAssets,
      currentLiabilities: latestFinancial.currentLiabilities,
      cash: latestFinancial.cash,
      netIncome: latestFinancial.netIncome,
      revenue: latestFinancial.revenue,
      operatingCashFlow: latestFinancial.operatingCashFlow,
      capitalExpenditure: latestFinancial.capitalExpenditure,
      longTermDebt: latestFinancial.longTermDebt,
      shortTermDebt: latestFinancial.shortTermDebt,
      totalEquity: latestFinancial.totalEquity,
      interestExpense: latestFinancial.interestExpense,
      freeCashFlow: latestFinancial.freeCashFlow,
      grossProfit: latestFinancial.grossProfit,
    });

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      nameAr: stock.nameAr,
      currentPrice: stock.price,
      financialYear: latestFinancial.year,
      health: healthResult,
    });
  } catch (error) {
    console.error('Error calculating financial health:', error);
    return NextResponse.json({ error: 'Failed to calculate financial health' }, { status: 500 });
  }
}
