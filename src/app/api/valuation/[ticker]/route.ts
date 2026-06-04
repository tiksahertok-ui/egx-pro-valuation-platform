// GET /api/valuation/[ticker] - Get valuation results for a stock
// If none exist, run all 8 models and save results
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { runAllValuations, FinancialDataInput } from '@/lib/valuation';
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
          orderBy: { year: 'asc' },
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    // Check if valuation results already exist
    const existingValuations = await db.valuationResult.findMany({
      where: { stockId: stock.id },
      orderBy: { createdAt: 'desc' },
    });

    // If valuations exist and are recent (less than 24 hours old), return them
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentValuations = existingValuations.filter(v => v.createdAt > oneDayAgo);

    if (recentValuations.length >= 9) {
      return NextResponse.json({
        ticker: stock.ticker,
        name: stock.name,
        currentPrice: stock.price,
        valuations: recentValuations.map(v => ({
          model: v.model,
          fairValue: v.fairValue,
          bearCase: v.bearCase,
          baseCase: v.baseCase,
          bullCase: v.bullCase,
          upside: v.upside,
          confidence: v.confidence,
          assumptions: v.assumptions,
          createdAt: v.createdAt,
        })),
        weightedFairValue: calculateWeightedAverage(recentValuations, stock.price),
      });
    }

    // Get sector stats
    const sectorStats = await db.sectorStats.findUnique({
      where: { sector: stock.sector },
    });

    // Convert financials to the format expected by valuation engine
    const financialInputs: FinancialDataInput[] = stock.financials.map(f => ({
      revenue: f.revenue,
      operatingIncome: f.operatingIncome,
      ebitda: f.ebitda,
      depreciation: f.depreciation,
      taxRate: f.taxRate,
      capex: f.capitalExpenditure,
      changeInNWC: f.changeInNWC,
      operatingCashFlow: f.operatingCashFlow,
      totalAssets: f.totalAssets,
      totalLiabilities: f.totalLiabilities,
      cash: f.cash,
      sharesOutstanding: f.sharesOutstanding,
      longTermDebt: f.longTermDebt,
      shortTermDebt: f.shortTermDebt,
      totalEquity: f.totalEquity,
      netIncome: f.netIncome,
      currentAssets: f.currentAssets,
      currentLiabilities: f.currentLiabilities,
      interestExpense: f.interestExpense,
      costOfRevenue: f.costOfRevenue,
      freeCashFlow: f.freeCashFlow,
      year: f.year,
      dividendsPerShare: f.dividendsPerShare,
      netBorrowing: f.netBorrowing,
      grossProfit: f.grossProfit,
      operatingExpenses: f.operatingExpenses,
      eps: f.eps,
      hasOCI: f.hasOCI,
    }));

    if (financialInputs.length === 0) {
      return NextResponse.json({ error: 'No financial data available' }, { status: 400 });
    }

    // Run all valuations
    const valuationResults = await runAllValuations(
      {
        id: stock.id,
        ticker: stock.ticker,
        name: stock.name,
        sector: stock.sector,
        price: stock.price,
        marketCap: stock.marketCap,
        beta: stock.beta,
        eps: stock.eps,
        bookValuePerShare: stock.bookValuePerShare,
        peRatio: stock.peRatio,
        pbRatio: stock.pbRatio,
        dividendYield: stock.dividendYield,
        sharesOutstanding: stock.sharesOutstanding,
      },
      financialInputs,
      sectorStats ? {
        avgPE: sectorStats.avgPE,
        avgPB: sectorStats.avgPB,
        avgEVEbitda: sectorStats.avgEVEbitda,
        avgDivYield: sectorStats.avgDivYield,
        avgROE: sectorStats.avgROE,
        avgROA: sectorStats.avgROA,
        avgDebtEquity: sectorStats.avgDebtEquity,
      } : null
    );

    // Delete old valuations and save new ones
    await db.valuationResult.deleteMany({
      where: { stockId: stock.id },
    });

    for (const result of valuationResults) {
      // Sanitize NaN values to 0
      const safeResult = {
        stockId: stock.id,
        model: result.model,
        fairValue: isNaN(result.fairValue) ? 0 : result.fairValue,
        bearCase: isNaN(result.bearCase) ? 0 : result.bearCase,
        baseCase: isNaN(result.baseCase) ? 0 : result.baseCase,
        bullCase: isNaN(result.bullCase) ? 0 : result.bullCase,
        upside: isNaN(result.upside) ? 0 : result.upside,
        confidence: isNaN(result.confidence) ? 0.5 : result.confidence,
        assumptions: result.assumptions || '',
      };
      await db.valuationResult.create({
        data: safeResult,
      });
    }

    const weightedFairValue = calculateWeightedAverage(valuationResults.map(v => ({
      model: v.model,
      fairValue: v.fairValue,
      upside: v.upside,
      confidence: v.confidence,
      createdAt: new Date(),
      bearCase: v.bearCase,
      baseCase: v.baseCase,
      bullCase: v.bullCase,
      assumptions: v.assumptions,
    })), stock.price);

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      currentPrice: stock.price,
      valuations: valuationResults.map(v => ({
        model: v.model,
        fairValue: v.fairValue,
        bearCase: v.bearCase,
        baseCase: v.baseCase,
        bullCase: v.bullCase,
        upside: v.upside,
        confidence: v.confidence,
        assumptions: v.assumptions,
        createdAt: new Date(),
      })),
      weightedFairValue,
    });
  } catch (error) {
    console.error('Error running valuation:', error);
    return NextResponse.json({ error: 'Failed to run valuation' }, { status: 500 });
  }
}

function calculateWeightedAverage(valuations: { model: string; fairValue: number; upside: number; confidence: number }[], currentPrice: number = 0): {
  fairValue: number;
  upside: number;
} {
  if (valuations.length === 0) return { fairValue: 0, upside: 0 };

  const composite = valuations.find(v => v.model === 'Composite (Weighted)');
  if (composite) {
    const upside = currentPrice > 0 ? ((composite.fairValue - currentPrice) / currentPrice) * 100 : composite.upside;
    return {
      fairValue: composite.fairValue,
      upside: parseFloat(upside.toFixed(2)),
    };
  }

  // Fallback: confidence-weighted average
  const totalConfidence = valuations.reduce((sum, v) => sum + v.confidence, 0);
  if (totalConfidence === 0) return { fairValue: 0, upside: 0 };

  const fairValue = valuations.reduce((sum, v) => sum + v.fairValue * v.confidence, 0) / totalConfidence;
  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;
  return { fairValue: parseFloat(fairValue.toFixed(2)), upside: parseFloat(upside.toFixed(2)) };
}
