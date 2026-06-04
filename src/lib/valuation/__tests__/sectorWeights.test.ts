import { describe, it, expect } from 'vitest'
import { getWeightsForSector, modelWeightsToArray, SECTOR_WEIGHTS } from '../sectorWeights'

describe('Sector Weights', () => {
  it('returns weights for Banking sector', () => {
    const weights = getWeightsForSector('Banking')
    expect(weights.dcfFCFF).toBe(0) // FCFF not for banks
    expect(weights.evEbitda).toBe(0) // EV/EBITDA not for banks
    expect(weights.dcfFCFE).toBeGreaterThan(0)
    expect(weights.ddm).toBeGreaterThan(0)
    expect(weights.pbRelative).toBeGreaterThan(0) // P/B critical for banks
  })

  it('returns weights for Real Estate sector', () => {
    const weights = getWeightsForSector('Real Estate')
    expect(weights.assetBased).toBe(0.30) // NAV primary for RE
  })

  it('returns Default weights for unknown sector', () => {
    const weights = getWeightsForSector('UnknownSector')
    expect(weights.dcfFCFF).toBe(0.20)
  })

  it('all sector weights sum to 1.0', () => {
    for (const [sector, weights] of Object.entries(SECTOR_WEIGHTS)) {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 6, `Sector ${sector} weights don't sum to 1.0`)
    }
  })

  it('modelWeightsToArray returns correct order', () => {
    const weights = getWeightsForSector('Banking')
    const arr = modelWeightsToArray(weights)
    expect(arr).toHaveLength(8)
    expect(arr[0]).toBe(weights.dcfFCFF)
    expect(arr[7]).toBe(weights.assetBased)
  })

  it('maps EGX sector names correctly', () => {
    expect(getWeightsForSector('Banking').dcfFCFF).toBe(0)
    expect(getWeightsForSector('Real Estate').assetBased).toBe(0.30)
    expect(getWeightsForSector('Telecommunications').dcfFCFF).toBe(0.35)
    expect(getWeightsForSector('Financial Services').dcfFCFE).toBe(0.25)
  })
})
