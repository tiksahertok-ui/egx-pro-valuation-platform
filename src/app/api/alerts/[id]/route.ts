/**
 * P2.4: Single Alert Operations
 * PATCH  /api/alerts/[id]  - Update alert (isActive, threshold)
 * DELETE /api/alerts/[id]  - Delete an alert
 */

import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const AlertIdSchema = z.string().min(1).max(50);

// ── PATCH: Update alert ────────────────────────────────────

const UpdateAlertSchema = z.object({
  isActive: z.boolean().optional(),
  threshold: z.number().finite().optional(),
}).refine(
  (data) => data.isActive !== undefined || data.threshold !== undefined,
  { message: 'At least one of isActive or threshold must be provided' },
);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(
    'api/alerts',
    ip,
    RATE_LIMITS.alerts.limit,
    RATE_LIMITS.alerts.windowMs,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } },
    );
  }

  const { id } = await params;
  const idValidation = AlertIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Invalid alert ID', details: idValidation.error.issues },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const parsed = UpdateAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Check alert exists
    const { data: existing, error: findError } = await supabase
      .from('Alert')
      .select('id, type, triggered')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 },
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (parsed.data.isActive !== undefined) {
      updateData.isActive = parsed.data.isActive;
    }
    if (parsed.data.threshold !== undefined) {
      updateData.threshold = parsed.data.threshold;
      // If reactivating by changing threshold, also reset triggered status
      if (existing.triggered) {
        updateData.triggered = false;
        updateData.isActive = true;
      }
    }

    const { data, error } = await supabase
      .from('Alert')
      .update(updateData)
      .eq('id', id)
      .select('*, stock:Stock(id, ticker, name, price)')
      .single();

    if (error) {
      console.error('Supabase error updating alert:', error);
      return NextResponse.json(
        { error: 'Failed to update alert', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ alert: data });
  } catch (err) {
    console.error('Unexpected error updating alert:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// ── DELETE: Delete an alert ─────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(
    'api/alerts',
    ip,
    RATE_LIMITS.alerts.limit,
    RATE_LIMITS.alerts.windowMs,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } },
    );
  }

  const { id } = await params;
  const idValidation = AlertIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Invalid alert ID', details: idValidation.error.issues },
      { status: 400 },
    );
  }

  try {
    // Check alert exists
    const { data: existing, error: findError } = await supabase
      .from('Alert')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 },
      );
    }

    const { error: deleteError } = await supabase
      .from('Alert')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase error deleting alert:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete alert', details: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Alert deleted successfully' });
  } catch (err) {
    console.error('Unexpected error deleting alert:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
