import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFinancialDataByTicker, getHardcodedSectorAverages } from '@/lib/data/egx-financial-data';
import { runAllModels, DEFAULT_MARKET_PARAMS, type StockFundamentals, type SectorAverages } from '@/lib/valuation-engine';
import { z } from 'zod/v4';

const SyncSchema = z.object({
  ticker: z.string().min(1).max(10),
  financials: z.object({
    revenue: z.number().optional(),
    netIncome: z.number().optional(),
    totalAssets: z.number().optional(),
    totalEquity: z.number().optional(),
    totalDebt: z.number().optional(),
    operatingCashflow: z.number().optional(),
    freeCashflow: z.number().optional(),
    eps: z.number().optional(),
    bookValuePerShare: z.number().optional(),
    roe: z.number().optional(),
    roa: z.number().optional(),
    debtToEquity: z.number().optional(),
    grossMargin: z.number().optional(),
    operatingMargin: z.number().optional(),
    profitMargin: z.number().optional(),
    revenueGrowth: z.number().optional(),
    earningsGrowth: z.number().optional(),
    evToEbitda: z.number().optional(),
    usdRevenuePct: z.number().min(0).max(1).optional(),
    cashEquivalents: z.number().optional(),
  }).optional(),
  price: z.number().optional(),
  marketCap: z.number().optional(),
  sharesOutstanding: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    const { ticker, financials, price, marketCap, sharesOutstanding } = parsed.data;

    // Find stock in Supabase
    const { data: stock, error: stockError } = await supabase
      .from('Stock')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .single();

    if (stockError || !stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update stock-level data if provided
    const stockUpdates: Record<string, unknown> = { lastSyncedAt: now };
    if (price != null) stockUpdates.price = price;
    if (marketCap != null) stockUpdates.marketCap = marketCap;
    if (sharesOutstanding != null) stockUpdates.sharesOutstanding = sharesOutstanding;

    if (Object.keys(stockUpdates).length > 1) {
      await supabase.from('Stock').update(stockUpdates).eq('id', stock.id);
    }

    // Upsert financial data if provided
    if (financials) {
      const year = new Date().getFullYear();
      const finUpdates: Record<string, unknown> = { ...financials, lastSyncedAt: now };

      // Check if financial data exists for this year
      const { data: existingFin } = await supabase
        .from('FinancialData')
        .select('id')
        .eq('stockId', stock.id)
        .eq('year', year)
        .single();

      if (existingFin) {
        await supabase.from('FinancialData').update(finUpdates).eq('id', existingFin.id);
      } else {
        await supabase.from('FinancialData').insert({
          stockId: stock.id,
          year,
          ...financials,
        });
      }
    }

    // Recompute valuation
    const finData = getFinancialDataByTicker(ticker);
    const sectorAvgs = getHardcodedSectorAverages(stock.sector);
    const sectorAvg: SectorAverages = {
      avgPE: sectorAvgs.avgPE,
      avgPB: sectorAvgs.avgPB,
      avgROE: sectorAvgs.avgROE,
      avgEVEbitda: sectorAvgs.avgEVEbitda,
      avgDividendYield: sectorAvgs.avgDividendYield,
    };

    const fundamentals: StockFundamentals = {
      ticker: stock.ticker,
      price: price ?? stock.price ?? finData?.price ?? 0,
      eps: financials?.eps ?? stock.eps ?? finData?.eps ?? 0,
      bookValuePerShare: financials?.bookValuePerShare ?? stock.bookValuePerShare ?? finData?.bookValuePerShare ?? 0,
      sharesOutstanding: sharesOutstanding ?? stock.sharesOutstanding ?? finData?.sharesOutstanding ?? 0,
      marketCap: marketCap ?? stock.marketCap ?? finData?.marketCap ?? 0,
      dividendYield: stock.dividendYield ?? finData?.dividendYield ?? 0,
      peRatio: stock.peRatio ?? finData?.peRatio ?? 0,
      pbRatio: stock.pbRatio ?? finData?.pbRatio ?? 0,
      beta: stock.beta ?? finData?.beta ?? 1.0,
      roe: financials?.roe ?? finData?.roe ?? 0,
      roa: financials?.roa ?? finData?.roa ?? 0,
      debtToEquity: financials?.debtToEquity ?? finData?.debtToEquity ?? 0,
      evToEbitda: financials?.evToEbitda ?? finData?.evToEbitda ?? 0,
      revenue: financials?.revenue ?? finData?.revenue ?? 0,
      netIncome: financials?.netIncome ?? finData?.netIncome ?? 0,
      totalAssets: financials?.totalAssets ?? finData?.totalAssets ?? 0,
      totalEquity: financials?.totalEquity ?? finData?.totalEquity ?? 0,
      totalDebt: financials?.totalDebt ?? finData?.totalDebt ?? 0,
      operatingCashflow: financials?.operatingCashflow ?? finData?.operatingCashflow ?? 0,
      freeCashflow: financials?.freeCashflow ?? finData?.freeCashflow ?? 0,
      grossMargin: financials?.grossMargin ?? finData?.grossMargin ?? 0,
      operatingMargin: financials?.operatingMargin ?? finData?.operatingMargin ?? 0,
      profitMargin: financials?.profitMargin ?? finData?.profitMargin ?? 0,
      revenueGrowth: financials?.revenueGrowth ?? finData?.revenueGrowth ?? 0,
      earningsGrowth: financials?.earningsGrowth ?? finData?.earningsGrowth ?? 0,
    };

    const valuation = runAllModels(fundamentals, sectorAvg, DEFAULT_MARKET_PARAMS, stock.sector);

    // Store valuation results in Supabase
    for (const model of valuation.models) {
      const { data: existingVal } = await supabase
        .from('ValuationResult')
        .select('id')
        .eq('stockId', stock.id)
        .eq('model', model.model)
        .single();

      const valData = {
        fairValue: model.fairValue,
        upsideDownside: model.upsideDownside,
        confidence: model.confidence,
        assumptions: JSON.stringify(model.assumptions),
        terminalGrowthCapped: model.terminalGrowthCapped ?? false,
      };

      if (existingVal) {
        await supabase.from('ValuationResult').update(valData).eq('id', existingVal.id);
      } else {
        await supabase.from('ValuationResult').insert({
          stockId: stock.id,
          model: model.model,
          ...valData,
        });
      }
    }

    return NextResponse.json({
      updated: true,
      stockId: stock.id,
      recomputedAt: now,
      valuationSummary: {
        averageFairValue: valuation.averageFairValue,
        overallVerdict: valuation.overallVerdict,
        confidenceScore: valuation.confidenceScore,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
