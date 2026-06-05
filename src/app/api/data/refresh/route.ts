/**
 * Data Refresh Endpoint
 * GET /api/data/refresh?scope=prices|financials|all|technical&cron_secret=xxx
 *
 * Fetches real-time data from Yahoo Finance, stores in database,
 * and computes derived metrics using the egx-data-service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';
import {
  seedAllStocks,
  refreshStalePrices,
  refreshAllFinancials,
  fetchAllPriceHistory,
  recomputeSectorStats,
} from '@/lib/data/egx-data-service';
import { computeAllStocksIndicators } from '@/lib/data/technical-computer';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

type RefreshScope = 'prices' | 'financials' | 'all' | 'technical';

interface RefreshResult {
  scope: RefreshScope;
  seed?: { created: number; updated: number; skipped: number };
  prices?: {
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
  };
  financials?: {
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
  };
  priceHistory?: {
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
  };
  technical?: {
    total: number;
    computed: number;
    skipped: number;
    errors: string[];
  };
  sectorStats?: {
    computed: number;
  };
  logId?: string;
  errors: string[];
  duration: number;
}

/**
 * GET /api/data/refresh?scope=prices|financials|all|technical&cron_secret=xxx
 * Uses the egx-data-service for comprehensive data refresh
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const scope = (searchParams.get('scope') ?? 'prices') as RefreshScope;
  const cronSecret = searchParams.get('cron_secret');

  // Validate scope
  const validScopes: RefreshScope[] = ['prices', 'financials', 'all', 'technical'];
  if (!validScopes.includes(scope)) {
    return NextResponse.json(
      { error: `Invalid scope. Must be one of: ${validScopes.join(', ')}` },
      { status: 400 },
    );
  }

  // Validate cron secret if provided in env
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Invalid cron_secret' },
      { status: 401 },
    );
  }

  const result: RefreshResult = {
    scope,
    errors: [],
    duration: 0,
  };

  // Create a refresh log entry
  let logId: string | undefined;
  try {
    const log = await db.dataRefreshLog.create({
      data: {
        scope,
        startedAt: new Date(),
      },
    });
    logId = log.id;
    result.logId = logId;
  } catch (error) {
    console.warn(`[Refresh] Could not create log entry: ${(error as Error).message}`);
  }

  try {
    // Step 1: Always seed master list first (ensures stocks exist in DB)
    console.log(`[Refresh] Step 1: Seeding master stock list...`);
    const seedResult = await seedAllStocks();
    result.seed = seedResult;
    console.log(`[Refresh] Seeded: ${seedResult.created} created, ${seedResult.updated} updated, ${seedResult.skipped} skipped`);

    // Step 2: Fetch data based on scope
    if (scope === 'prices' || scope === 'all') {
      console.log(`[Refresh] Step 2: Fetching prices...`);
      try {
        const priceResult = await refreshStalePrices((completed, total) => {
          if (completed % 20 === 0 || completed === total) {
            console.log(`[Refresh] Prices: ${completed}/${total}`);
          }
        });
        result.prices = {
          total: priceResult.total,
          succeeded: priceResult.succeeded,
          failed: priceResult.failed,
          duration: priceResult.duration,
        };
        if (priceResult.errors.length > 0) {
          result.errors.push(...priceResult.errors.map(e => `Price:${e.ticker}: ${e.error}`).slice(0, 50));
        }
      } catch (error) {
        result.errors.push(`Prices fetch error: ${(error as Error).message}`);
      }
    }

    if (scope === 'financials' || scope === 'all') {
      console.log(`[Refresh] Step 3: Fetching financials...`);
      try {
        const financialsResult = await refreshAllFinancials(EGX_STOCKS, (completed, total) => {
          if (completed % 20 === 0 || completed === total) {
            console.log(`[Refresh] Financials: ${completed}/${total}`);
          }
        });
        result.financials = {
          total: financialsResult.total,
          succeeded: financialsResult.succeeded,
          failed: financialsResult.failed,
          duration: financialsResult.duration,
        };
        if (financialsResult.errors.length > 0) {
          result.errors.push(...financialsResult.errors.map(e => `Financials:${e.ticker}: ${e.error}`).slice(0, 50));
        }
      } catch (error) {
        result.errors.push(`Financials fetch error: ${(error as Error).message}`);
      }
    }

    if (scope === 'all') {
      // Also fetch price history for all stocks
      console.log(`[Refresh] Step 4: Fetching price history...`);
      try {
        // Only fetch for a subset to avoid timeout - fetch top 50 stocks by market cap
        const stocksInDb = await db.stock.findMany({
          where: { price: { gt: 0 } },
          orderBy: { marketCap: 'desc' },
          take: 50,
          select: { ticker: true },
        });

        const tickersToFetch = new Set(stocksInDb.map(s => s.ticker));
        const stocksForHistory = EGX_STOCKS.filter(s => tickersToFetch.has(s.ticker));

        if (stocksForHistory.length > 0) {
          const historyResult = await fetchAllPriceHistory(stocksForHistory, '3mo', (completed, total) => {
            if (completed % 10 === 0 || completed === total) {
              console.log(`[Refresh] Price History: ${completed}/${total}`);
            }
          });
          result.priceHistory = {
            total: historyResult.total,
            succeeded: historyResult.succeeded,
            failed: historyResult.failed,
            duration: historyResult.duration,
          };
        }
      } catch (error) {
        result.errors.push(`Price history fetch error: ${(error as Error).message}`);
      }
    }

    if (scope === 'technical' || scope === 'all') {
      console.log(`[Refresh] Step 5: Computing technical indicators...`);
      try {
        const techResult = await computeAllStocksIndicators((completed, total) => {
          if (completed % 10 === 0 || completed === total) {
            console.log(`[Refresh] Technical: ${completed}/${total}`);
          }
        });
        result.technical = {
          total: techResult.total,
          computed: techResult.computed,
          skipped: techResult.skipped,
          errors: techResult.errors,
        };
      } catch (error) {
        result.errors.push(`Technical computation error: ${(error as Error).message}`);
      }
    }

    // Also recompute sector stats for all scopes
    try {
      await recomputeSectorStats();
      result.sectorStats = { computed: 1 };
    } catch (error) {
      result.errors.push(`Sector stats error: ${(error as Error).message}`);
    }

  } catch (error) {
    result.errors.push(`Fatal error: ${(error as Error).message}`);
  }

  result.duration = Date.now() - startTime;

  // Update the refresh log
  if (logId) {
    try {
      await db.dataRefreshLog.update({
        where: { id: logId },
        data: {
          stocksUpdated: result.prices?.succeeded ?? result.financials?.succeeded ?? 0,
          stocksFailed: result.prices?.failed ?? result.financials?.failed ?? 0,
          errors: JSON.stringify(result.errors.slice(0, 100)),
          completedAt: new Date(),
        },
      });
    } catch {
      // Log update is non-critical
    }
  }

  console.log(`[Refresh] Complete: scope=${scope}, duration=${result.duration}ms, errors=${result.errors.length}`);

  return NextResponse.json(result);
}

/**
 * POST /api/data/refresh - Alias for GET (backward compatibility)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
