import { describe, it, expect } from 'vitest'
import { calculateFloorPivots, calculateFibonacciPivots, findSwingHighsLows } from '../supportResistance'

describe('Floor Pivot Points', () => {
  it('calculates standard floor pivots', () => {
    const result = calculateFloorPivots(100, 90, 95)
    const pivot = (100 + 90 + 95) / 3 // 95
    expect(result.pivot).toBeCloseTo(95, 2)
    expect(result.r1).toBeCloseTo(2 * 95 - 90, 2) // 100
    expect(result.s1).toBeCloseTo(2 * 95 - 100, 2) // 90
    expect(result.type).toBe('floor')
  })

  it('R1 > Pivot > S1', () => {
    const result = calculateFloorPivots(50, 30, 40)
    expect(result.r1).toBeGreaterThan(result.pivot)
    expect(result.s1).toBeLessThan(result.pivot)
  })
})

describe('Fibonacci Pivots', () => {
  it('calculates fibonacci pivots', () => {
    const result = calculateFibonacciPivots(100, 90, 95)
    expect(result.type).toBe('fibonacci')
    expect(result.r1).toBeGreaterThan(result.pivot)
    expect(result.s1).toBeLessThan(result.pivot)
  })
})

describe('Swing Highs/Lows', () => {
  it('finds swing highs and lows', () => {
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
    // Should find some supports and resistances
    expect(result.supports.length + result.resistances.length).toBeGreaterThan(0)
  })
})
