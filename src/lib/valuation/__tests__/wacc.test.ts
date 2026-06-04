import { describe, it, expect } from 'vitest'
import { calculateCostOfEquityEgypt, calculateWACC, validateTerminalGrowthRate } from '../wacc'
import { EGYPT_MARKET_PARAMS } from '../egyptMarketParams'

describe('Egypt Cost of Equity (CAPM)', () => {
  it('calculates cost of equity for beta=1.0', () => {
    const ke = calculateCostOfEquityEgypt(1.0)
    // Rf (27.5%) + 1.0 * TotalERP (13%) = 40.5%
    expect(ke).toBeCloseTo(0.405, 2)
  })

  it('calculates cost of equity for beta=0.5', () => {
    const ke = calculateCostOfEquityEgypt(0.5)
    // 27.5% + 0.5 * 13% = 34%
    expect(ke).toBeCloseTo(0.34, 2)
  })

  it('calculates cost of equity for beta=1.5', () => {
    const ke = calculateCostOfEquityEgypt(1.5)
    // 27.5% + 1.5 * 13% = 47%
    expect(ke).toBeCloseTo(0.47, 2)
  })

  it('uses custom params when provided', () => {
    const customParams = { ...EGYPT_MARKET_PARAMS, riskFreeRate: 0.20 }
    const ke = calculateCostOfEquityEgypt(1.0, customParams)
    // 20% + 1.0 * 13% = 33%
    expect(ke).toBeCloseTo(0.33, 2)
  })
})

describe('WACC Calculation', () => {
  it('calculates WACC with equity and debt', () => {
    const ke = 0.40
    const kd = 0.15
    const wacc = calculateWACC(ke, kd, 0.7, 0.3)
    // 0.7 * 0.40 + 0.3 * 0.15 * (1 - 0.225) = 0.28 + 0.0349 = 0.3149
    expect(wacc).toBeCloseTo(0.3149, 3)
  })

  it('100% equity company', () => {
    const wacc = calculateWACC(0.40, 0.15, 1.0, 0.0)
    expect(wacc).toBeCloseTo(0.40, 2)
  })
})

describe('Terminal Growth Rate Validation', () => {
  it('rejects terminal growth >= WACC', () => {
    const result = validateTerminalGrowthRate(0.22, 0.22, 'EGP_NOMINAL')
    expect(result.valid).toBe(false)
  })

  it('rejects terminal growth > WACC', () => {
    const result = validateTerminalGrowthRate(0.25, 0.22, 'EGP_NOMINAL')
    expect(result.valid).toBe(false)
  })

  it('accepts valid terminal growth', () => {
    const result = validateTerminalGrowthRate(0.08, 0.22, 'EGP_NOMINAL')
    expect(result.valid).toBe(true)
  })

  it('warns on low EGP nominal terminal growth', () => {
    const result = validateTerminalGrowthRate(0.03, 0.22, 'EGP_NOMINAL')
    expect(result.valid).toBe(true)
    expect(result.warning).toContain('inflation')
  })

  it('warns on high USD real terminal growth', () => {
    const result = validateTerminalGrowthRate(0.06, 0.12, 'USD_REAL')
    expect(result.valid).toBe(true)
    expect(result.warning).toContain('unusually high')
  })
})
