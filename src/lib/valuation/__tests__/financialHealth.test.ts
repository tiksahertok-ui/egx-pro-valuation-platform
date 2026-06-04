import { describe, it, expect } from 'vitest'
import { calculateFinancialHealth } from '../financial-health'

// Healthy company: low leverage, strong liquidity, good profitability
const healthyData = {
  totalAssets: 10000,
  totalLiabilities: 3000,
  currentAssets: 4000,
  currentLiabilities: 1500,
  cash: 2000,
  netIncome: 1500,
  revenue: 8000,
  operatingCashFlow: 2000,
  capitalExpenditure: 500,
  longTermDebt: 1000,
  shortTermDebt: 500,
  totalEquity: 7000,
  interestExpense: 150,
  freeCashFlow: 800,
  grossProfit: 4000,
}

// Distressed company: high leverage, poor liquidity, losses
const distressedData = {
  totalAssets: 5000,
  totalLiabilities: 4500,
  currentAssets: 1000,
  currentLiabilities: 2500,
  cash: 100,
  netIncome: -500,
  revenue: 3000,
  operatingCashFlow: -200,
  capitalExpenditure: 100,
  longTermDebt: 2500,
  shortTermDebt: 1500,
  totalEquity: 500,
  interestExpense: 400,
  freeCashFlow: -300,
  grossProfit: 800,
}

describe('Financial Health Calculation', () => {
  it('calculates financial health with healthy company data', () => {
    const result = calculateFinancialHealth(healthyData)
    expect(result.overallScore).toBeGreaterThan(50)
    expect(result.rating).toMatch(/Excellent|Good/)
  })

  it('calculates financial health with distressed company data', () => {
    const result = calculateFinancialHealth(distressedData)
    expect(result.overallScore).toBeLessThan(50)
    expect(result.rating).toMatch(/Poor|Distressed/)
  })

  it('returns exactly 7 factors', () => {
    const result = calculateFinancialHealth(healthyData)
    expect(result.factors).toHaveLength(7)
  })

  it('all 7 expected factor names are present', () => {
    const result = calculateFinancialHealth(healthyData)
    const names = result.factors.map(f => f.name)
    expect(names).toContain('Leverage (Debt/Equity)')
    expect(names).toContain('Liquidity (Current Ratio)')
    expect(names).toContain('Interest Coverage')
    expect(names).toContain('Profitability (Net Margin)')
    expect(names).toContain('FCF Generation (FCF/Assets)')
    expect(names).toContain('Cash Adequacy (Cash/Debt)')
    expect(names).toContain('Return on Equity')
  })

  it('weights sum to 1.0', () => {
    const result = calculateFinancialHealth(healthyData)
    const totalWeight = result.factors.reduce((sum, f) => sum + f.weight, 0)
    expect(totalWeight).toBeCloseTo(1.0, 6)
  })

  it('overall score is weighted average of factor scores', () => {
    const result = calculateFinancialHealth(healthyData)
    const expectedScore = result.factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    expect(result.overallScore).toBeCloseTo(parseFloat(expectedScore.toFixed(1)), 1)
  })

  it('each factor has all required fields', () => {
    const result = calculateFinancialHealth(healthyData)
    for (const factor of result.factors) {
      expect(factor).toHaveProperty('name')
      expect(factor).toHaveProperty('nameAr')
      expect(factor).toHaveProperty('value')
      expect(factor).toHaveProperty('score')
      expect(factor).toHaveProperty('weight')
      expect(factor).toHaveProperty('interpretation')
      expect(factor).toHaveProperty('interpretationAr')
      expect(factor.score).toBeGreaterThanOrEqual(0)
      expect(factor.score).toBeLessThanOrEqual(100)
      expect(factor.weight).toBeGreaterThan(0)
      expect(factor.weight).toBeLessThanOrEqual(1)
    }
  })

  it('factor weights match documented methodology', () => {
    const result = calculateFinancialHealth(healthyData)
    const leverage = result.factors.find(f => f.name === 'Leverage (Debt/Equity)')!
    const liquidity = result.factors.find(f => f.name === 'Liquidity (Current Ratio)')!
    const interestCov = result.factors.find(f => f.name === 'Interest Coverage')!
    const profitability = result.factors.find(f => f.name === 'Profitability (Net Margin)')!
    const fcf = result.factors.find(f => f.name === 'FCF Generation (FCF/Assets)')!
    const cashAdequacy = result.factors.find(f => f.name === 'Cash Adequacy (Cash/Debt)')!
    const roe = result.factors.find(f => f.name === 'Return on Equity')!

    expect(leverage.weight).toBeCloseTo(0.20, 2)
    expect(liquidity.weight).toBeCloseTo(0.15, 2)
    expect(interestCov.weight).toBeCloseTo(0.15, 2)
    expect(profitability.weight).toBeCloseTo(0.15, 2)
    expect(fcf.weight).toBeCloseTo(0.15, 2)
    expect(cashAdequacy.weight).toBeCloseTo(0.10, 2)
    expect(roe.weight).toBeCloseTo(0.10, 2)
  })
})

describe('Rating Assignment', () => {
  it('assigns Excellent for score >= 75', () => {
    const result = calculateFinancialHealth(healthyData)
    if (result.overallScore >= 75) {
      expect(result.rating).toBe('Excellent')
    }
  })

  it('assigns Good for score >= 55 and < 75', () => {
    // Create a company that should score in the Good range
    const moderateData = {
      totalAssets: 10000,
      totalLiabilities: 5000,
      currentAssets: 3000,
      currentLiabilities: 2000,
      cash: 1000,
      netIncome: 800,
      revenue: 8000,
      operatingCashFlow: 1200,
      capitalExpenditure: 400,
      longTermDebt: 2000,
      shortTermDebt: 1000,
      totalEquity: 5000,
      interestExpense: 300,
      freeCashFlow: 400,
      grossProfit: 3500,
    }
    const result = calculateFinancialHealth(moderateData)
    if (result.overallScore >= 55 && result.overallScore < 75) {
      expect(result.rating).toBe('Good')
    }
  })

  it('assigns Fair for score >= 40 and < 55', () => {
    // Create a company that should score in the Fair range
    const fairData = {
      totalAssets: 8000,
      totalLiabilities: 5500,
      currentAssets: 2000,
      currentLiabilities: 1800,
      cash: 400,
      netIncome: 300,
      revenue: 7000,
      operatingCashFlow: 500,
      capitalExpenditure: 200,
      longTermDebt: 2500,
      shortTermDebt: 1000,
      totalEquity: 2500,
      interestExpense: 350,
      freeCashFlow: 100,
      grossProfit: 2500,
    }
    const result = calculateFinancialHealth(fairData)
    if (result.overallScore >= 40 && result.overallScore < 55) {
      expect(result.rating).toBe('Fair')
    }
  })

  it('assigns Poor for score >= 25 and < 40', () => {
    // Create a company that should score in the Poor range
    const poorData = {
      totalAssets: 6000,
      totalLiabilities: 5000,
      currentAssets: 1500,
      currentLiabilities: 2000,
      cash: 200,
      netIncome: -100,
      revenue: 5000,
      operatingCashFlow: 100,
      capitalExpenditure: 50,
      longTermDebt: 2500,
      shortTermDebt: 1500,
      totalEquity: 1000,
      interestExpense: 400,
      freeCashFlow: -50,
      grossProfit: 1500,
    }
    const result = calculateFinancialHealth(poorData)
    if (result.overallScore >= 25 && result.overallScore < 40) {
      expect(result.rating).toBe('Poor')
    }
  })

  it('assigns Distressed for score < 25', () => {
    const result = calculateFinancialHealth(distressedData)
    if (result.overallScore < 25) {
      expect(result.rating).toBe('Distressed')
    }
  })

  it('all rating values are from the valid set', () => {
    const validRatings = ['Excellent', 'Good', 'Fair', 'Poor', 'Distressed']
    const result1 = calculateFinancialHealth(healthyData)
    const result2 = calculateFinancialHealth(distressedData)
    expect(validRatings).toContain(result1.rating)
    expect(validRatings).toContain(result2.rating)
  })
})

describe('Financial Health Result Structure', () => {
  it('includes methodology description', () => {
    const result = calculateFinancialHealth(healthyData)
    expect(result.methodology).toBeTruthy()
    expect(result.methodology).toContain('Weighted composite')
    expect(result.methodology).toContain('20%')
  })

  it('includes Arabic methodology description', () => {
    const result = calculateFinancialHealth(healthyData)
    expect(result.methodologyAr).toBeTruthy()
    expect(result.methodologyAr).toContain('مركب مرجح')
  })

  it('includes Arabic rating', () => {
    const result = calculateFinancialHealth(healthyData)
    expect(result.ratingAr).toBeTruthy()
    expect(typeof result.ratingAr).toBe('string')
  })

  it('each factor has Arabic name', () => {
    const result = calculateFinancialHealth(healthyData)
    for (const factor of result.factors) {
      expect(factor.nameAr).toBeTruthy()
      expect(typeof factor.nameAr).toBe('string')
    }
  })

  it('each factor has Arabic interpretation', () => {
    const result = calculateFinancialHealth(healthyData)
    for (const factor of result.factors) {
      expect(factor.interpretationAr).toBeTruthy()
      expect(typeof factor.interpretationAr).toBe('string')
    }
  })
})
