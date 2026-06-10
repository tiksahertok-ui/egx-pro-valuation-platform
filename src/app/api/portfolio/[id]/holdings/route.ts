/**
 * P2.1: Portfolio Holdings Management
 * POST   /api/portfolio/[id]/holdings  - Add a holding to a portfolio
 * DELETE /api/portfolio/[id]/holdings  - Remove a holding from a portfolio
 */

import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const PortfolioIdSchema = z.string().min(1).max(50);

// ── POST: Add a holding ────────────────────────────────────

const AddHoldingSchema = z.object({
  stockId: z.string().min(1, 'stockId is required'),
  shares: z.number().positive('Shares must be a positive number'),
  avgCost: z.number().min(0, 'Average cost must be non-negative'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: portfolioId } = await params;
  const idValidation = PortfolioIdSchema.safeParse(portfolioId);
  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Invalid portfolio ID', details: idValidation.error.issues },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const parsed = AddHoldingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { stockId, shares, avgCost } = parsed.data;

    // Verify portfolio exists
    const { data: portfolio, error: portfolioError } = await supabase
      .from('Portfolio')
      .select('id')
      .eq('id', portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 },
      );
    }

    // Verify stock exists
    const { data: stock, error: stockError } = await supabase
      .from('Stock')
      .select('id, ticker')
      .eq('id', stockId)
      .single();

    if (stockError || !stock) {
      return NextResponse.json(
        { error: 'Stock not found. Provide a valid stockId.' },
        { status: 404 },
      );
    }

    // Check if holding already exists (unique constraint on portfolioId+stockId)
    const { data: existingHolding } = await supabase
      .from('PortfolioHolding')
      .select('id, shares, avgCost')
      .eq('portfolioId', portfolioId)
      .eq('stockId', stockId)
      .single();

    let holding;

    if (existingHolding) {
      // Update existing holding: add shares and recalculate average cost
      const oldShares = existingHolding.shares || 0;
      const oldCost = existingHolding.avgCost || 0;
      const newTotalShares = oldShares + shares;
      const newAvgCost = newTotalShares > 0
        ? ((oldShares * oldCost) + (shares * avgCost)) / newTotalShares
        : avgCost;

      const { data, error } = await supabase
        .from('PortfolioHolding')
        .update({
          shares: newTotalShares,
          avgCost: Math.round(newAvgCost * 100) / 100,
        })
        .eq('id', existingHolding.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating holding:', error);
        return NextResponse.json(
          { error: 'Failed to update holding', details: error.message },
          { status: 500 },
        );
      }
      holding = data;
    } else {
      // Insert new holding
      const { data, error } = await supabase
        .from('PortfolioHolding')
        .insert({
          portfolioId,
          stockId,
          shares,
          avgCost,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding holding:', error);
        return NextResponse.json(
          { error: 'Failed to add holding', details: error.message },
          { status: 500 },
        );
      }
      holding = data;
    }

    return NextResponse.json(
      { holding, message: existingHolding ? 'Holding updated (shares merged)' : 'Holding added' },
      { status: existingHolding ? 200 : 201 },
    );
  } catch (err) {
    console.error('Unexpected error adding holding:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// ── DELETE: Remove a holding ───────────────────────────────

const RemoveHoldingSchema = z.object({
  stockId: z.string().min(1, 'stockId is required'),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: portfolioId } = await params;
  const idValidation = PortfolioIdSchema.safeParse(portfolioId);
  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Invalid portfolio ID', details: idValidation.error.issues },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const parsed = RemoveHoldingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { stockId } = parsed.data;

    // Check if holding exists
    const { data: existing, error: findError } = await supabase
      .from('PortfolioHolding')
      .select('id')
      .eq('portfolioId', portfolioId)
      .eq('stockId', stockId)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Holding not found in this portfolio' },
        { status: 404 },
      );
    }

    // Delete the holding
    const { error: deleteError } = await supabase
      .from('PortfolioHolding')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.error('Supabase error removing holding:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove holding', details: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Holding removed successfully' });
  } catch (err) {
    console.error('Unexpected error removing holding:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
