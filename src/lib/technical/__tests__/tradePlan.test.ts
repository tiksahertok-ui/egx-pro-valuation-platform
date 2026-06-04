import { describe, it, expect } from 'vitest'
import { generateTradePlan } from '../tradePlan'
import { calculateFloorPivots } from '../supportResistance'

describe('Trade Plan Generator', () => {
  const pivots = calculateFloorPivots(100, 90, 95)

  it('generates short-term trade plan', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'short')
    expect(plan.horizon).toBe('short')
    expect(plan.horizonLabel).toContain('1–5 days')
    expect(plan.entryZoneLow).toBeGreaterThan(0)
    expect(plan.stopLoss).toBeLessThan(plan.entryZoneLow)
    expect(plan.primaryTarget).toBeGreaterThan(plan.entryZoneHigh)
  })

  it('generates medium-term trade plan', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'medium')
    expect(plan.horizon).toBe('medium')
    expect(plan.horizonLabel).toContain('1–3 months')
    expect(plan.secondaryTarget).toBe(pivots.r2) // R2 for medium
  })

  it('generates long-term trade plan with fair value target', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 110, 'long')
    expect(plan.horizon).toBe('long')
    expect(plan.horizonLabel).toContain('6+ months')
    expect(plan.secondaryTarget).toBe(110) // fair value for long-term
  })

  it('entry zone is between S1 and pivot/current price', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'short')
    expect(plan.entryZoneLow).toBe(pivots.s1)
    expect(plan.entryZoneHigh).toBeLessThanOrEqual(pivots.pivot)
  })

  it('primary target is R1', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'short')
    expect(plan.primaryTarget).toBe(pivots.r1)
  })

  it('stop loss is below entry zone by ATR-based amount', () => {
    const atr = 2.5
    const plan = generateTradePlan(95, atr, pivots, 100, 'short')
    // short-term ATR multiplier is 1.0
    expect(plan.stopLoss).toBeCloseTo(pivots.s1 - 1.0 * atr, 4)
  })

  it('long-term has wider stop loss than short-term', () => {
    const shortPlan = generateTradePlan(95, 2.5, pivots, 100, 'short')
    const longPlan = generateTradePlan(95, 2.5, pivots, 100, 'long')
    // Long-term ATR multiplier (2.0) > short-term (1.0)
    const shortDistance = shortPlan.entryZoneLow - shortPlan.stopLoss
    const longDistance = longPlan.entryZoneLow - longPlan.stopLoss
    expect(longDistance).toBeGreaterThan(shortDistance)
  })

  it('medium-term has intermediate stop loss', () => {
    const shortPlan = generateTradePlan(95, 2.5, pivots, 100, 'short')
    const mediumPlan = generateTradePlan(95, 2.5, pivots, 100, 'medium')
    const longPlan = generateTradePlan(95, 2.5, pivots, 100, 'long')
    const shortDistance = shortPlan.entryZoneLow - shortPlan.stopLoss
    const mediumDistance = mediumPlan.entryZoneLow - mediumPlan.stopLoss
    const longDistance = longPlan.entryZoneLow - longPlan.stopLoss
    expect(mediumDistance).toBeGreaterThan(shortDistance)
    expect(mediumDistance).toBeLessThan(longDistance)
  })

  it('risk/reward ratio is positive and reasonable', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'medium')
    expect(plan.riskRewardRatio).toBeGreaterThan(0)
    expect(plan.riskRewardRatio).toBeLessThan(10) // sanity check
  })

  it('risk/reward ratio calculation is correct', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'short')
    const risk = plan.entryZoneHigh - plan.stopLoss
    const reward = plan.primaryTarget - plan.entryZoneHigh
    const expectedRR = risk > 0 ? reward / risk : 0
    expect(plan.riskRewardRatio).toBeCloseTo(expectedRR, 4)
  })

  it('includes basis of entry and target descriptions', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'short')
    expect(plan.basisOfEntry).toBeTruthy()
    expect(plan.basisOfTarget).toBeTruthy()
    expect(plan.basisOfEntry).toContain('S1')
    expect(plan.basisOfTarget).toContain('R1')
  })

  it('long-term basis of target mentions DCF fair value', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'long')
    expect(plan.basisOfTarget).toContain('DCF fair value')
  })

  it('short/medium-term basis of target mentions R2', () => {
    const shortPlan = generateTradePlan(95, 2.5, pivots, 100, 'short')
    const mediumPlan = generateTradePlan(95, 2.5, pivots, 100, 'medium')
    expect(shortPlan.basisOfTarget).toContain('R2')
    expect(mediumPlan.basisOfTarget).toContain('R2')
  })
})
