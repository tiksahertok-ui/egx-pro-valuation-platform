import { describe, it, expect } from 'vitest'
import { validateDataSufficiency, INDICATOR_MINIMUM_PERIODS } from '../validation'

describe('Data Sufficiency Validation', () => {
  it('SMA200 requires 200 periods', () => {
    const result = validateDataSufficiency('SMA200', 199)
    expect(result.sufficient).toBe(false)
    expect(result.minimumRequired).toBe(200)

    const result2 = validateDataSufficiency('SMA200', 200)
    expect(result2.sufficient).toBe(true)
  })

  it('RSI requires 15 periods', () => {
    const result = validateDataSufficiency('RSI', 14)
    expect(result.sufficient).toBe(false)

    const result2 = validateDataSufficiency('RSI', 15)
    expect(result2.sufficient).toBe(true)
  })

  it('MACD requires 27 periods', () => {
    expect(validateDataSufficiency('MACD', 26).sufficient).toBe(false)
    expect(validateDataSufficiency('MACD', 27).sufficient).toBe(true)
  })

  it('ADX requires 29 periods', () => {
    expect(validateDataSufficiency('ADX', 28).sufficient).toBe(false)
    expect(validateDataSufficiency('ADX', 29).sufficient).toBe(true)
  })

  it('returns default of 14 for unknown indicators', () => {
    const result = validateDataSufficiency('UNKNOWN', 14)
    expect(result.minimumRequired).toBe(14)
    expect(result.sufficient).toBe(true)
  })

  it('all minimum periods are reasonable', () => {
    for (const [indicator, minimum] of Object.entries(INDICATOR_MINIMUM_PERIODS)) {
      expect(minimum).toBeGreaterThan(0)
      expect(minimum).toBeLessThanOrEqual(300)
    }
  })
})
