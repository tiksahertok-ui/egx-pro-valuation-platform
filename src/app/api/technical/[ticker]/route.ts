// GET /api/technical/[ticker] - Get technical analysis with signals
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { runTechnicalAnalysis, PriceDataPoint, DataSufficiencyInfo } from '@/lib/technical';
import { calculateFloorPivots, calculateFibonacciPivots, findSwingHighsLows, PivotLevels } from '@/lib/technical/supportResistance';
import { generateConfluentSignal, ConfluentSignal } from '@/lib/technical/signals';
import { generateTradePlan, TradePlan, InvestmentHorizon } from '@/lib/technical/tradePlan';
import { validateDataSufficiency } from '@/lib/technical/validation';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';

const TickerParamsSchema = z.object({
  ticker: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError.error;

  try {
    const { ticker } = await params;

    const parsed = TickerParamsSchema.safeParse({ ticker: ticker.toUpperCase() });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ticker', details: parsed.error.flatten() }, { status: 400 });
    }

    const stock = await db.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: {
        priceHistory: {
          orderBy: { date: 'asc' },
        },
        technicals: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        valuations: {
          where: { model: 'Composite (Weighted)' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    if (stock.priceHistory.length < 30) {
      return NextResponse.json({ error: 'Insufficient price history for technical analysis' }, { status: 400 });
    }

    // Run fresh technical analysis
    const priceData: PriceDataPoint[] = stock.priceHistory.map(p => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));

    const analysis = runTechnicalAnalysis(priceData);

    // Also get the latest stored technical indicators
    const latestTechnicals = stock.technicals[0];

    // ─── Support/Resistance via Pivot Points ────────────────
    const prices = stock.priceHistory;
    const lastPrice = prices[prices.length - 1];
    const secondLastPrice = prices.length >= 2 ? prices[prices.length - 2] : lastPrice;
    const prevHigh = secondLastPrice.high;
    const prevLow = secondLastPrice.low;
    const prevClose = secondLastPrice.close;

    const floorPivots: PivotLevels = calculateFloorPivots(prevHigh, prevLow, prevClose);
    const fibonacciPivots: PivotLevels = calculateFibonacciPivots(prevHigh, prevLow, prevClose);

    // Swing highs/lows for dynamic S/R
    const swingLevels = prices.length >= 11
      ? findSwingHighsLows(
          prices.map(p => ({ high: p.high, low: p.low, date: p.date })),
          5
        )
      : { supports: [] as number[], resistances: [] as number[] };

    // ─── Confluence-Weighted Signal Generation ──────────────
    const confluentSignal: ConfluentSignal = generateConfluentSignal({
      rsi: analysis.rsi14,
      macdHistogram: analysis.macdHistogram,
      macdSignalCross: analysis.macdHistogram > 0 ? 'bullish' : 'bearish',
      priceVsSMA50: stock.price > analysis.sma50 && analysis.sma50 > 0 ? 'above' : analysis.sma50 > 0 ? 'below' : null,
      priceVsSMA200: analysis.sma200 > 0 ? (stock.price > analysis.sma200 ? 'above' : 'below') : null,
      adx: analysis.adx14,
      stochasticK: analysis.stochK,
      bollingerPosition: stock.price >= analysis.bbUpper ? 'overbought' : stock.price <= analysis.bbLower ? 'oversold' : 'neutral',
    });

    // ─── Entry/Exit/Stop-Loss Trade Plans ───────────────────
    const fairValue = stock.valuations[0]?.fairValue ?? stock.price * 1.2;
    const tradePlans: TradePlan[] = (['short', 'medium', 'long'] as InvestmentHorizon[]).map(
      horizon => generateTradePlan(stock.price, analysis.atr14, floorPivots, fairValue, horizon)
    );

    // ─── Data Sufficiency Info ──────────────────────────────
    const dataSufficiency: DataSufficiencyInfo | undefined = analysis.dataSufficiency;

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      currentPrice: stock.price,
      analysis: {
        date: analysis.date,
        overallSignal: analysis.overallSignal,
        signalScore: analysis.signalScore,
        signals: analysis.signals,
        dataSufficiency,
      },
      indicators: {
        trend: {
          sma20: analysis.sma20,
          sma50: analysis.sma50,
          sma200: analysis.sma200,
          ema12: analysis.ema12,
          ema26: analysis.ema26,
          adx14: analysis.adx14,
        },
        momentum: {
          rsi14: analysis.rsi14,
          macd: analysis.macd,
          macdSignal: analysis.macdSignal,
          macdHistogram: analysis.macdHistogram,
          stochK: analysis.stochK,
          stochD: analysis.stochD,
          williamsR: analysis.williamsR,
          cci14: analysis.cci14,
        },
        volatility: {
          bbUpper: analysis.bbUpper,
          bbMiddle: analysis.bbMiddle,
          bbLower: analysis.bbLower,
          atr14: analysis.atr14,
        },
        volume: {
          obv: analysis.obv,
        },
      },
      supportResistance: {
        floorPivots,
        fibonacciPivots,
        swingLevels,
      },
      confluentSignal,
      tradePlans,
      storedTechnicals: latestTechnicals ? {
        date: latestTechnicals.date,
        rsi14: latestTechnicals.rsi14,
        macd: latestTechnicals.macd,
        macdSignal: latestTechnicals.macdSignal,
        sma20: latestTechnicals.sma20,
        sma50: latestTechnicals.sma50,
        sma200: latestTechnicals.sma200,
        bbUpper: latestTechnicals.bbUpper,
        bbMiddle: latestTechnicals.bbMiddle,
        bbLower: latestTechnicals.bbLower,
        atr14: latestTechnicals.atr14,
        adx14: latestTechnicals.adx14,
        stochK: latestTechnicals.stochK,
        stochD: latestTechnicals.stochD,
      } : null,
      priceHistoryLength: stock.priceHistory.length,
    });
  } catch (error) {
    console.error('Error running technical analysis:', error);
    return NextResponse.json({ error: 'Failed to run technical analysis' }, { status: 500 });
  }
}
