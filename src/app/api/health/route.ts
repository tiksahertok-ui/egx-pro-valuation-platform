import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    let ageInDays: number | null = null;

    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('Stock')
        .select('lastSyncedAt')
        .not('lastSyncedAt', 'is', null)
        .order('lastSyncedAt', { ascending: false })
        .limit(1)
        .single();

      if (data?.lastSyncedAt) {
        const lastSync = new Date(data.lastSyncedAt as string);
        ageInDays = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    return NextResponse.json({
      status: 'ok',
      dataFreshness: { ageInDays },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: 'ok',
      dataFreshness: { ageInDays: null },
      timestamp: new Date().toISOString(),
    });
  }
}
