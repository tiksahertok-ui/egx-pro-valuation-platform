/**
 * Support & Resistance Level Calculator
 *
 * Implements:
 * - Classic Pivot Points (P, S1, R1, S2, R2)
 * - Fibonacci Pivot Points
 * - Volume-Weighted Average Price (VWAP)
 * - Key Swing Highs/Lows (20-day window)
 *
 * P1.4: Exposed via /api/technical/support-resistance
 */

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SupportResistanceResult {
  date: string;
  pivot: number;
  support1: number;
  resistance1: number;
  support2: number;
  resistance2: number;
  vwap: number;
  swingHigh: number;
  swingLow: number;
}

/**
 * Calculate Classic Pivot Points.
 *
 * Formula:
 *   Pivot = (H + L + C) / 3
 *   S1 = 2 * Pivot - H
 *   R1 = 2 * Pivot - L
 *   S2 = Pivot - (H - L)
 *   R2 = Pivot + (H - L)
 *
 * @param high - Previous period high
 * @param low - Previous period low
 * @param close - Previous period close
 */
export function classicPivotPoints(high: number, low: number, close: number): {
  pivot: number; support1: number; resistance1: number; support2: number; resistance2: number;
} {
  const pivot = (high + low + close) / 3;
  const support1 = 2 * pivot - high;
  const resistance1 = 2 * pivot - low;
  const support2 = pivot - (high - low);
  const resistance2 = pivot + (high - low);

  return { pivot, support1, resistance1, support2, resistance2 };
}

/**
 * Calculate Fibonacci Pivot Points.
 *
 * Formula (based on Pivot = (H + L + C) / 3):
 *   R1 = Pivot + 0.382 * (H - L)
 *   R2 = Pivot + 0.618 * (H - L)
 *   S1 = Pivot - 0.382 * (H - L)
 *   S2 = Pivot - 0.618 * (H - L)
 */
export function fibonacciPivotPoints(high: number, low: number, close: number): {
  pivot: number; support1: number; resistance1: number; support2: number; resistance2: number;
} {
  const pivot = (high + low + close) / 3;
  const range = high - low;

  const support1 = pivot - 0.382 * range;
  const resistance1 = pivot + 0.382 * range;
  const support2 = pivot - 0.618 * range;
  const resistance2 = pivot + 0.618 * range;

  return { pivot, support1, resistance1, support2, resistance2 };
}

/**
 * Calculate Volume-Weighted Average Price (VWAP) over a set of periods.
 *
 * Formula: VWAP = Sum(close * volume) / Sum(volume)
 *
 * @param data - Array of OHLCV data points
 */
export function calculateVWAP(data: OHLCV[]): number {
  let totalValue = 0;
  let totalVolume = 0;

  for (const bar of data) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    totalValue += typicalPrice * bar.volume;
    totalVolume += bar.volume;
  }

  return totalVolume > 0 ? totalValue / totalVolume : 0;
}

/**
 * Identify key swing highs and lows using a rolling window.
 *
 * A swing high is a bar whose high is higher than all highs
 * in the surrounding window. A swing low is a bar whose low
 * is lower than all lows in the surrounding window.
 *
 * @param data - Array of OHLCV data points (sorted chronologically)
 * @param windowSize - Number of bars on each side (default 10 for 20-day window)
 */
export function identifySwingPoints(data: OHLCV[], windowSize: number = 10): {
  swingHighs: Array<{ date: string; value: number }>;
  swingLows: Array<{ date: string; value: number }>;
} {
  const swingHighs: Array<{ date: string; value: number }> = [];
  const swingLows: Array<{ date: string; value: number }> = [];

  if (data.length < windowSize * 2 + 1) {
    return { swingHighs, swingLows };
  }

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const currentHigh = data[i]!.high;
    const currentLow = data[i]!.low;

    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j === i) continue;
      if (data[j]!.high >= currentHigh) isSwingHigh = false;
      if (data[j]!.low <= currentLow) isSwingLow = false;
    }

    if (isSwingHigh) {
      swingHighs.push({ date: data[i]!.date, value: currentHigh });
    }
    if (isSwingLow) {
      swingLows.push({ date: data[i]!.date, value: currentLow });
    }
  }

  return { swingHighs, swingLows };
}

/**
 * Calculate full support & resistance analysis for a set of price data.
 *
 * Returns pivot points (classic), VWAP, and the most recent swing high/low
 * for each day in the analysis period.
 *
 * @param data - Array of OHLCV data points (sorted chronologically, oldest first)
 * @param days - Number of recent days to analyze (default 20)
 */
export function calculateSupportResistance(data: OHLCV[], days: number = 20): SupportResistanceResult[] {
  if (data.length < 2) return [];

  const results: SupportResistanceResult[] = [];
  const analysisDays = Math.min(days, data.length);

  // Calculate VWAP over the full dataset
  const vwap = calculateVWAP(data.slice(-analysisDays));

  // Get swing points from full dataset
  const { swingHighs, swingLows } = identifySwingPoints(data);

  for (let i = data.length - analysisDays; i < data.length; i++) {
    const current = data[i]!;
    // Use previous bar for pivot calculation
    const prevIdx = Math.max(0, i - 1);
    const prev = data[prevIdx]!;

    const pivots = classicPivotPoints(prev.high, prev.low, prev.close);

    // Find the most recent swing high/low up to this date
    const currentDate = current.date;
    const recentSwingHigh = swingHighs
      .filter(sh => sh.date <= currentDate)
      .pop()?.value ?? current.high;
    const recentSwingLow = swingLows
      .filter(sl => sl.date <= currentDate)
      .pop()?.value ?? current.low;

    results.push({
      date: current.date,
      pivot: Math.round(pivots.pivot * 100) / 100,
      support1: Math.round(pivots.support1 * 100) / 100,
      resistance1: Math.round(pivots.resistance1 * 100) / 100,
      support2: Math.round(pivots.support2 * 100) / 100,
      resistance2: Math.round(pivots.resistance2 * 100) / 100,
      vwap: Math.round(vwap * 100) / 100,
      swingHigh: Math.round(recentSwingHigh * 100) / 100,
      swingLow: Math.round(recentSwingLow * 100) / 100,
    });
  }

  return results;
}
