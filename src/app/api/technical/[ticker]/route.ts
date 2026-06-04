// GET /api/technical/[ticker] - Get technical analysis with signals
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { runTechnicalAnalysis, PriceDataPoint } from '@/lib/technical';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;

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

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      currentPrice: stock.price,
      analysis: {
        date: analysis.date,
        overallSignal: analysis.overallSignal,
        signalScore: analysis.signalScore,
        signals: analysis.signals,
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
