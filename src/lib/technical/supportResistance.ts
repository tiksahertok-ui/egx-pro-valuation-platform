export interface PivotLevels {
  pivot: number
  r1: number  // Resistance 1
  r2: number  // Resistance 2
  r3: number  // Resistance 3
  s1: number  // Support 1
  s2: number  // Support 2
  s3: number  // Support 3
  type: 'floor' | 'fibonacci' | 'camarilla'
}

// Traditional Floor Trader Pivot Points
export function calculateFloorPivots(
  prevHigh: number,
  prevLow: number,
  prevClose: number
): PivotLevels {
  const pivot = (prevHigh + prevLow + prevClose) / 3
  return {
    pivot,
    r1: 2 * pivot - prevLow,
    r2: pivot + (prevHigh - prevLow),
    r3: prevHigh + 2 * (pivot - prevLow),
    s1: 2 * pivot - prevHigh,
    s2: pivot - (prevHigh - prevLow),
    s3: prevLow - 2 * (prevHigh - pivot),
    type: 'floor',
  }
}

// Fibonacci Pivot Points
export function calculateFibonacciPivots(
  prevHigh: number,
  prevLow: number,
  prevClose: number
): PivotLevels {
  const pivot = (prevHigh + prevLow + prevClose) / 3
  const range = prevHigh - prevLow
  return {
    pivot,
    r1: pivot + range * 0.382,
    r2: pivot + range * 0.618,
    r3: pivot + range * 1.000,
    s1: pivot - range * 0.382,
    s2: pivot - range * 0.618,
    s3: pivot - range * 1.000,
    type: 'fibonacci',
  }
}

// Fractal-based dynamic S/R (5-bar lookback)
export function findSwingHighsLows(
  prices: { high: number; low: number; date: string }[],
  lookback: number = 5
): { supports: number[]; resistances: number[] } {
  const supports: number[] = []
  const resistances: number[] = []

  for (let i = lookback; i < prices.length - lookback; i++) {
    const slice = prices.slice(i - lookback, i + lookback + 1)
    const centralHigh = prices[i].high
    const centralLow = prices[i].low

    if (slice.every(p => p.high <= centralHigh)) {
      resistances.push(centralHigh)
    }
    if (slice.every(p => p.low >= centralLow)) {
      supports.push(centralLow)
    }
  }

  // Return the 3 most recent significant levels
  return {
    supports: supports.slice(-3),
    resistances: resistances.slice(-3),
  }
}
