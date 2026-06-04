import { describe, it, expect } from 'vitest'
import { calculateBetaVsEGX30, computeIndexAlpha, getIndexRelativePerformance, CURRENT_EGX30 } from '../egx30'

describe('calculateBetaVsEGX30', () => {
  it('calculates beta with known perfectly correlated inputs', () => {
    const stockReturns = [0.01, 0.02, -0.01, 0.03, 0.005]
    const egx30Returns = [0.01, 0.02, -0.01, 0.03, 0.005]
    const beta = calculateBetaVsEGX30(stockReturns, egx30Returns)
    // Perfectly correlated = beta of 1.0
    expect(beta).toBeCloseTo(1.0, 4)
  })

  it('calculates beta with 2x amplified returns', () => {
    const egx30Returns = [0.01, -0.02, 0.015, 0.005, -0.01]
    const stockReturns = egx30Returns.map(r => 2 * r)
    const beta = calculateBetaVsEGX30(stockReturns, egx30Returns)
    // 2x the market moves = beta of 2.0
    expect(beta).toBeCloseTo(2.0, 4)
  })

  it('calculates beta with uncorrelated inputs', () => {
    // Stock returns oscillate while index trends — should yield near-zero covariance
    const stockReturns = [0.01, -0.01, 0.01, -0.01, 0.01]
    const egx30Returns = [0.02, 0.04, 0.06, 0.08, 0.10]
    const beta = calculateBetaVsEGX30(stockReturns, egx30Returns)
    // Covariance ≈ 0, so beta should be near 0
    expect(beta).toBeCloseTo(0, 1)
  })

  it('returns 1.0 for mismatched array lengths', () => {
    const stockReturns = [0.01, 0.02]
    const egx30Returns = [0.01]
    const beta = calculateBetaVsEGX30(stockReturns, egx30Returns)
    expect(beta).toBe(1.0)
  })

  it('returns 1.0 for arrays with less than 2 elements', () => {
    expect(calculateBetaVsEGX30([0.01], [0.01])).toBe(1.0)
    expect(calculateBetaVsEGX30([], [])).toBe(1.0)
  })

  it('returns 1.0 when index variance is zero', () => {
    const stockReturns = [0.01, 0.02, 0.03]
    const egx30Returns = [0.02, 0.02, 0.02]
    const beta = calculateBetaVsEGX30(stockReturns, egx30Returns)
    expect(beta).toBe(1.0)
  })

  it('calculates beta for defensive stock (beta < 1)', () => {
    // Stock moves half as much as the index
    const egx30Returns = [0.04, -0.03, 0.02, -0.01, 0.03]
    const stockReturns = egx30Returns.map(r => 0.5 * r)
    const beta = calculateBetaVsEGX30(stockReturns, egx30Returns)
    expect(beta).toBeCloseTo(0.5, 4)
  })
})

describe('computeIndexAlpha', () => {
  it('calculates positive alpha when stock outperforms', () => {
    // Stock return 30%, index 20%, risk-free 5%, beta 1.0
    // Expected = 5% + 1.0 * (20% - 5%) = 20%
    // Alpha = 30% - 20% = 10%
    const alpha = computeIndexAlpha(0.30, 0.20, 0.05, 1.0)
    expect(alpha).toBeCloseTo(0.10, 4)
  })

  it('calculates negative alpha when stock underperforms', () => {
    // Stock return 5%, index 20%, risk-free 5%, beta 1.0
    // Expected = 5% + 1.0 * (20% - 5%) = 20%
    // Alpha = 5% - 20% = -15%
    const alpha = computeIndexAlpha(0.05, 0.20, 0.05, 1.0)
    expect(alpha).toBeCloseTo(-0.15, 4)
  })

  it('calculates zero alpha when stock matches expected return', () => {
    // Stock return 20%, index 20%, risk-free 5%, beta 1.0
    // Expected = 5% + 1.0 * (20% - 5%) = 20%
    // Alpha = 20% - 20% = 0%
    const alpha = computeIndexAlpha(0.20, 0.20, 0.05, 1.0)
    expect(alpha).toBeCloseTo(0, 4)
  })

  it('adjusts alpha for high beta stock', () => {
    // Stock return 30%, index 20%, risk-free 5%, beta 2.0
    // Expected = 5% + 2.0 * (20% - 5%) = 35%
    // Alpha = 30% - 35% = -5%
    const alpha = computeIndexAlpha(0.30, 0.20, 0.05, 2.0)
    expect(alpha).toBeCloseTo(-0.05, 4)
  })

  it('adjusts alpha for low beta stock', () => {
    // Stock return 15%, index 20%, risk-free 5%, beta 0.5
    // Expected = 5% + 0.5 * (20% - 5%) = 12.5%
    // Alpha = 15% - 12.5% = 2.5%
    const alpha = computeIndexAlpha(0.15, 0.20, 0.05, 0.5)
    expect(alpha).toBeCloseTo(0.025, 4)
  })
})

describe('getIndexRelativePerformance', () => {
  it('returns all expected fields', () => {
    const result = getIndexRelativePerformance(0.30, 1.2)
    expect(result).toHaveProperty('stockReturn')
    expect(result).toHaveProperty('indexReturn')
    expect(result).toHaveProperty('excessReturn')
    expect(result).toHaveProperty('alpha')
    expect(result).toHaveProperty('beta')
    expect(result).toHaveProperty('treynorRatio')
  })

  it('uses current EGX30 YTD change as index return', () => {
    const result = getIndexRelativePerformance(0.30, 1.0)
    expect(result.indexReturn).toBeCloseTo(CURRENT_EGX30.ytdChange / 100, 4)
  })

  it('calculates excess return correctly', () => {
    const stockReturn = 0.30
    const result = getIndexRelativePerformance(stockReturn, 1.0)
    expect(result.excessReturn).toBeCloseTo(stockReturn - CURRENT_EGX30.ytdChange / 100, 4)
  })

  it('calculates Treynor ratio correctly', () => {
    const stockReturn = 0.30
    const beta = 1.2
    const riskFreeRate = 0.19
    const result = getIndexRelativePerformance(stockReturn, beta, riskFreeRate)
    expect(result.treynorRatio).toBeCloseTo((stockReturn - riskFreeRate) / beta, 4)
  })

  it('handles zero beta for Treynor ratio', () => {
    const result = getIndexRelativePerformance(0.30, 0)
    expect(result.treynorRatio).toBe(0)
  })

  it('alpha is consistent with computeIndexAlpha', () => {
    const stockReturn = 0.25
    const beta = 1.1
    const riskFreeRate = 0.19
    const result = getIndexRelativePerformance(stockReturn, beta, riskFreeRate)
    const expectedAlpha = computeIndexAlpha(
      stockReturn,
      CURRENT_EGX30.ytdChange / 100,
      riskFreeRate,
      beta,
    )
    expect(result.alpha).toBeCloseTo(expectedAlpha, 6)
  })
})
