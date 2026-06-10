import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabase, type SupabasePriceHistory } from '@/lib/supabase';
import { calculateSupportResistance, type OHLCV } from '@/lib/support-resistance';

const QuerySchema = z.object({
  stockId: z.string().min(1).max(50),
  days: z.coerce.number().int().min(1).max(365).optional().default(20),
});

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      stockId: searchParams.get('stockId'),
      days: searchParams.get('days'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { stockId, days } = parsed.data;

    // Fetch price history from Supabase
    const { data, error } = await supabase
      .from('PriceHistory')
      .select('date, open, high, low, close, volume')
      .eq('stockId', stockId)
      .order('date', { ascending: true })
      .limit(days + 50); // Extra data for swing point detection

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'No price data found for this stock' }, { status: 404 });
    }

    const ohlcvData: OHLCV[] = (data as SupabasePriceHistory[]).map(p => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));

    if (ohlcvData.length < 5) {
      return NextResponse.json({ error: 'Insufficient price history (need at least 5 days)' }, { status: 400 });
    }

    const results = calculateSupportResistance(ohlcvData, days);

    return NextResponse.json({
      stockId,
      days: results.length,
      levels: results,
    });
  } catch (err) {
    console.error('Support/Resistance calculation error:', err);
    return NextResponse.json(
      { error: 'Failed to calculate support/resistance levels' },
      { status: 500 }
    );
  }
}
