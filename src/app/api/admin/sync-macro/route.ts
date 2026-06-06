import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod/v4';

const MacroSyncSchema = z.object({
  indicators: z.array(z.object({
    name: z.string(),
    value: z.number(),
    previous: z.number().optional(),
    unit: z.string().optional(),
    source: z.string().optional(),
  })),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = MacroSyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { indicators } = parsed.data;
    const now = new Date().toISOString();
    const results: Array<{ name: string; updated: boolean }> = [];

    for (const indicator of indicators) {
      const { data: existing } = await supabase
        .from('EconomicIndicator')
        .select('id, value')
        .eq('name', indicator.name)
        .single();

      const updateData: Record<string, unknown> = {
        value: indicator.value,
        fetchedAt: now,
        source: indicator.source ?? 'Manual sync',
      };
      if (indicator.previous != null) updateData.previous = indicator.previous;
      if (indicator.unit) updateData.unit = indicator.unit;
      if (existing) {
        updateData.change = indicator.value - (existing.value ?? 0);
        await supabase.from('EconomicIndicator').update(updateData).eq('id', existing.id);
      } else {
        updateData.name = indicator.name;
        updateData.change = 0;
        if (indicator.unit) updateData.unit = indicator.unit;
        await supabase.from('EconomicIndicator').insert(updateData);
      }
      results.push({ name: indicator.name, updated: true });
    }

    return NextResponse.json({ updated: true, indicators: results, syncedAt: now });
  } catch (error) {
    console.error('Macro sync error:', error);
    return NextResponse.json({ error: 'Macro sync failed' }, { status: 500 });
  }
}
