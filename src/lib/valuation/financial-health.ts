/**
 * Financial Health Score
 * Transparent scoring methodology for company financial health
 * All factors and weights are explicitly disclosed
 */

export interface HealthFactor {
  name: string
  nameAr: string
  value: number          // raw metric value
  score: number          // 0-100 normalized score
  weight: number         // weight in composite score
  interpretation: string // e.g. "Strong", "Moderate", "Weak"
  interpretationAr: string
}

export interface FinancialHealthResult {
  overallScore: number    // 0-100
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Distressed'
  ratingAr: string
  factors: HealthFactor[]
  methodology: string
  methodologyAr: string
}

/**
 * Calculate comprehensive financial health score
 * All weights sum to 1.0 and are explicitly documented
 */
export function calculateFinancialHealth(data: {
  totalAssets: number
  totalLiabilities: number
  currentAssets: number
  currentLiabilities: number
  cash: number
  netIncome: number
  revenue: number
  operatingCashFlow: number
  capitalExpenditure: number
  longTermDebt: number
  shortTermDebt: number
  totalEquity: number
  interestExpense: number
  freeCashFlow: number
  grossProfit: number
}): FinancialHealthResult {
  const factors: HealthFactor[] = []

  // 1. Leverage Ratio (Debt/Equity) - Weight: 20%
  const debtToEquity = data.totalEquity > 0
    ? (data.longTermDebt + data.shortTermDebt) / data.totalEquity
    : 999
  factors.push({
    name: 'Leverage (Debt/Equity)',
    nameAr: 'الرافعة المالية (الدين/حقوق الملكية)',
    value: debtToEquity,
    score: scoreLeverage(debtToEquity),
    weight: 0.20,
    interpretation: interpretLeverage(debtToEquity),
    interpretationAr: interpretLeverageAr(debtToEquity),
  })

  // 2. Current Ratio - Weight: 15%
  const currentRatio = data.currentLiabilities > 0
    ? data.currentAssets / data.currentLiabilities
    : 999
  factors.push({
    name: 'Liquidity (Current Ratio)',
    nameAr: 'السيولة (النسبة المتداولة)',
    value: currentRatio,
    score: scoreCurrentRatio(currentRatio),
    weight: 0.15,
    interpretation: interpretCurrentRatio(currentRatio),
    interpretationAr: interpretCurrentRatioAr(currentRatio),
  })

  // 3. Interest Coverage - Weight: 15%
  const interestCoverage = data.interestExpense > 0
    ? (data.netIncome + data.interestExpense) / data.interestExpense
    : 999
  factors.push({
    name: 'Interest Coverage',
    nameAr: 'تغطية الفوائد',
    value: interestCoverage,
    score: scoreInterestCoverage(interestCoverage),
    weight: 0.15,
    interpretation: interpretInterestCoverage(interestCoverage),
    interpretationAr: interpretInterestCoverageAr(interestCoverage),
  })

  // 4. Profitability (Net Margin) - Weight: 15%
  const netMargin = data.revenue > 0 ? data.netIncome / data.revenue : 0
  factors.push({
    name: 'Profitability (Net Margin)',
    nameAr: 'الربحية (هامش صافي الربح)',
    value: netMargin,
    score: scoreNetMargin(netMargin),
    weight: 0.15,
    interpretation: interpretNetMargin(netMargin),
    interpretationAr: interpretNetMarginAr(netMargin),
  })

  // 5. FCF Generation - Weight: 15%
  const fcfYield = data.totalAssets > 0 ? data.freeCashFlow / data.totalAssets : 0
  factors.push({
    name: 'FCF Generation (FCF/Assets)',
    nameAr: 'توليد التدفق النقدي الحر',
    value: fcfYield,
    score: scoreFCFYield(fcfYield),
    weight: 0.15,
    interpretation: interpretFCFYield(fcfYield),
    interpretationAr: interpretFCFYieldAr(fcfYield),
  })

  // 6. Cash Adequacy - Weight: 10%
  const cashToDebt = (data.longTermDebt + data.shortTermDebt) > 0
    ? data.cash / (data.longTermDebt + data.shortTermDebt)
    : 1
  factors.push({
    name: 'Cash Adequacy (Cash/Debt)',
    nameAr: 'كفاية النقد (النقد/الدين)',
    value: cashToDebt,
    score: scoreCashToDebt(cashToDebt),
    weight: 0.10,
    interpretation: interpretCashToDebt(cashToDebt),
    interpretationAr: interpretCashToDebtAr(cashToDebt),
  })

  // 7. ROE - Weight: 10%
  const roe = data.totalEquity > 0 ? data.netIncome / data.totalEquity : 0
  factors.push({
    name: 'Return on Equity',
    nameAr: 'العائد على حقوق الملكية',
    value: roe,
    score: scoreROE(roe),
    weight: 0.10,
    interpretation: interpretROE(roe),
    interpretationAr: interpretROEAr(roe),
  })

  // Calculate weighted composite score
  const overallScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  const rating = getRating(overallScore)
  const ratingAr = getRatingAr(overallScore)

  return {
    overallScore: parseFloat(overallScore.toFixed(1)),
    rating,
    ratingAr,
    factors,
    methodology: 'Weighted composite: Leverage (20%), Liquidity (15%), Interest Coverage (15%), Profitability (15%), FCF Generation (15%), Cash Adequacy (10%), ROE (10%). Each factor scored 0-100 with non-linear scaling. Adjusted for Egyptian market conditions (high inflation, currency risk).',
    methodologyAr: 'مركب مرجح: الرافعة المالية (20%)، السيولة (15%)، تغطية الفوائد (15%)، الربحية (15%)، توليد التدفق النقدي الحر (15%)، كفاية النقد (10%)، العائد على حقوق الملكية (10%). كل عامل يسجل 0-100 مع تحجيم غير خطي. معدّل لظروف السوق المصري (تضخم مرتفع، مخاطر العملة).',
  }
}

// Scoring functions with non-linear scaling
function scoreLeverage(de: number): number {
  if (de < 0.3) return 95
  if (de < 0.5) return 85
  if (de < 1.0) return 70
  if (de < 2.0) return 50
  if (de < 4.0) return 30
  if (de < 8.0) return 15
  return 5
}
function scoreCurrentRatio(cr: number): number {
  if (cr > 2.5) return 90
  if (cr > 2.0) return 80
  if (cr > 1.5) return 65
  if (cr > 1.0) return 45
  if (cr > 0.7) return 25
  return 10
}
function scoreInterestCoverage(ic: number): number {
  if (ic > 10) return 95
  if (ic > 6) return 85
  if (ic > 4) return 70
  if (ic > 2.5) return 55
  if (ic > 1.5) return 35
  if (ic > 1.0) return 20
  return 5
}
function scoreNetMargin(nm: number): number {
  if (nm > 0.20) return 90
  if (nm > 0.15) return 80
  if (nm > 0.10) return 65
  if (nm > 0.05) return 45
  if (nm > 0) return 25
  return 5
}
function scoreFCFYield(fcf: number): number {
  if (fcf > 0.10) return 90
  if (fcf > 0.06) return 75
  if (fcf > 0.03) return 60
  if (fcf > 0) return 40
  if (fcf > -0.03) return 20
  return 5
}
function scoreCashToDebt(c2d: number): number {
  if (c2d > 0.8) return 90
  if (c2d > 0.5) return 75
  if (c2d > 0.3) return 55
  if (c2d > 0.15) return 35
  if (c2d > 0) return 20
  return 5
}
function scoreROE(roe: number): number {
  if (roe > 0.25) return 90
  if (roe > 0.20) return 80
  if (roe > 0.15) return 65
  if (roe > 0.10) return 50
  if (roe > 0.05) return 30
  if (roe > 0) return 15
  return 5
}

// Interpretation helpers
function interpretLeverage(de: number) { return de < 0.5 ? 'Conservative' : de < 1 ? 'Moderate' : de < 2 ? 'Elevated' : 'High Risk' }
function interpretLeverageAr(de: number) { return de < 0.5 ? 'تحفظي' : de < 1 ? 'معتدل' : de < 2 ? 'مرتفع' : 'عالي المخاطر' }
function interpretCurrentRatio(cr: number) { return cr > 2 ? 'Strong' : cr > 1.2 ? 'Adequate' : cr > 1 ? 'Marginal' : 'Weak' }
function interpretCurrentRatioAr(cr: number) { return cr > 2 ? 'قوي' : cr > 1.2 ? 'كافي' : cr > 1 ? 'هامشي' : 'ضعيف' }
function interpretInterestCoverage(ic: number) { return ic > 5 ? 'Comfortable' : ic > 3 ? 'Adequate' : ic > 1.5 ? 'Tight' : 'Distressed' }
function interpretInterestCoverageAr(ic: number) { return ic > 5 ? 'مريح' : ic > 3 ? 'كافي' : ic > 1.5 ? 'ضيق' : 'محرج' }
function interpretNetMargin(nm: number) { return nm > 0.15 ? 'Strong' : nm > 0.08 ? 'Healthy' : nm > 0 ? 'Thin' : 'Loss-making' }
function interpretNetMarginAr(nm: number) { return nm > 0.15 ? 'قوي' : nm > 0.08 ? 'صحي' : nm > 0 ? 'ضعيف' : 'خاسر' }
function interpretFCFYield(fcf: number) { return fcf > 0.05 ? 'Strong' : fcf > 0 ? 'Positive' : fcf > -0.03 ? 'Mildly Negative' : 'Cash Burn' }
function interpretFCFYieldAr(fcf: number) { return fcf > 0.05 ? 'قوي' : fcf > 0 ? 'إيجابي' : fcf > -0.03 ? 'سالب بشكل طفيف' : 'حرق نقدي' }
function interpretCashToDebt(c2d: number) { return c2d > 0.5 ? 'Strong' : c2d > 0.2 ? 'Adequate' : 'Low' }
function interpretCashToDebtAr(c2d: number) { return c2d > 0.5 ? 'قوي' : c2d > 0.2 ? 'كافي' : 'منخفض' }
function interpretROE(roe: number) { return roe > 0.20 ? 'Excellent' : roe > 0.12 ? 'Good' : roe > 0.05 ? 'Fair' : 'Poor' }
function interpretROEAr(roe: number) { return roe > 0.20 ? 'ممتاز' : roe > 0.12 ? 'جيد' : roe > 0.05 ? 'مقبول' : 'ضعيف' }

function getRating(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Distressed' {
  if (score >= 75) return 'Excellent'
  if (score >= 55) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 25) return 'Poor'
  return 'Distressed'
}
function getRatingAr(score: number): string {
  if (score >= 75) return 'ممتاز'
  if (score >= 55) return 'جيد'
  if (score >= 40) return 'مقبول'
  if (score >= 25) return 'ضعيف'
  return 'حرج'
}
