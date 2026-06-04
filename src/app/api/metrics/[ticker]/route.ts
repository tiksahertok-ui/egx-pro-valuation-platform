// GET /api/metrics/[ticker] - Get financial metrics (WACC, CAPM, ROE, ROA, ROIC, etc.)
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { calculateMetrics } from '@/lib/metrics';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;

    const stock = await db.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: {
        financials: {
          orderBy: { year: 'asc' },
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    if (stock.financials.length === 0) {
      return NextResponse.json({ error: 'No financial data available' }, { status: 400 });
    }

    const metrics = calculateMetrics({
      financials: stock.financials.map(f => ({
        revenue: f.revenue,
        costOfRevenue: f.costOfRevenue,
        grossProfit: f.grossProfit,
        operatingExpenses: f.operatingExpenses,
        operatingIncome: f.operatingIncome,
        ebitda: f.ebitda,
        depreciation: f.depreciation,
        interestExpense: f.interestExpense,
        netIncome: f.netIncome,
        eps: f.eps,
        dividendsPerShare: f.dividendsPerShare,
        totalAssets: f.totalAssets,
        currentAssets: f.currentAssets,
        cash: f.cash,
        totalLiabilities: f.totalLiabilities,
        currentLiabilities: f.currentLiabilities,
        longTermDebt: f.longTermDebt,
        shortTermDebt: f.shortTermDebt,
        totalEquity: f.totalEquity,
        sharesOutstanding: f.sharesOutstanding,
        operatingCashFlow: f.operatingCashFlow,
        capitalExpenditure: f.capitalExpenditure,
        freeCashFlow: f.freeCashFlow,
        changeInNWC: f.changeInNWC,
        netBorrowing: f.netBorrowing,
        taxRate: f.taxRate,
        year: f.year,
      })),
      currentPrice: stock.price,
      marketCap: stock.marketCap,
      beta: stock.beta,
      sharesOutstanding: stock.sharesOutstanding,
    });

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      currentPrice: stock.price,
      metrics,
      latestYear: stock.financials[stock.financials.length - 1]?.year,
      dataYears: stock.financials.length,
    });
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return NextResponse.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}
