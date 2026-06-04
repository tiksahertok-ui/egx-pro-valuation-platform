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

  it('SMA20 requires 20 periods', () => {
    expect(validateDataSufficiency('SMA20', 19).sufficient).toBe(false)
    expect(validateDataSufficiency('SMA20', 20).sufficient).toBe(true)
  })

  it('SMA50 requires 50 periods', () => {
    expect(validateDataSufficiency('SMA50', 49).sufficient).toBe(false)
    expect(validateDataSufficiency('SMA50', 50).sufficient).toBe(true)
  })

  it('EMA12 requires 13 periods', () => {
    expect(validateDataSufficiency('EMA12', 12).sufficient).toBe(false)
    expect(validateDataSufficiency('EMA12', 13).sufficient).toBe(true)
  })

  it('EMA26 requires 27 periods', () => {
    expect(validateDataSufficiency('EMA26', 26).sufficient).toBe(false)
    expect(validateDataSufficiency('EMA26', 27).sufficient).toBe(true)
  })

  it('ATR requires 15 periods', () => {
    expect(validateDataSufficiency('ATR', 14).sufficient).toBe(false)
    expect(validateDataSufficiency('ATR', 15).sufficient).toBe(true)
  })

  it('STOCHASTIC requires 15 periods', () => {
    expect(validateDataSufficiency('STOCHASTIC', 14).sufficient).toBe(false)
    expect(validateDataSufficiency('STOCHASTIC', 15).sufficient).toBe(true)
  })

  it('WILLIAMS_R requires 15 periods', () => {
    expect(validateDataSufficiency('WILLIAMS_R', 14).sufficient).toBe(false)
    expect(validateDataSufficiency('WILLIAMS_R', 15).sufficient).toBe(true)
  })

  it('CCI requires 15 periods', () => {
    expect(validateDataSufficiency('CCI', 14).sufficient).toBe(false)
    expect(validateDataSufficiency('CCI', 15).sufficient).toBe(true)
  })

  it('BOLLINGER requires 21 periods', () => {
    expect(validateDataSufficiency('BOLLINGER', 20).sufficient).toBe(false)
    expect(validateDataSufficiency('BOLLINGER', 21).sufficient).toBe(true)
  })

  it('OBV requires only 2 periods', () => {
    expect(validateDataSufficiency('OBV', 1).sufficient).toBe(false)
    expect(validateDataSufficiency('OBV', 2).sufficient).toBe(true)
  })

  it('returns default of 14 for unknown indicators', () => {
    const result = validateDataSufficiency('UNKNOWN', 14)
    expect(result.minimumRequired).toBe(14)
    expect(result.sufficient).toBe(true)
  })

  it('returns default of 14 with insufficient data for unknown', () => {
    const result = validateDataSufficiency('UNKNOWN', 13)
    expect(result.minimumRequired).toBe(14)
    expect(result.sufficient).toBe(false)
  })

  it('exactly enough data is sufficient', () => {
    for (const [indicator, minimum] of Object.entries(INDICATOR_MINIMUM_PERIODS)) {
      const result = validateDataSufficiency(indicator, minimum)
      expect(result.sufficient).toBe(true)
    }
  })

  it('one less than needed is insufficient', () => {
    for (const [indicator, minimum] of Object.entries(INDICATOR_MINIMUM_PERIODS)) {
      const result = validateDataSufficiency(indicator, minimum - 1)
      expect(result.sufficient).toBe(false)
    }
  })

  it('all minimum periods are reasonable', () => {
    for (const [indicator, minimum] of Object.entries(INDICATOR_MINIMUM_PERIODS)) {
      expect(minimum).toBeGreaterThan(0)
      expect(minimum).toBeLessThanOrEqual(300)
    }
  })

  it('INDICATOR_MINIMUM_PERIODS contains all expected indicators', () => {
    const expectedIndicators = [
      'RSI', 'MACD', 'SMA20', 'SMA50', 'SMA200',
      'EMA12', 'EMA26', 'ATR', 'ADX', 'STOCHASTIC',
      'WILLIAMS_R', 'CCI', 'BOLLINGER', 'OBV',
    ]
    for (const indicator of expectedIndicators) {
      expect(INDICATOR_MINIMUM_PERIODS).toHaveProperty(indicator)
    }
  })
})
