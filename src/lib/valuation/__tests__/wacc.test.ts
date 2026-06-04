import { describe, it, expect } from 'vitest'
import { calculateCostOfEquityEgypt, calculateWACC, validateTerminalGrowthRate } from '../wacc'
import { EGYPT_MARKET_PARAMS } from '../egyptMarketParams'

describe('Egypt Cost of Equity (CAPM)', () => {
  it('calculates cost of equity with default params for beta=1.0', () => {
    const ke = calculateCostOfEquityEgypt(1.0)
    // Rf (19%) + 1.0 * TotalERP (12%) = 31%
    expect(ke).toBeCloseTo(0.31, 2)
  })

  it('calculates cost of equity with default params for beta=0.5', () => {
    const ke = calculateCostOfEquityEgypt(0.5)
    // 19% + 0.5 * 12% = 25%
    expect(ke).toBeCloseTo(0.25, 2)
  })

  it('calculates cost of equity with default params for beta=1.5', () => {
    const ke = calculateCostOfEquityEgypt(1.5)
    // 19% + 1.5 * 12% = 37%
    expect(ke).toBeCloseTo(0.37, 2)
  })

  it('calculates cost of equity with default params for beta=2.0', () => {
    const ke = calculateCostOfEquityEgypt(2.0)
    // 19% + 2.0 * 12% = 43%
    expect(ke).toBeCloseTo(0.43, 2)
  })

  it('uses custom params when provided', () => {
    const customParams = { ...EGYPT_MARKET_PARAMS, riskFreeRate: 0.20 }
    const ke = calculateCostOfEquityEgypt(1.0, customParams)
    // 20% + 1.0 * 12% = 32%
    expect(ke).toBeCloseTo(0.32, 2)
  })

  it('uses custom totalEquityRiskPremium', () => {
    const customParams = { ...EGYPT_MARKET_PARAMS, totalEquityRiskPremium: 0.15 }
    const ke = calculateCostOfEquityEgypt(1.0, customParams)
    // 19% + 1.0 * 15% = 34%
    expect(ke).toBeCloseTo(0.34, 2)
  })

  it('returns risk-free rate when beta is 0', () => {
    const ke = calculateCostOfEquityEgypt(0)
    expect(ke).toBeCloseTo(EGYPT_MARKET_PARAMS.riskFreeRate, 4)
  })

  it('produces linear scaling with beta', () => {
    const ke05 = calculateCostOfEquityEgypt(0.5)
    const ke10 = calculateCostOfEquityEgypt(1.0)
    const ke15 = calculateCostOfEquityEgypt(1.5)
    // The difference should be constant for equal beta increments
    expect(ke10 - ke05).toBeCloseTo(ke15 - ke10, 6)
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

  it('100% debt company (theoretical)', () => {
    const wacc = calculateWACC(0.40, 0.15, 0.0, 1.0)
    // 0 * 0.40 + 1.0 * 0.15 * (1 - 0.225) = 0.1163
    expect(wacc).toBeCloseTo(0.15 * (1 - 0.225), 4)
  })

  it('50/50 capital structure', () => {
    const ke = 0.35
    const kd = 0.20
    const wacc = calculateWACC(ke, kd, 0.5, 0.5)
    // 0.5 * 0.35 + 0.5 * 0.20 * (1 - 0.225) = 0.175 + 0.0775 = 0.2525
    expect(wacc).toBeCloseTo(0.2525, 3)
  })

  it('applies tax shield to cost of debt', () => {
    const ke = 0.30
    const kd = 0.20
    const waccNoDebt = calculateWACC(ke, kd, 1.0, 0.0)
    const waccWithDebt = calculateWACC(ke, kd, 0.5, 0.5)
    // WACC with debt should be lower due to tax shield
    expect(waccWithDebt).toBeLessThan(ke)
    expect(waccWithDebt).toBeLessThan(waccNoDebt)
  })

  it('uses custom tax rate', () => {
    const customParams = { ...EGYPT_MARKET_PARAMS, corporateTaxRate: 0.30 }
    const wacc = calculateWACC(0.40, 0.15, 0.5, 0.5, customParams)
    // 0.5 * 0.40 + 0.5 * 0.15 * (1 - 0.30) = 0.20 + 0.0525 = 0.2525
    expect(wacc).toBeCloseTo(0.2525, 3)
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

  it('EGP_REAL convention accepts moderate growth without warning', () => {
    const result = validateTerminalGrowthRate(0.04, 0.12, 'EGP_REAL')
    expect(result.valid).toBe(true)
    expect(result.warning).toBeUndefined()
  })

  it('terminal growth equal to WACC is invalid (Gordon Growth Model)', () => {
    const result = validateTerminalGrowthRate(0.15, 0.15, 'EGP_NOMINAL')
    expect(result.valid).toBe(false)
    expect(result.warning).toContain('must be less than WACC')
  })

  it('very low growth for EGP_NOMINAL triggers warning', () => {
    const result = validateTerminalGrowthRate(0.02, 0.22, 'EGP_NOMINAL')
    expect(result.valid).toBe(true)
    expect(result.warning).toBeDefined()
    expect(result.warning).toContain('inflation')
  })

  it('very high growth for USD_REAL triggers warning', () => {
    const result = validateTerminalGrowthRate(0.08, 0.15, 'USD_REAL')
    expect(result.valid).toBe(true)
    expect(result.warning).toBeDefined()
    expect(result.warning).toContain('unusually high')
  })

  it('borderline EGP nominal just above 5% does not trigger low growth warning', () => {
    const result = validateTerminalGrowthRate(0.06, 0.22, 'EGP_NOMINAL')
    expect(result.valid).toBe(true)
    expect(result.warning).toBeUndefined()
  })

  it('borderline USD real at exactly 5% does not trigger high growth warning', () => {
    const result = validateTerminalGrowthRate(0.05, 0.12, 'USD_REAL')
    expect(result.valid).toBe(true)
    expect(result.warning).toBeUndefined()
  })
})
