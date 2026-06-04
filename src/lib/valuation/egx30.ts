/**
 * EGX30 Index Integration
 * Provides index-relative analysis for EGX stocks
 */

export interface EGX30Data {
  indexLevel: number
  date: string
  dailyChange: number
  weeklyChange: number
  monthlyChange: number
  ytdChange: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
}

// Current EGX30 data (June 2026)
export const CURRENT_EGX30: EGX30Data = {
  indexLevel: 52652,
  date: '2026-06-04',
  dailyChange: 0.8,
  weeklyChange: 2.1,
  monthlyChange: 5.3,
  ytdChange: 25.0,
  fiftyTwoWeekHigh: 54977,
  fiftyTwoWeekLow: 29741,
}

/**
 * Calculate beta relative to EGX30
 * Beta = Covariance(stock returns, EGX30 returns) / Variance(EGX30 returns)
 */
export function calculateBetaVsEGX30(
  stockReturns: number[],
  egx30Returns: number[]
): number {
  if (stockReturns.length !== egx30Returns.length || stockReturns.length < 2) return 1.0

  const n = stockReturns.length
  const meanStock = stockReturns.reduce((a, b) => a + b, 0) / n
  const meanIndex = egx30Returns.reduce((a, b) => a + b, 0) / n

  let covariance = 0
  let indexVariance = 0

  for (let i = 0; i < n; i++) {
    const stockDiff = stockReturns[i] - meanStock
    const indexDiff = egx30Returns[i] - meanIndex
    covariance += stockDiff * indexDiff
    indexVariance += indexDiff * indexDiff
  }

  if (indexVariance === 0) return 1.0
  return covariance / indexVariance
}

/**
 * Compute index-relative return (alpha)
 * Alpha = Stock Return - (Risk Free Rate + Beta * (Market Return - Risk Free Rate))
 */
export function computeIndexAlpha(
  stockReturn: number,
  indexReturn: number,
  riskFreeRate: number,
  beta: number
): number {
  const expectedReturn = riskFreeRate + beta * (indexReturn - riskFreeRate)
  return stockReturn - expectedReturn
}

/**
 * Get index-relative performance metrics
 */
export function getIndexRelativePerformance(
  stockReturn: number,
  stockBeta: number,
  riskFreeRate: number = 0.19
): {
  stockReturn: number
  indexReturn: number
  excessReturn: number
  alpha: number
  beta: number
  treynorRatio: number
} {
  const indexReturn = CURRENT_EGX30.ytdChange / 100
  const excessReturn = stockReturn - indexReturn
  const alpha = computeIndexAlpha(stockReturn, indexReturn, riskFreeRate, stockBeta)
  const treynorRatio = stockBeta !== 0 ? (stockReturn - riskFreeRate) / stockBeta : 0

  return {
    stockReturn,
    indexReturn,
    excessReturn,
    alpha,
    beta: stockBeta,
    treynorRatio,
  }
}
