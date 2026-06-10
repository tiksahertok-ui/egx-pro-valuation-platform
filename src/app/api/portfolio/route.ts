/**
 * P2.1: Portfolio CRUD API
 * GET  /api/portfolio          - List all portfolios with holdings
 * POST /api/portfolio          - Create a new portfolio
 */

import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// ── Validation Schemas ──────────────────────────────────────

const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(100, 'Portfolio name must be 1-100 characters'),
  description: z.string().max(500).optional().default(''),
});

// ── GET: List all portfolios with holdings ──────────────────

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(
    'api/portfolio',
    ip,
    RATE_LIMITS.portfolio.limit,
    RATE_LIMITS.portfolio.windowMs,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } },
    );
  }

  try {
    const { data, error } = await supabase
      .from('Portfolio')
      .select('*, holdings:PortfolioHolding(*)')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error listing portfolios:', error);
      return NextResponse.json(
        { error: 'Failed to fetch portfolios', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      portfolios: data ?? [],
      total: data?.length ?? 0,
    });
  } catch (err) {
    console.error('Unexpected error listing portfolios:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// ── POST: Create a new portfolio ────────────────────────────

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(
    'api/portfolio',
    ip,
    RATE_LIMITS.portfolio.limit,
    RATE_LIMITS.portfolio.windowMs,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } },
    );
  }

  try {
    const body = await request.json();
    const parsed = CreatePortfolioSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { name, description } = parsed.data;

    const { data, error } = await supabase
      .from('Portfolio')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating portfolio:', error);
      return NextResponse.json(
        { error: 'Failed to create portfolio', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ portfolio: data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error creating portfolio:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
