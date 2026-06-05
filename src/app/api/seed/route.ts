/**
 * Seed API Endpoint
 * POST /api/seed - Seeds the database with EGX stock master data
 * GET /api/seed - Gets seed status
 */

import { NextResponse } from 'next/server';
import { seedAllStocks } from '@/lib/data/egx-data-service';
import { EGX_STOCK_COUNT } from '@/lib/data/egx-stocks-master';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await seedAllStocks();

    return NextResponse.json({
      success: true,
      masterListCount: EGX_STOCK_COUNT,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stockCount = await db.stock.count();
    const sectors = await db.stock.groupBy({
      by: ['sector'],
      _count: { sector: true },
      orderBy: { _count: { sector: 'desc' } },
    });

    return NextResponse.json({
      masterListCount: EGX_STOCK_COUNT,
      databaseStockCount: stockCount,
      sectors: sectors.map(s => ({
        name: s.sector,
        count: s._count.sector,
      })),
      isSeeded: stockCount > 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
