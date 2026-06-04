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

  it('generates long-term trade plan with fair value target', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 110, 'long')
    expect(plan.horizon).toBe('long')
    expect(plan.secondaryTarget).toBe(110) // fair value
  })

  it('generates medium-term trade plan', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'medium')
    expect(plan.horizon).toBe('medium')
    expect(plan.secondaryTarget).toBe(pivots.r2) // R2 for medium
  })

  it('has valid risk:reward ratio', () => {
    const plan = generateTradePlan(95, 2.5, pivots, 100, 'medium')
    expect(plan.riskRewardRatio).toBeGreaterThan(0)
    expect(plan.basisOfEntry).toBeTruthy()
    expect(plan.basisOfTarget).toBeTruthy()
  })
})
