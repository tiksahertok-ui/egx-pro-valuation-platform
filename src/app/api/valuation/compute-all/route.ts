// POST /api/valuation/compute-all - Compute valuations for all stocks that don't have them
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { runAllValuations, FinancialDataInput } from '@/lib/valuation';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function POST() {
  const authError = await requireAuth();
  if (authError) return authError.error;

  try {
    const stocks = await db.stock.findMany({
      include: {
        financials: { orderBy: { year: 'asc' } },
        valuations: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const results: { ticker: string; status: string; modelsComputed: number }[] = [];

    for (const stock of stocks) {
      // Skip if recent valuations exist (less than 24 hours old)
      const hasRecent = stock.valuations.length > 0 &&
        stock.valuations[0].createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (hasRecent && stock.valuations.length >= 8) {
        results.push({ ticker: stock.ticker, status: 'skipped', modelsComputed: 0 });
        continue;
      }

      if (stock.financials.length === 0) {
        results.push({ ticker: stock.ticker, status: 'no_financials', modelsComputed: 0 });
        continue;
      }

      try {
        const sectorStats = await db.sectorStats.findUnique({
          where: { sector: stock.sector },
        });

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
          await db.valuationResult.create({ data: safeResult });
        }

        results.push({ ticker: stock.ticker, status: 'computed', modelsComputed: valuationResults.length });
      } catch (err) {
        console.error(`Error computing valuation for ${stock.ticker}:`, err);
        results.push({ ticker: stock.ticker, status: 'error', modelsComputed: 0 });
      }
    }

    return NextResponse.json({ computed: results.filter(r => r.status === 'computed').length, skipped: results.filter(r => r.status === 'skipped').length, errors: results.filter(r => r.status === 'error').length, results });
  } catch (error) {
    console.error('Error in compute-all:', error);
    return NextResponse.json({ error: 'Failed to compute valuations' }, { status: 500 });
  }
}
