/**
 * P2.4: Alert CRUD API
 * GET  /api/alerts   - List all alerts (with optional filters)
 * POST /api/alerts   - Create a new alert
 */

import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// ── Alert types enum ────────────────────────────────────────

const ALERT_TYPES = ['price_target', 'support_breach', 'resistance_break', 'fair_value_hit'] as const;
type AlertType = (typeof ALERT_TYPES)[number];

// ── Validation Schemas ──────────────────────────────────────

const AlertsQuerySchema = z.object({
  stockId: z.string().optional(),
  type: z.enum(ALERT_TYPES).optional(),
  isActive: z.coerce.string().optional().transform(v => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return undefined;
  }),
});

const CreateAlertSchema = z.object({
  stockId: z.string().min(1, 'stockId is required'),
  type: z.enum(ALERT_TYPES, { message: 'Type must be one of: price_target, support_breach, resistance_break, fair_value_hit' }),
  threshold: z.number({ message: 'Threshold must be a number' }).finite('Threshold must be a finite number'),
});

// ── GET: List alerts with optional filters ──────────────────

export async function GET(request: Request) {
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

  try {
    const { searchParams } = new URL(request.url);
    const parsed = AlertsQuerySchema.safeParse({
      stockId: searchParams.get('stockId'),
      type: searchParams.get('type'),
      isActive: searchParams.get('isActive'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { stockId, type, isActive } = parsed.data;

    // Build query with filters
    let query = supabase
      .from('Alert')
      .select('*, stock:Stock(id, ticker, name, price)')
      .order('createdAt', { ascending: false });

    if (stockId) {
      query = query.eq('stockId', stockId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (isActive !== undefined) {
      query = query.eq('isActive', isActive);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error listing alerts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch alerts', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      alerts: data ?? [],
      total: data?.length ?? 0,
    });
  } catch (err) {
    console.error('Unexpected error listing alerts:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// ── POST: Create a new alert ────────────────────────────────

export async function POST(request: Request) {
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

  try {
    const body = await request.json();
    const parsed = CreateAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { stockId, type, threshold } = parsed.data;

    // Verify stock exists
    const { data: stock, error: stockError } = await supabase
      .from('Stock')
      .select('id, ticker, name, price')
      .eq('id', stockId)
      .single();

    if (stockError || !stock) {
      return NextResponse.json(
        { error: 'Stock not found. Provide a valid stockId.' },
        { status: 404 },
      );
    }

    // For support_breach and resistance_break, validate threshold makes sense
    if (type === 'support_breach' && threshold > (stock.price || 0)) {
      return NextResponse.json(
        { error: 'Support breach threshold should be below the current price', currentPrice: stock.price },
        { status: 400 },
      );
    }
    if (type === 'resistance_break' && threshold < (stock.price || 0)) {
      return NextResponse.json(
        { error: 'Resistance break threshold should be above the current price', currentPrice: stock.price },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('Alert')
      .insert({
        stockId,
        type,
        threshold,
        isActive: true,
        triggered: false,
      })
      .select('*, stock:Stock(id, ticker, name, price)')
      .single();

    if (error) {
      console.error('Supabase error creating alert:', error);
      return NextResponse.json(
        { error: 'Failed to create alert', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error creating alert:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
