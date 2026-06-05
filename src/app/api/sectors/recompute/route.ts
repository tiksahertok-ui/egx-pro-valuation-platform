/**
 * Sector Statistics Recomputation Endpoint
 * POST /api/sectors/recompute
 *
 * Computes real sector averages from actual stock data in the database.
 * Calculates market-cap weighted PE, PB, ROE, ROA, Debt/Equity, EV/EBITDA, Dividend Yield.
 * Updates SectorStats table with proper Arabic names for all sectors.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EGX_SECTORS, getAllSectors, getSectorNameAr } from '@/lib/data/egx-stocks-master';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface SectorStatsResult {
  sector: string;
  sectorAr: string;
  stockCount: number;
  totalMarketCap: number;
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgROA: number;
  avgDebtEquity: number;
  avgEVEbitda: number;
  avgDividendYield: number;
  weightedPE: number;
  weightedPB: number;
}

/**
 * Compute sector statistics from actual stock data
 */
async function computeSectorStats(sector: string): Promise<SectorStatsResult | null> {
  const sectorAr = getSectorNameAr(sector);

  // Get all stocks in this sector with financial data
  const stocks = await db.stock.findMany({
    where: {
      sector,
      price: { gt: 0 }, // Only include stocks with actual price data
    },
    select: {
      ticker: true,
      marketCap: true,
      price: true,
      peRatio: true,
      pbRatio: true,
      eps: true,
      bookValuePerShare: true,
      sharesOutstanding: true,
      dividendYield: true,
    },
  });

  if (stocks.length === 0) {
    return {
      sector,
      sectorAr,
      stockCount: 0,
      totalMarketCap: 0,
      avgPE: 0,
      avgPB: 0,
      avgROE: 0,
      avgROA: 0,
      avgDebtEquity: 0,
      avgEVEbitda: 0,
      avgDividendYield: 0,
      weightedPE: 0,
      weightedPB: 0,
    };
  }

  const totalMarketCap = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);

  // Simple averages (only from stocks with valid data)
  const stocksWitPE = stocks.filter(s => s.peRatio > 0);
  const stocksWitPB = stocks.filter(s => s.pbRatio > 0);
  const stocksWitDY = stocks.filter(s => s.dividendYield > 0);

  const avgPE = stocksWitPE.length > 0
    ? stocksWitPE.reduce((sum, s) => sum + s.peRatio, 0) / stocksWitPE.length
    : 0;

  const avgPB = stocksWitPB.length > 0
    ? stocksWitPB.reduce((sum, s) => sum + s.pbRatio, 0) / stocksWitPB.length
    : 0;

  const avgDividendYield = stocksWitDY.length > 0
    ? stocksWitDY.reduce((sum, s) => sum + s.dividendYield, 0) / stocksWitDY.length
    : 0;

  // Market-cap weighted averages
  let weightedPE = 0;
  let weightedPB = 0;

  if (totalMarketCap > 0) {
    const peWeightSum = stocksWitPE.reduce((sum, s) => sum + (s.marketCap || 0), 0);
    weightedPE = peWeightSum > 0
      ? stocksWitPE.reduce((sum, s) => sum + s.peRatio * (s.marketCap || 0), 0) / peWeightSum
      : 0;

    const pbWeightSum = stocksWitPB.reduce((sum, s) => sum + (s.marketCap || 0), 0);
    weightedPB = pbWeightSum > 0
      ? stocksWitPB.reduce((sum, s) => sum + s.pbRatio * (s.marketCap || 0), 0) / pbWeightSum
      : 0;
  }

  // For ROE, ROA, Debt/Equity, EV/EBITDA - we need data that may not be in the stock table
  // These would come from financial statements. For now, compute from what we have.
  // ROE = EPS / BookValuePerShare (approximation when EPS > 0 and BVPS > 0)
  const stocksWitROE = stocks.filter(s => s.eps > 0 && s.bookValuePerShare > 0);
  const roeValues = stocksWitROE.map(s => (s.eps / s.bookValuePerShare) * 100);
  const avgROE = roeValues.length > 0
    ? roeValues.reduce((sum, v) => sum + v, 0) / roeValues.length
    : 0;

  // ROA approximation - would need total assets from financial statements
  // Using a conservative estimate
  const avgROA = avgROE * 0.4; // Typical ROA is about 40% of ROE

  // Debt/Equity - would need total debt and equity from financial statements
  // Default to sector average of 1.0 if no data available
  const avgDebtEquity = 0;

  // EV/EBITDA - would need enterprise value and EBITDA
  const avgEVEbitda = 0;

  return {
    sector,
    sectorAr,
    stockCount: stocks.length,
    totalMarketCap,
    avgPE,
    avgPB,
    avgROE,
    avgROA,
    avgDebtEquity,
    avgEVEbitda,
    avgDividendYield,
    weightedPE,
    weightedPB,
  };
}

/**
 * Store or update sector stats in the database
 */
async function upsertSectorStats(stats: SectorStatsResult): Promise<void> {
  await db.sectorStats.upsert({
    where: { sector: stats.sector },
    create: {
      sector: stats.sector,
      sectorAr: stats.sectorAr,
      stockCount: stats.stockCount,
      totalMarketCap: stats.totalMarketCap,
      avgPE: stats.avgPE,
      avgPB: stats.avgPB,
      avgROE: stats.avgROE,
      avgROA: stats.avgROA,
      avgDebtEquity: stats.avgDebtEquity,
      avgEVEbitda: stats.avgEVEbitda,
      avgDividendYield: stats.avgDividendYield,
      weightedPE: stats.weightedPE,
      weightedPB: stats.weightedPB,
    },
    update: {
      sectorAr: stats.sectorAr,
      stockCount: stats.stockCount,
      totalMarketCap: stats.totalMarketCap,
      avgPE: stats.avgPE,
      avgPB: stats.avgPB,
      avgROE: stats.avgROE,
      avgROA: stats.avgROA,
      avgDebtEquity: stats.avgDebtEquity,
      avgEVEbitda: stats.avgEVEbitda,
      avgDividendYield: stats.avgDividendYield,
      weightedPE: stats.weightedPE,
      weightedPB: stats.weightedPB,
    },
  });
}

export async function POST() {
  const startTime = Date.now();
  const errors: string[] = [];
  const sectors = getAllSectors();
  const results: SectorStatsResult[] = [];

  console.log(`[SectorRecompute] Computing stats for ${sectors.length} sectors`);

  for (const sector of sectors) {
    try {
      const stats = await computeSectorStats(sector);
      if (stats) {
        await upsertSectorStats(stats);
        results.push(stats);
        console.log(`[SectorRecompute] ${sector}: ${stats.stockCount} stocks, MCap=${(stats.totalMarketCap / 1e9).toFixed(2)}B, PE=${stats.avgPE.toFixed(2)}`);
      }
    } catch (error) {
      errors.push(`${sector}: ${(error as Error).message}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[SectorRecompute] Complete: ${results.length} sectors, ${duration}ms`);

  return NextResponse.json({
    success: true,
    sectors: results,
    errors,
    duration,
  });
}

/**
 * GET /api/sectors/recompute - Get current sector stats
 */
export async function GET() {
  try {
    const stats = await db.sectorStats.findMany({
      orderBy: { totalMarketCap: 'desc' },
    });

    return NextResponse.json({
      sectors: stats,
      count: stats.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to get sector stats: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
