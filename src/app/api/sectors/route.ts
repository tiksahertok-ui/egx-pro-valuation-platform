// GET /api/sectors - Get sector comparison data with live averages from the database
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { z } from 'zod';

const SectorsQuerySchema = z.object({
  sector: z.string().optional(),
  includeStocks: z.enum(['true', 'false']).optional(),
}).optional();

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError.error;

  try {
    // Validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsed = SectorsQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
    }

    const sectorFilter = parsed.data?.sector;

    // Get stocks with their latest financials for live computation
    const stocks = await db.stock.findMany({
      where: sectorFilter ? { sector: sectorFilter } : undefined,
      select: {
        id: true,
        ticker: true,
        name: true,
        nameAr: true,
        sector: true,
        price: true,
        marketCap: true,
        peRatio: true,
        pbRatio: true,
        dividendYield: true,
        eps: true,
        beta: true,
        financials: {
          orderBy: { year: 'desc' },
          take: 1,
          select: {
            netIncome: true,
            totalEquity: true,
            totalAssets: true,
            longTermDebt: true,
            shortTermDebt: true,
            ebitda: true,
            totalLiabilities: true,
            cash: true,
            revenue: true,
          },
        },
      },
      orderBy: { marketCap: 'desc' },
    });

    // Group stocks by sector
    const stocksBySector: Record<string, typeof stocks> = {};
    for (const stock of stocks) {
      if (!stocksBySector[stock.sector]) {
        stocksBySector[stock.sector] = [];
      }
      stocksBySector[stock.sector].push(stock);
    }

    // Compute live sector averages from actual stock data
    const sectors = Object.entries(stocksBySector).map(([sector, sectorStocks]) => {
      const totalMarketCap = sectorStocks.reduce((sum, s) => sum + s.marketCap, 0);

      // Market-cap weighted P/E (only stocks with positive P/E)
      const peStocks = sectorStocks.filter(s => s.peRatio > 0);
      const avgPE = peStocks.length > 0
        ? peStocks.reduce((sum, s) => sum + s.peRatio * s.marketCap, 0) / peStocks.reduce((sum, s) => sum + s.marketCap, 0)
        : 0;

      // Market-cap weighted P/B
      const pbStocks = sectorStocks.filter(s => s.pbRatio > 0);
      const avgPB = pbStocks.length > 0
        ? pbStocks.reduce((sum, s) => sum + s.pbRatio * s.marketCap, 0) / pbStocks.reduce((sum, s) => sum + s.marketCap, 0)
        : 0;

      // Market-cap weighted ROE from latest financials
      const avgROE = sectorStocks.reduce((sum, s) => {
        const roe = s.financials[0] && s.financials[0].totalEquity > 0
          ? s.financials[0].netIncome / s.financials[0].totalEquity : 0;
        return sum + roe * s.marketCap;
      }, 0) / (totalMarketCap || 1);

      // Market-cap weighted ROA
      const avgROA = sectorStocks.reduce((sum, s) => {
        const roa = s.financials[0] && s.financials[0].totalAssets > 0
          ? s.financials[0].netIncome / s.financials[0].totalAssets : 0;
        return sum + roa * s.marketCap;
      }, 0) / (totalMarketCap || 1);

      // Market-cap weighted dividend yield
      const avgDivYield = sectorStocks.reduce((sum, s) => sum + s.dividendYield * s.marketCap, 0) / (totalMarketCap || 1);

      // Market-cap weighted debt/equity
      const avgDebtEquity = sectorStocks.reduce((sum, s) => {
        const de = s.financials[0] && s.financials[0].totalEquity > 0
          ? (s.financials[0].longTermDebt + s.financials[0].shortTermDebt) / s.financials[0].totalEquity : 0;
        return sum + de * s.marketCap;
      }, 0) / (totalMarketCap || 1);

      // EV/EBITDA from financials
      const avgEVEbitda = (() => {
        const stocksWithebitda = sectorStocks.filter(s => s.financials[0] && s.financials[0].ebitda > 0);
        if (stocksWithebitda.length === 0) return 0;
        let totalEV = 0;
        let totalEBITDA = 0;
        for (const s of stocksWithebitda) {
          const f = s.financials[0]!;
          const ev = s.marketCap + (f.totalLiabilities - f.cash);
          totalEV += ev;
          totalEBITDA += f.ebitda;
        }
        return totalEBITDA > 0 ? totalEV / totalEBITDA : 0;
      })();

      const sectorAverages = {
        avgPE: parseFloat(avgPE.toFixed(2)),
        avgPB: parseFloat(avgPB.toFixed(2)),
        avgEVEbitda: parseFloat(avgEVEbitda.toFixed(2)),
        avgDivYield: parseFloat(avgDivYield.toFixed(4)),
        avgROE: parseFloat(avgROE.toFixed(4)),
        avgROA: parseFloat(avgROA.toFixed(4)),
        avgDebtEquity: parseFloat(avgDebtEquity.toFixed(4)),
      };

      return {
        sector,
        ...sectorAverages,
        totalMarketCap,
        numCompanies: sectorStocks.length,
        computedAt: new Date().toISOString(),
        stocks: sectorStocks.map(s => ({
          ticker: s.ticker,
          name: s.name,
          nameAr: s.nameAr,
          price: s.price,
          marketCap: s.marketCap,
          peRatio: s.peRatio,
          pbRatio: s.pbRatio,
          dividendYield: s.dividendYield,
          eps: s.eps,
          beta: s.beta,
          // Premium/discount to sector averages
          peVsSector: avgPE > 0 ? ((s.peRatio / avgPE) - 1) * 100 : 0,
          pbVsSector: avgPB > 0 ? ((s.pbRatio / avgPB) - 1) * 100 : 0,
        })),
      };
    }).sort((a, b) => b.totalMarketCap - a.totalMarketCap);

    // Calculate overall market stats
    const totalMarketCap = sectors.reduce((sum, s) => sum + s.totalMarketCap, 0);
    const totalCompanies = sectors.reduce((sum, s) => sum + s.numCompanies, 0);

    return NextResponse.json({
      sectors,
      summary: {
        totalSectors: sectors.length,
        totalCompanies,
        totalMarketCap,
        marketCapFormatted: `EGP ${(totalMarketCap / 1e9).toFixed(1)}B`,
      },
    });
  } catch (error) {
    console.error('Error fetching sectors:', error);
    return NextResponse.json({ error: 'Failed to fetch sectors' }, { status: 500 });
  }
}
