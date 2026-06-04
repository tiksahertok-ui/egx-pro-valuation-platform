// GET /api/sectors - Get sector comparison data
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError.error;

  try {
    const sectorStats = await db.sectorStats.findMany({
      orderBy: { totalMarketCap: 'desc' },
    });

    // Get stocks grouped by sector
    const stocks = await db.stock.findMany({
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

    // Build comprehensive sector data
    const sectors = sectorStats.map(ss => ({
      sector: ss.sector,
      avgPE: ss.avgPE,
      avgPB: ss.avgPB,
      avgEVEbitda: ss.avgEVEbitda,
      avgDivYield: ss.avgDivYield,
      avgROE: ss.avgROE,
      avgROA: ss.avgROA,
      avgDebtEquity: ss.avgDebtEquity,
      totalMarketCap: ss.totalMarketCap,
      numCompanies: ss.numCompanies,
      stocks: (stocksBySector[ss.sector] || []).map(s => ({
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
        peVsSector: ss.avgPE > 0 ? ((s.peRatio / ss.avgPE) - 1) * 100 : 0,
        pbVsSector: ss.avgPB > 0 ? ((s.pbRatio / ss.avgPB) - 1) * 100 : 0,
      })),
    }));

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
