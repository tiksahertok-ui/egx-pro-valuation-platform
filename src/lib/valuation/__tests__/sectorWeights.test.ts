import { describe, it, expect } from 'vitest'
import { getWeightsForSector, modelWeightsToArray, SECTOR_WEIGHTS, type EGXSector } from '../sectorWeights'

describe('getWeightsForSector', () => {
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

  it('returns weights for Telecommunications sector', () => {
    const weights = getWeightsForSector('Telecommunications')
    expect(weights.dcfFCFF).toBe(0.35) // FCF primary for telecom
    expect(weights.evEbitda).toBe(0.20) // EV/EBITDA standard telecom
  })

  it('returns weights for Financial Services sector', () => {
    const weights = getWeightsForSector('Financial Services')
    expect(weights.dcfFCFE).toBe(0.25)
    expect(weights.residualIncome).toBe(0.25)
    expect(weights.evEbitda).toBe(0) // Not meaningful for financials
  })

  it('returns weights for Food sector (mapped to Consumer)', () => {
    const weights = getWeightsForSector('Food')
    expect(weights).toEqual(SECTOR_WEIGHTS.Consumer)
  })

  it('returns weights for Construction sector (mapped to Industrials)', () => {
    const weights = getWeightsForSector('Construction')
    expect(weights).toEqual(SECTOR_WEIGHTS.Industrials)
  })

  it('returns weights for Energy sector', () => {
    const weights = getWeightsForSector('Energy')
    expect(weights).toEqual(SECTOR_WEIGHTS.Energy)
  })

  it('returns weights for Chemicals sector (mapped to Industrials)', () => {
    const weights = getWeightsForSector('Chemicals')
    expect(weights).toEqual(SECTOR_WEIGHTS.Industrials)
  })

  it('returns weights for Tobacco sector (mapped to Consumer)', () => {
    const weights = getWeightsForSector('Tobacco')
    expect(weights).toEqual(SECTOR_WEIGHTS.Consumer)
  })

  it('returns weights for Technology sector (mapped to Consumer)', () => {
    const weights = getWeightsForSector('Technology')
    expect(weights).toEqual(SECTOR_WEIGHTS.Consumer)
  })

  it('returns weights for Tourism sector (mapped to Consumer)', () => {
    const weights = getWeightsForSector('Tourism')
    expect(weights).toEqual(SECTOR_WEIGHTS.Consumer)
  })

  it('returns Default weights for unmapped sector', () => {
    const weights = getWeightsForSector('UnknownSector')
    expect(weights.dcfFCFF).toBe(0.20)
    expect(weights).toEqual(SECTOR_WEIGHTS.Default)
  })

  it('returns Default weights for empty string sector', () => {
    const weights = getWeightsForSector('')
    expect(weights).toEqual(SECTOR_WEIGHTS.Default)
  })
})

describe('modelWeightsToArray', () => {
  it('returns 8 elements that sum to 1.0 for each sector', () => {
    const sectors: EGXSector[] = [
      'Banking', 'RealEstate', 'Telecom', 'FinancialServices',
      'Consumer', 'Industrials', 'Energy', 'Default',
    ]
    for (const sector of sectors) {
      const weights = SECTOR_WEIGHTS[sector]
      const arr = modelWeightsToArray(weights)
      expect(arr).toHaveLength(8)
      const sum = arr.reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 6)
    }
  })

  it('returns correct order: dcfFCFF, dcfFCFE, ddm, residualIncome, peRelative, pbRelative, evEbitda, assetBased', () => {
    const weights = getWeightsForSector('Banking')
    const arr = modelWeightsToArray(weights)
    expect(arr[0]).toBe(weights.dcfFCFF)
    expect(arr[1]).toBe(weights.dcfFCFE)
    expect(arr[2]).toBe(weights.ddm)
    expect(arr[3]).toBe(weights.residualIncome)
    expect(arr[4]).toBe(weights.peRelative)
    expect(arr[5]).toBe(weights.pbRelative)
    expect(arr[6]).toBe(weights.evEbitda)
    expect(arr[7]).toBe(weights.assetBased)
  })

  it('all elements are non-negative', () => {
    for (const weights of Object.values(SECTOR_WEIGHTS)) {
      const arr = modelWeightsToArray(weights)
      for (const val of arr) {
        expect(val).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('SECTOR_WEIGHTS integrity', () => {
  it('all sector weights sum to approximately 1.0', () => {
    for (const [sector, weights] of Object.entries(SECTOR_WEIGHTS)) {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 6)
    }
  })

  it('has exactly 8 sectors defined', () => {
    expect(Object.keys(SECTOR_WEIGHTS)).toHaveLength(8)
  })

  it('Banking has zero FCFF and EV/EBITDA', () => {
    expect(SECTOR_WEIGHTS.Banking.dcfFCFF).toBe(0)
    expect(SECTOR_WEIGHTS.Banking.evEbitda).toBe(0)
  })

  it('RealEstate has highest asset-based weight', () => {
    expect(SECTOR_WEIGHTS.RealEstate.assetBased).toBe(0.30)
    // Verify it's the highest single weight in RealEstate
    const weights = SECTOR_WEIGHTS.RealEstate
    const maxWeight = Math.max(...Object.values(weights))
    expect(maxWeight).toBe(0.30)
  })

  it('Telecom has highest FCFF weight', () => {
    expect(SECTOR_WEIGHTS.Telecom.dcfFCFF).toBe(0.35)
  })
})
