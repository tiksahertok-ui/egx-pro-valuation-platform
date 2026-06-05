import { NextResponse } from 'next/server';
import { supabase, type SupabaseSectorStats, type SupabaseStock } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let sectors: SupabaseSectorStats[] = [];

    try {
      const { data, error } = await supabase
        .from('SectorStats')
        .select('*')
        .order('totalMarketCap', { ascending: false, nullsFirst: false });

      if (!error && data) {
        sectors = data as SupabaseSectorStats[];
      }
    } catch (err) {
      console.warn('Supabase sector stats query failed:', err);
    }

    // If no sector stats, compute from stocks in DB
    if (sectors.length === 0) {
      try {
        const { data, error } = await supabase
          .from('Stock')
          .select('sector, marketCap, peRatio, pbRatio, eps, bookValuePerShare, dividendYield')
          .gt('price', 0);

        if (!error && data) {
          const stocks = data as Pick<SupabaseStock, 'sector' | 'marketCap' | 'peRatio' | 'pbRatio' | 'eps' | 'bookValuePerShare' | 'dividendYield'>[];

          const sectorMap = new Map<string, Pick<SupabaseStock, 'sector' | 'marketCap' | 'peRatio' | 'pbRatio' | 'eps' | 'bookValuePerShare' | 'dividendYield'>[]>();

          for (const stock of stocks) {
            if (!sectorMap.has(stock.sector)) {
              sectorMap.set(stock.sector, []);
            }
            sectorMap.get(stock.sector)!.push(stock);
          }

          sectors = Array.from(sectorMap.entries()).map(([sector, s]) => {
            const totalMarketCap = s.reduce((sum, st) => sum + (st.marketCap || 0), 0);
            const withPE = s.filter(st => st.peRatio > 0);
            const withPB = s.filter(st => st.pbRatio > 0);
            const withDY = s.filter(st => st.dividendYield > 0);

            return {
              id: sector,
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
              updatedAt: new Date().toISOString(),
            } as SupabaseSectorStats;
          });
        }
      } catch (err) {
        console.warn('Supabase stock aggregation failed:', err);
      }
    }

    // Final fallback: compute from master list
    if (sectors.length === 0) {
      const sectorSet = new Set(EGX_STOCKS.map(s => s.sector));
      sectors = Array.from(sectorSet).map(sector => ({
        id: sector,
        sector,
        sectorAr: '',
        stockCount: EGX_STOCKS.filter(s => s.sector === sector).length,
        totalMarketCap: 0,
        avgPE: 0,
        avgPB: 0,
        avgROE: 0,
        avgROA: 0,
        avgDebtEquity: 0,
        avgEVEbitda: 0,
        weightedPE: 0,
        weightedPB: 0,
        avgDividendYield: 0,
        updatedAt: new Date().toISOString(),
      })) as SupabaseSectorStats[];
    }

    return NextResponse.json({ sectors, total: sectors.length });
  } catch (error) {
    console.error('Error fetching sectors:', error);
    return NextResponse.json({ sectors: [], total: 0 });
  }
}
