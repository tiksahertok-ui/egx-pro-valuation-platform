/**
 * Technical Indicators Computer
 * Computes RSI, MACD, Bollinger Bands, SMA, EMA, ATR, ADX, Stochastic, Williams %R, CCI, OBV
 * from raw price history data and stores results in the TechnicalIndicator table
 * Uses Supabase client instead of Prisma
 */

import { supabase } from '@/lib/supabase';

// ============================================================
// Input/Output Types
// ============================================================

export interface PriceBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface TechnicalIndicators {
  date: Date;
  rsi14: number;
  macdLine: number;
  macdSignal: number;
  macdHist: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  atr14: number;
  adx14: number;
  stochasticK: number;
  stochasticD: number;
  williamsR: number;
  cci14: number;
  obv: number;
}

// ============================================================
// Helper Functions
// ============================================================

function isFiniteNumber(n: number): boolean {
  return typeof n === 'number' && isFinite(n);
}

function safeNum(n: number, fallback: number = 0): number {
  return isFiniteNumber(n) ? n : fallback;
}

// ============================================================
// Simple Moving Average (SMA)
// ============================================================

export function computeSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    let sum = 0;
    let count = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (isFiniteNumber(data[j])) {
        sum += data[j];
        count++;
      }
    }

    result.push(count >= period ? sum / period : null);
  }

  return result;
}

// ============================================================
// Exponential Moving Average (EMA)
// ============================================================

export function computeEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  let ema: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (!isFiniteNumber(data[i])) {
      result.push(ema);
      continue;
    }

    if (ema === null) {
      // Use SMA for the first value
      if (i >= period - 1) {
        let sum = 0;
        let count = 0;
        for (let j = i - period + 1; j <= i; j++) {
          if (isFiniteNumber(data[j])) {
            sum += data[j];
            count++;
          }
        }
        if (count >= period) {
          ema = sum / count;
        }
      }
      result.push(ema);
    } else {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }

  return result;
}

// ============================================================
// RSI (Relative Strength Index) - 14 period
// ============================================================

export function computeRSI(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0 || !isFiniteNumber(closes[i]) || !isFiniteNumber(closes[i - 1])) {
      gains.push(0);
      losses.push(0);
      result.push(null);
      continue;
    }

    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
      continue;
    }

    if (i === period) {
      let avgGain = 0;
      let avgLoss = 0;
      for (let j = 1; j <= period; j++) {
        avgGain += gains[j];
        avgLoss += losses[j];
      }
      avgGain /= period;
      avgLoss /= period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
      }
    } else {
      let sumGain = 0;
      let sumLoss = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sumGain += gains[j];
        sumLoss += losses[j];
      }

      const avgGain = sumGain / period;
      const avgLoss = sumLoss / period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
      }
    }
  }

  return result;
}

// ============================================================
// MACD (Moving Average Convergence Divergence) - 12, 26, 9
// ============================================================

export function computeMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macdLine: (number | null)[]; signalLine: (number | null)[]; histogram: (number | null)[] } {
  const emaFast = computeEMA(closes, fastPeriod);
  const emaSlow = computeEMA(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      macdLine.push(emaFast[i]! - emaSlow[i]!);
    } else {
      macdLine.push(null);
    }
  }

  const macdValues = macdLine.map(v => v ?? NaN);
  const signalLine = computeEMA(
    macdValues.map(v => (isNaN(v) ? NaN : v)),
    signalPeriod
  );

  const histogram: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogram.push(macdLine[i]! - signalLine[i]!);
    } else {
      histogram.push(null);
    }
  }

  return { macdLine, signalLine, histogram };
}

// ============================================================
// Bollinger Bands - 20 period, 2 std dev
// ============================================================

export function computeBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = computeSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }

    let sumSquaredDiff = 0;
    let count = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (j >= 0 && isFiniteNumber(closes[j])) {
        const diff = closes[j] - middle[i]!;
        sumSquaredDiff += diff * diff;
        count++;
      }
    }

    if (count >= period) {
      const stdDev = Math.sqrt(sumSquaredDiff / count);
      upper.push(middle[i]! + stdDevMultiplier * stdDev);
      lower.push(middle[i]! - stdDevMultiplier * stdDev);
    } else {
      upper.push(null);
      lower.push(null);
    }
  }

  return { upper, middle, lower };
}

// ============================================================
// ATR (Average True Range) - 14 period
// ============================================================

export function computeATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): (number | null)[] {
  const trueRanges: number[] = [];

  for (let i = 0; i < highs.length; i++) {
    if (i === 0 || !isFiniteNumber(highs[i]) || !isFiniteNumber(lows[i])) {
      trueRanges.push(highs[i] - lows[i] || 0);
      continue;
    }

    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(hl, hc, lc));
  }

  const result: (number | null)[] = [];
  let atr: number | null = null;

  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    if (atr === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += trueRanges[j];
      }
      atr = sum / period;
    } else {
      atr = (atr * (period - 1) + trueRanges[i]) / period;
    }

    result.push(atr);
  }

  return result;
}

// ============================================================
// ADX (Average Directional Index) - 14 period
// ============================================================

export function computeADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): (number | null)[] {
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
      tr.push(highs[0] - lows[0]);
      continue;
    }

    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hc, lc));
  }

  const smoothedPlusDM: number[] = [];
  const smoothedMinusDM: number[] = [];
  const smoothedTR: number[] = [];

  for (let i = 0; i < highs.length; i++) {
    if (i < period) {
      if (i === period - 1) {
        let sumPDM = 0, sumMDM = 0, sumTR = 0;
        for (let j = 0; j <= i; j++) {
          sumPDM += plusDM[j];
          sumMDM += minusDM[j];
          sumTR += tr[j];
        }
        smoothedPlusDM.push(sumPDM);
        smoothedMinusDM.push(sumMDM);
        smoothedTR.push(sumTR);
      } else {
        smoothedPlusDM.push(0);
        smoothedMinusDM.push(0);
        smoothedTR.push(0);
      }
    } else {
      const prevIdx = smoothedPlusDM.length - 1;
      smoothedPlusDM.push(smoothedPlusDM[prevIdx] - smoothedPlusDM[prevIdx] / period + plusDM[i]);
      smoothedMinusDM.push(smoothedMinusDM[prevIdx] - smoothedMinusDM[prevIdx] / period + minusDM[i]);
      smoothedTR.push(smoothedTR[prevIdx] - smoothedTR[prevIdx] / period + tr[i]);
    }
  }

  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];

  for (let i = 0; i < highs.length; i++) {
    if (smoothedTR[i] === 0) {
      plusDI.push(0);
      minusDI.push(0);
      dx.push(0);
    } else {
      const pdi = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
      const mdi = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
      plusDI.push(pdi);
      minusDI.push(mdi);
      dx.push(pdi + mdi === 0 ? 0 : (Math.abs(pdi - mdi) / (pdi + mdi)) * 100);
    }
  }

  const result: (number | null)[] = [];
  let adx: number | null = null;

  for (let i = 0; i < dx.length; i++) {
    if (i < period * 2 - 1) {
      result.push(null);
      continue;
    }

    if (adx === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += dx[j];
      }
      adx = sum / period;
    } else {
      adx = (adx * (period - 1) + dx[i]) / period;
    }

    result.push(atr !== null ? adx : null);
  }

  return result;
}

// ============================================================
// Stochastic Oscillator - 14, 3
// ============================================================

export function computeStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: (number | null)[]; d: (number | null)[] } {
  const rawK: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      rawK.push(null);
      continue;
    }

    let highestHigh = -Infinity;
    let lowestLow = Infinity;

    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (isFiniteNumber(highs[j])) highestHigh = Math.max(highestHigh, highs[j]);
      if (isFiniteNumber(lows[j])) lowestLow = Math.min(lowestLow, lows[j]);
    }

    if (highestHigh === lowestLow) {
      rawK.push(50);
    } else {
      rawK.push(((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100);
    }
  }

  const kValues = rawK.map(v => v ?? NaN);
  const d = computeSMA(
    kValues.map(v => (isNaN(v) ? NaN : v)),
    dPeriod
  );

  return { k: rawK, d };
}

// ============================================================
// Williams %R
// ============================================================

export function computeWilliamsR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    let highestHigh = -Infinity;
    let lowestLow = Infinity;

    for (let j = i - period + 1; j <= i; j++) {
      if (isFiniteNumber(highs[j])) highestHigh = Math.max(highestHigh, highs[j]);
      if (isFiniteNumber(lows[j])) lowestLow = Math.min(lowestLow, lows[j]);
    }

    if (highestHigh === lowestLow) {
      result.push(-50);
    } else {
      result.push(((highestHigh - closes[i]) / (highestHigh - lowestLow)) * -100);
    }
  }

  return result;
}

// ============================================================
// CCI (Commodity Channel Index) - 14 period
// ============================================================

export function computeCCI(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): (number | null)[] {
  const typicalPrices: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
  }

  const smaTP = computeSMA(typicalPrices, period);
  const result: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (smaTP[i] === null) {
      result.push(null);
      continue;
    }

    let sumDev = 0;
    let count = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (j >= 0 && isFiniteNumber(typicalPrices[j])) {
        sumDev += Math.abs(typicalPrices[j] - smaTP[i]!);
        count++;
      }
    }

    const meanDev = count >= period ? sumDev / count : 0;
    result.push(meanDev === 0 ? 0 : (typicalPrices[i] - smaTP[i]!) / (0.015 * meanDev));
  }

  return result;
}

// ============================================================
// OBV (On Balance Volume)
// ============================================================

export function computeOBV(closes: number[], volumes: number[]): number[] {
  const result: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(volumes[i] || 0);
    } else {
      if (closes[i] > closes[i - 1]) {
        result.push(result[i - 1] + (volumes[i] || 0));
      } else if (closes[i] < closes[i - 1]) {
        result.push(result[i - 1] - (volumes[i] || 0));
      } else {
        result.push(result[i - 1]);
      }
    }
  }

  return result;
}

// ============================================================
// Complete Technical Analysis for a Stock
// ============================================================

export function computeAllIndicators(bars: PriceBar[]): TechnicalIndicators[] {
  if (bars.length === 0) return [];

  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const volumes = bars.map(b => b.volume);

  const rsi = computeRSI(closes, 14);
  const macd = computeMACD(closes, 12, 26, 9);
  const bb = computeBollingerBands(closes, 20, 2);
  const sma20 = computeSMA(closes, 20);
  const sma50 = computeSMA(closes, 50);
  const sma200 = computeSMA(closes, 200);
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const atr = computeATR(highs, lows, closes, 14);
  const adx = computeADX(highs, lows, closes, 14);
  const stoch = computeStochastic(highs, lows, closes, 14, 3);
  const williamsR = computeWilliamsR(highs, lows, closes, 14);
  const cci = computeCCI(highs, lows, closes, 14);
  const obv = computeOBV(closes, volumes);

  const results: TechnicalIndicators[] = [];

  for (let i = 0; i < bars.length; i++) {
    results.push({
      date: bars[i].date,
      rsi14: safeNum(rsi[i] ?? 0),
      macdLine: safeNum(macd.macdLine[i] ?? 0),
      macdSignal: safeNum(macd.signalLine[i] ?? 0),
      macdHist: safeNum(macd.histogram[i] ?? 0),
      bbUpper: safeNum(bb.upper[i] ?? 0),
      bbMiddle: safeNum(bb.middle[i] ?? 0),
      bbLower: safeNum(bb.lower[i] ?? 0),
      sma20: safeNum(sma20[i] ?? 0),
      sma50: safeNum(sma50[i] ?? 0),
      sma200: safeNum(sma200[i] ?? 0),
      ema12: safeNum(ema12[i] ?? 0),
      ema26: safeNum(ema26[i] ?? 0),
      atr14: safeNum(atr[i] ?? 0),
      adx14: safeNum(adx[i] ?? 0),
      stochasticK: safeNum(stoch.k[i] ?? 0),
      stochasticD: safeNum(stoch.d[i] ?? 0),
      williamsR: safeNum(williamsR[i] ?? 0),
      cci14: safeNum(cci[i] ?? 0),
      obv: safeNum(obv[i]),
    });
  }

  return results;
}

// ============================================================
// Supabase Operations
// ============================================================

/**
 * Compute and store technical indicators for a single stock
 */
export async function computeAndStoreIndicators(stockId: string): Promise<number> {
  // Fetch price history from Supabase
  const { data: priceHistory, error } = await supabase
    .from('PriceHistory')
    .select('*')
    .eq('stockId', stockId)
    .order('date', { ascending: true });

  if (error || !priceHistory || priceHistory.length === 0) return 0;

  // Convert to PriceBar format
  const bars: PriceBar[] = priceHistory.map(p => ({
    date: new Date(p.date),
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    volume: p.volume,
    adjClose: p.adjClose,
  }));

  // Compute all indicators
  const indicators = computeAllIndicators(bars);

  // Store the most recent 252 trading days
  const recentIndicators = indicators.slice(-252);
  let stored = 0;

  for (const ind of recentIndicators) {
    const dateOnly = new Date(ind.date);
    dateOnly.setHours(0, 0, 0, 0);
    const dateStr = dateOnly.toISOString().split('T')[0];

    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('TechnicalIndicator')
        .select('id')
        .eq('stockId', stockId)
        .eq('date', dateStr)
        .single();

      const indicatorData = {
        stockId,
        date: dateStr,
        rsi14: ind.rsi14,
        macdLine: ind.macdLine,
        macdSignal: ind.macdSignal,
        macdHist: ind.macdHist,
        bbUpper: ind.bbUpper,
        bbMiddle: ind.bbMiddle,
        bbLower: ind.bbLower,
        sma20: ind.sma20,
        sma50: ind.sma50,
        sma200: ind.sma200,
        ema12: ind.ema12,
        ema26: ind.ema26,
        atr14: ind.atr14,
        adx14: ind.adx14,
        stochasticK: ind.stochasticK,
        stochasticD: ind.stochasticD,
        williamsR: ind.williamsR,
        cci14: ind.cci14,
        obv: ind.obv,
      };

      if (existing) {
        await supabase
          .from('TechnicalIndicator')
          .update(indicatorData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('TechnicalIndicator')
          .insert(indicatorData);
      }
      stored++;
    } catch (error) {
      console.warn(`[TechnicalComputer] Error storing indicator: ${(error as Error).message}`);
    }
  }

  return stored;
}

/**
 * Compute and store technical indicators for all stocks
 */
export async function computeAllStocksIndicators(
  onProgress?: (completed: number, total: number) => void
): Promise<{ total: number; computed: number; skipped: number; errors: string[] }> {
  const { data: stocks } = await supabase
    .from('Stock')
    .select('id, ticker');

  let computed = 0;
  let skipped = 0;
  const errors: string[] = [];

  if (!stocks) return { total: 0, computed: 0, skipped: 0, errors: ['No stocks found'] };

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];

    try {
      const { count } = await supabase
        .from('PriceHistory')
        .select('*', { count: 'exact', head: true })
        .eq('stockId', stock.id);

      if (!count || count < 20) {
        skipped++;
        continue;
      }

      const stored = await computeAndStoreIndicators(stock.id);
      if (stored > 0) {
        computed++;
      } else {
        skipped++;
      }
    } catch (error) {
      errors.push(`${stock.ticker}: ${(error as Error).message}`);
    }

    onProgress?.(i + 1, stocks.length);
  }

  return { total: stocks.length, computed, skipped, errors };
}
