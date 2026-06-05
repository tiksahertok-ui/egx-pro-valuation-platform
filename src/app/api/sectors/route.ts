import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let sectors;
    try {
      sectors = await db.sectorStats.findMany({
        orderBy: { totalMarketCap: 'desc' },
      });
    } catch {
      sectors = [];
    }

    // If no sector stats, compute from stocks
    if (sectors.length === 0) {
      try {
        const stocks = await db.stock.findMany({
          where: { price: { gt: 0 } },
          select: {
            sector: true,
            marketCap: true,
            peRatio: true,
            pbRatio: true,
            eps: true,
            bookValuePerShare: true,
            dividendYield: true,
          },
        });

        const sectorMap = new Map<string, {
          sector: string;
          stocks: typeof stocks;
        }>();

        for (const stock of stocks) {
          if (!sectorMap.has(stock.sector)) {
            sectorMap.set(stock.sector, { sector: stock.sector, stocks: [] });
          }
          sectorMap.get(stock.sector)!.stocks.push(stock);
        }

        sectors = Array.from(sectorMap.entries()).map(([sector, data]) => {
          const s = data.stocks;
          const totalMarketCap = s.reduce((sum, st) => sum + (st.marketCap || 0), 0);
          const withPE = s.filter(st => st.peRatio > 0);
          const withPB = s.filter(st => st.pbRatio > 0);
          const withDY = s.filter(st => st.dividendYield > 0);

          return {
            sector,
            sectorAr: '',
            stockCount: s.length,
            totalMarketCap,
            avgPE: withPE.length > 0 ? withPE.reduce((sum, st) => sum + st.peRatio, 0) / withPE.length : 0,
            avgPB: withPB.length > 0 ? withPB.reduce((sum, st) => sum + st.pbRatio, 0) / withPB.length : 0,
            avgDividendYield: withDY.length > 0 ? withDY.reduce((sum, st) => sum + st.dividendYield, 0) / withDY.length : 0,
            avgROE: 0,
            avgROA: 0,
            avgDebtEquity: 0,
            avgEVEbitda: 0,
            weightedPE: 0,
            weightedPB: 0,
          };
        });
      } catch {
        sectors = [];
      }
    }

    return NextResponse.json({ sectors, total: sectors.length });
  } catch (error) {
    console.error('Error fetching sectors:', error);
    return NextResponse.json({ sectors: [], total: 0 });
  }
}
