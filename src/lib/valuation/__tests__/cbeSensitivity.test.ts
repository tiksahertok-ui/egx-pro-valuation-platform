import { describe, it, expect } from 'vitest'
import { calculateCBESensitivity } from '../cbeSensitivity'
import { EGYPT_MARKET_PARAMS } from '../egyptMarketParams'

describe('CBE Sensitivity Analysis', () => {
  const typicalResult = calculateCBESensitivity(
    1.0,   // beta
    0.15,  // cost of debt pre-tax
    0.7,   // equity weight
    0.3,   // debt weight
    100,   // base fair value
  )

  it('calculates CBE sensitivity with typical inputs', () => {
    expect(typicalResult.baseWACC).toBeGreaterThan(0)
    expect(typicalResult.baseFairValue).toBe(100)
    expect(typicalResult.points).toHaveLength(7)
  })

  it('rate decreases reduce WACC', () => {
    const minus100 = typicalResult.points.find(p => p.rateChangeBps === -100)!
    expect(minus100.waccChangeBps).toBeLessThan(0)
    const minus200 = typicalResult.points.find(p => p.rateChangeBps === -200)!
    expect(minus200.waccChangeBps).toBeLessThan(minus100.waccChangeBps)
  })

  it('rate decreases increase fair value', () => {
    const minus100 = typicalResult.points.find(p => p.rateChangeBps === -100)!
    expect(minus100.fairValueMultiplier).toBeGreaterThan(1.0)
    const minus200 = typicalResult.points.find(p => p.rateChangeBps === -200)!
    expect(minus200.fairValueMultiplier).toBeGreaterThan(minus100.fairValueMultiplier)
  })

  it('rate increases increase WACC', () => {
    const plus100 = typicalResult.points.find(p => p.rateChangeBps === 100)!
    expect(plus100.waccChangeBps).toBeGreaterThan(0)
    const plus200 = typicalResult.points.find(p => p.rateChangeBps === 200)!
    expect(plus200.waccChangeBps).toBeGreaterThan(plus100.waccChangeBps)
  })

  it('rate increases reduce fair value', () => {
    const plus100 = typicalResult.points.find(p => p.rateChangeBps === 100)!
    expect(plus100.fairValueMultiplier).toBeLessThan(1.0)
    const plus200 = typicalResult.points.find(p => p.rateChangeBps === 200)!
    expect(plus200.fairValueMultiplier).toBeLessThan(plus100.fairValueMultiplier)
  })

  it('zero rate change point has WACC change of 0', () => {
    const zeroPoint = typicalResult.points.find(p => p.rateChangeBps === 0)!
    expect(zeroPoint.waccChangeBps).toBe(0)
    expect(zeroPoint.fairValueMultiplier).toBeCloseTo(1.0, 4)
  })

  it('summary object contains all expected keys', () => {
    expect(typicalResult.summary).toHaveProperty('plus100bps')
    expect(typicalResult.summary).toHaveProperty('minus100bps')
    expect(typicalResult.summary).toHaveProperty('plus200bps')
    expect(typicalResult.summary).toHaveProperty('minus200bps')
    expect(typicalResult.summary).toHaveProperty('plus300bps')
    expect(typicalResult.summary).toHaveProperty('minus300bps')

    // Each summary entry should have waccImpact and fairValueImpact
    expect(typicalResult.summary.plus100bps).toHaveProperty('waccImpact')
    expect(typicalResult.summary.plus100bps).toHaveProperty('fairValueImpact')
    expect(typicalResult.summary.minus100bps).toHaveProperty('waccImpact')
    expect(typicalResult.summary.minus100bps).toHaveProperty('fairValueImpact')
  })

  it('summary plus100bps matches point data', () => {
    const plus100Point = typicalResult.points.find(p => p.rateChangeBps === 100)!
    expect(typicalResult.summary.plus100bps.waccImpact).toBe(plus100Point.waccChangeBps)
  })

  it('summary minus100bps has negative waccImpact and positive fairValueImpact', () => {
    expect(typicalResult.summary.minus100bps.waccImpact).toBeLessThan(0)
    expect(typicalResult.summary.minus100bps.fairValueImpact).toBeGreaterThan(0)
  })

  it('summary plus100bps has positive waccImpact and negative fairValueImpact', () => {
    expect(typicalResult.summary.plus100bps.waccImpact).toBeGreaterThan(0)
    expect(typicalResult.summary.plus100bps.fairValueImpact).toBeLessThan(0)
  })

  it('edge case: zero debt, all equity', () => {
    const result = calculateCBESensitivity(
      1.2,   // beta
      0.15,  // cost of debt (irrelevant since debtWeight=0)
      1.0,   // all equity
      0.0,   // no debt
      200,   // base fair value
    )
    // All-equity company: WACC = cost of equity
    expect(result.baseWACC).toBeGreaterThan(0)
    expect(result.points).toHaveLength(7)
    // Rate changes should still affect cost of equity
    const minus200 = result.points.find(p => p.rateChangeBps === -200)!
    expect(minus200.waccChangeBps).toBeLessThan(0)
    expect(minus200.fairValueMultiplier).toBeGreaterThan(1.0)
  })

  it('each sensitivity point has valid structure', () => {
    for (const point of typicalResult.points) {
      expect(point).toHaveProperty('rateChangeBps')
      expect(point).toHaveProperty('newRiskFreeRate')
      expect(point).toHaveProperty('newWACC')
      expect(point).toHaveProperty('waccChangeBps')
      expect(point).toHaveProperty('fairValueMultiplier')
      expect(point.newWACC).toBeGreaterThan(0)
      expect(typeof point.waccChangeBps).toBe('number')
      expect(typeof point.fairValueMultiplier).toBe('number')
    }
  })

  it('new risk-free rate adjusts correctly for rate changes', () => {
    const minus300 = typicalResult.points.find(p => p.rateChangeBps === -300)!
    expect(minus300.newRiskFreeRate).toBeCloseTo(EGYPT_MARKET_PARAMS.riskFreeRate - 0.03, 4)

    const plus300 = typicalResult.points.find(p => p.rateChangeBps === 300)!
    expect(plus300.newRiskFreeRate).toBeCloseTo(EGYPT_MARKET_PARAMS.riskFreeRate + 0.03, 4)
  })
})
