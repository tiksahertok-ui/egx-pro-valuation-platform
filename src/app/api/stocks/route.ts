import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabase, type SupabaseStock } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';
import { getFinancialDataByTicker } from '@/lib/data/egx-financial-data';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const StocksQuerySchema = z.object({
  sector: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  search: z.string().max(100).optional(),
});

function masterToStock(s: typeof EGX_STOCKS[number]): SupabaseStock {
  const finData = getFinancialDataByTicker(s.ticker);
  return {
    id: s.ticker,
    ticker: s.ticker,
    name: s.name,
    nameAr: s.nameAr,
    sector: s.sector,
    industry: s.industry,
    price: finData?.price || 0,
    marketCap: finData?.marketCap || 0,
    peRatio: finData?.peRatio || 0,
    pbRatio: finData?.pbRatio || 0,
    eps: finData?.eps || 0,
    bookValuePerShare: finData?.bookValuePerShare || 0,
    dividendYield: finData?.dividendYield || 0,
    beta: finData?.beta || 1.0,
    sharesOutstanding: finData?.sharesOutstanding || 0,
    fiftyTwoWeekHigh: finData?.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: finData?.fiftyTwoWeekLow || 0,
    avgVolume: finData?.avgVolume || 0,
    egx30Beta: 0,
    isin: '',
    yahooSymbol: '',
    minorityInterests: 0,
    exchange: 'EGX',
    currency: 'EGP',
    listedDate: null,
    description: s.description,
    descriptionAr: s.descriptionAr,
    logo: null,
    lastPriceAt: null,
    lastFinancialsAt: null,
    lastSyncedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  // P1.3: Rate limiting
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit('api/stocks', ip, RATE_LIMITS.stocks.limit, RATE_LIMITS.stocks.windowMs);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } }
    );
  }

  // P1.2: Validate query parameters
  const { searchParams } = new URL(request.url);
  const parsed = StocksQuerySchema.safeParse({
    sector: searchParams.get('sector'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search'),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.issues }, { status: 400 });
  }

  const { sector, limit, search } = parsed.data;

  try {
    let dbStocks: SupabaseStock[] = [];
    try {
      const { data, error } = await supabase
        .from('Stock')
        .select('*')
        .order('marketCap', { ascending: false, nullsFirst: false });

      if (!error && data) {
        dbStocks = data as SupabaseStock[];
      }
    } catch (err) {
      console.warn('Supabase query failed:', err);
    }

    const dbMap = new Map<string, SupabaseStock>();
    for (const s of dbStocks) {
      dbMap.set(s.ticker, s);
    }

    let mergedStocks: SupabaseStock[] = EGX_STOCKS.map(masterStock => {
      const dbStock = dbMap.get(masterStock.ticker);
      if (dbStock) {
        const finData = getFinancialDataByTicker(masterStock.ticker);
        if (finData && (dbStock.price === 0 || dbStock.eps === 0)) {
          return {
            ...dbStock,
            price: dbStock.price || finData.price,
            eps: dbStock.eps || finData.eps,
            bookValuePerShare: dbStock.bookValuePerShare || finData.bookValuePerShare,
            peRatio: dbStock.peRatio || finData.peRatio,
            pbRatio: dbStock.pbRatio || finData.pbRatio,
            marketCap: dbStock.marketCap || finData.marketCap,
            dividendYield: dbStock.dividendYield || finData.dividendYield,
            beta: dbStock.beta || finData.beta,
            sharesOutstanding: dbStock.sharesOutstanding || finData.sharesOutstanding,
            fiftyTwoWeekHigh: dbStock.fiftyTwoWeekHigh || finData.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: dbStock.fiftyTwoWeekLow || finData.fiftyTwoWeekLow,
            avgVolume: dbStock.avgVolume || finData.avgVolume,
          };
        }
        return dbStock;
      }
      return masterToStock(masterStock);
    });

    const masterTickers = new Set(EGX_STOCKS.map(s => s.ticker));
    for (const dbStock of dbStocks) {
      if (!masterTickers.has(dbStock.ticker)) {
        mergedStocks.push(dbStock);
      }
    }

    // Apply filters
    if (sector) {
      mergedStocks = mergedStocks.filter(s =>
        s.sector.toLowerCase().includes(sector.toLowerCase())
      );
    }
    if (search) {
      const searchLower = search.toLowerCase();
      mergedStocks = mergedStocks.filter(s =>
        s.ticker.toLowerCase().includes(searchLower) ||
        s.name.toLowerCase().includes(searchLower) ||
        s.nameAr.includes(search)
      );
    }

    // Sort: stocks with data first, then alphabetically
    mergedStocks.sort((a, b) => {
      const aHasData = a.price > 0 || a.marketCap > 0 ? 1 : 0;
      const bHasData = b.price > 0 || b.marketCap > 0 ? 1 : 0;
      if (bHasData !== aHasData) return bHasData - aHasData;
      return a.ticker.localeCompare(b.ticker);
    });

    if (limit) {
      mergedStocks = mergedStocks.slice(0, limit);
    }

    return NextResponse.json({
      stocks: mergedStocks,
      total: mergedStocks.length,
      dbCount: dbStocks.length,
      masterCount: EGX_STOCKS.length,
      source: 'merged',
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    const masterStocks = EGX_STOCKS.map(s => masterToStock(s));
    return NextResponse.json({
      stocks: masterStocks,
      total: masterStocks.length,
      dbCount: 0,
      masterCount: EGX_STOCKS.length,
      source: 'master_fallback',
    });
  }
}
