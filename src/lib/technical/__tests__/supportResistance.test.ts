import { describe, it, expect } from 'vitest'
import { calculateFloorPivots, calculateFibonacciPivots, findSwingHighsLows } from '../supportResistance'

describe('Floor Pivot Points', () => {
  it('calculates standard floor pivots with known values', () => {
    const result = calculateFloorPivots(100, 90, 95)
    const pivot = (100 + 90 + 95) / 3 // 95
    expect(result.pivot).toBeCloseTo(95, 2)
    expect(result.r1).toBeCloseTo(2 * 95 - 90, 2) // 100
    expect(result.s1).toBeCloseTo(2 * 95 - 100, 2) // 90
    expect(result.r2).toBeCloseTo(95 + (100 - 90), 2) // 105
    expect(result.s2).toBeCloseTo(95 - (100 - 90), 2) // 85
    expect(result.type).toBe('floor')
  })

  it('R1 > Pivot > S1', () => {
    const result = calculateFloorPivots(50, 30, 40)
    expect(result.r1).toBeGreaterThan(result.pivot)
    expect(result.s1).toBeLessThan(result.pivot)
  })

  it('R2 > R1 and S1 > S2', () => {
    const result = calculateFloorPivots(50, 30, 40)
    expect(result.r2).toBeGreaterThan(result.r1)
    expect(result.s1).toBeGreaterThan(result.s2)
  })

  it('R3 > R2 and S2 > S3', () => {
    const result = calculateFloorPivots(50, 30, 40)
    expect(result.r3).toBeGreaterThan(result.r2)
    expect(result.s2).toBeGreaterThan(result.s3)
  })

  it('pivot equals the average of high, low, close', () => {
    const result = calculateFloorPivots(110, 85, 102)
    expect(result.pivot).toBeCloseTo((110 + 85 + 102) / 3, 6)
  })

  it('handles case where high equals low (no range)', () => {
    const result = calculateFloorPivots(100, 100, 100)
    expect(result.pivot).toBeCloseTo(100, 2)
    expect(result.r1).toBeCloseTo(100, 2)
    expect(result.s1).toBeCloseTo(100, 2)
    expect(result.r2).toBeCloseTo(100, 2)
    expect(result.s2).toBeCloseTo(100, 2)
  })
})

describe('Fibonacci Pivots', () => {
  it('calculates fibonacci pivots with known values', () => {
    const high = 100
    const low = 90
    const close = 95
    const pivot = (high + low + close) / 3 // 95
    const range = high - low // 10

    const result = calculateFibonacciPivots(high, low, close)
    expect(result.type).toBe('fibonacci')
    expect(result.pivot).toBeCloseTo(pivot, 2)
    expect(result.r1).toBeCloseTo(pivot + range * 0.382, 2) // 98.82
    expect(result.r2).toBeCloseTo(pivot + range * 0.618, 2) // 101.18
    expect(result.r3).toBeCloseTo(pivot + range * 1.000, 2) // 105
    expect(result.s1).toBeCloseTo(pivot - range * 0.382, 2) // 91.18
    expect(result.s2).toBeCloseTo(pivot - range * 0.618, 2) // 88.82
    expect(result.s3).toBeCloseTo(pivot - range * 1.000, 2) // 85
  })

  it('R1 > Pivot > S1', () => {
    const result = calculateFibonacciPivots(100, 90, 95)
    expect(result.r1).toBeGreaterThan(result.pivot)
    expect(result.s1).toBeLessThan(result.pivot)
  })

  it('Fibonacci R1 is closer to pivot than floor R1 for normal range', () => {
    const floor = calculateFloorPivots(100, 90, 95)
    const fib = calculateFibonacciPivots(100, 90, 95)
    // Floor R1 = 2*95 - 90 = 100
    // Fib R1 = 95 + 10 * 0.382 = 98.82
    // Fib R1 should be closer to pivot (95) than floor R1
    expect(Math.abs(fib.r1 - fib.pivot)).toBeLessThan(Math.abs(floor.r1 - floor.pivot))
  })

  it('handles case where high equals low (no range)', () => {
    const result = calculateFibonacciPivots(100, 100, 100)
    expect(result.pivot).toBeCloseTo(100, 2)
    expect(result.r1).toBeCloseTo(100, 2)
    expect(result.s1).toBeCloseTo(100, 2)
  })
})

describe('Swing Highs/Lows', () => {
  it('finds swing highs and lows with simple price series', () => {
    const prices = [
      { high: 10, low: 8, date: '2024-01-01' },
      { high: 12, low: 9, date: '2024-01-02' },
      { high: 15, low: 10, date: '2024-01-03' },  // potential swing high
      { high: 13, low: 11, date: '2024-01-04' },
      { high: 11, low: 7, date: '2024-01-05' },   // potential swing low
      { high: 14, low: 9, date: '2024-01-06' },
      { high: 13, low: 10, date: '2024-01-07' },
      { high: 12, low: 8, date: '2024-01-08' },
      { high: 14, low: 9, date: '2024-01-09' },
      { high: 13, low: 10, date: '2024-01-10' },
      { high: 12, low: 8, date: '2024-01-11' },
    ]
    const result = findSwingHighsLows(prices, 2)
    expect(result.supports.length + result.resistances.length).toBeGreaterThan(0)
  })

  it('returns at most 3 support and 3 resistance levels', () => {
    // Create a long price series with many swings
    const prices: { high: number; low: number; date: string }[] = []
    for (let i = 0; i < 30; i++) {
      const wave = Math.sin(i * 0.5) * 10
      prices.push({
        high: 100 + wave + 2,
        low: 100 + wave - 2,
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      })
    }
    const result = findSwingHighsLows(prices, 3)
    expect(result.supports.length).toBeLessThanOrEqual(3)
    expect(result.resistances.length).toBeLessThanOrEqual(3)
  })

  it('returns empty arrays for short price series', () => {
    const prices = [
      { high: 10, low: 8, date: '2024-01-01' },
      { high: 12, low: 9, date: '2024-01-02' },
    ]
    const result = findSwingHighsLows(prices, 2)
    expect(result.supports).toHaveLength(0)
    expect(result.resistances).toHaveLength(0)
  })

  it('uses default lookback of 5', () => {
    // Need enough prices for default lookback=5
    const prices: { high: number; low: number; date: string }[] = []
    for (let i = 0; i < 20; i++) {
      prices.push({
        high: 100 + Math.sin(i) * 5,
        low: 95 + Math.sin(i) * 5,
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      })
    }
    const result = findSwingHighsLows(prices)
    // Should not throw and should return valid structure
    expect(result).toHaveProperty('supports')
    expect(result).toHaveProperty('resistances')
    expect(Array.isArray(result.supports)).toBe(true)
    expect(Array.isArray(result.resistances)).toBe(true)
  })

  it('identifies clear swing high correctly', () => {
    // Create series with one clear peak in the middle
    const prices = [
      { high: 10, low: 8, date: '2024-01-01' },
      { high: 12, low: 10, date: '2024-01-02' },
      { high: 20, low: 18, date: '2024-01-03' },  // clear peak
      { high: 12, low: 10, date: '2024-01-04' },
      { high: 10, low: 8, date: '2024-01-05' },
      { high: 11, low: 9, date: '2024-01-06' },
      { high: 10, low: 8, date: '2024-01-07' },
    ]
    const result = findSwingHighsLows(prices, 2)
    expect(result.resistances).toContain(20)
  })

  it('identifies clear swing low correctly', () => {
    // Create series with one clear trough in the middle
    const prices = [
      { high: 20, low: 18, date: '2024-01-01' },
      { high: 18, low: 16, date: '2024-01-02' },
      { high: 15, low: 5, date: '2024-01-03' },   // clear trough
      { high: 18, low: 16, date: '2024-01-04' },
      { high: 20, low: 18, date: '2024-01-05' },
      { high: 19, low: 17, date: '2024-01-06' },
      { high: 20, low: 18, date: '2024-01-07' },
    ]
    const result = findSwingHighsLows(prices, 2)
    expect(result.supports).toContain(5)
  })
})
