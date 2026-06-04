// DCF FCFF (Free Cash Flow to Firm) Valuation Model
// Projects FCFF for 10 years, calculates terminal value using Gordon Growth Model,
// discounts at WACC, and returns fair value per share with bear/base/bull scenarios

export interface FinancialDataInput {
  revenue: number;
  operatingIncome: number;
  ebitda: number;
  depreciation: number;
  taxRate: number;
  capex: number;
  changeInNWC: number;
  operatingCashFlow: number;
  totalAssets: number;
  totalLiabilities: number;
  cash: number;
  sharesOutstanding: number;
  longTermDebt: number;
  shortTermDebt: number;
  totalEquity: number;
  netIncome: number;
  currentAssets: number;
  currentLiabilities: number;
  interestExpense: number;
  costOfRevenue: number;
  freeCashFlow: number;
  year: number;
  dividendsPerShare: number;
  netBorrowing: number;
  grossProfit: number;
  operatingExpenses: number;
  eps: number;
}

export interface ValuationOutput {
  model: string;
  fairValue: number;
  bearCase: number;
  baseCase: number;
  bullCase: number;
  upside: number;
  confidence: number;
  assumptions: string;
}

/**
 * Calculate FCFF (Free Cash Flow to Firm)
 * FCFF = EBIT * (1 - Tax Rate) + Depreciation - CapEx - Change in NWC
 */
function calculateFCFF(financials: FinancialDataInput): number {
  const nopat = financials.operatingIncome * (1 - financials.taxRate);
  return nopat + financials.depreciation - financials.capex - financials.changeInNWC;
}

/**
 * Calculate WACC (Weighted Average Cost of Capital)
 */
function calculateWACC(financials: FinancialDataInput, riskFreeRate: number = 0.27, marketRiskPremium: number = 0.08, beta: number = 1.0): number {
  const totalDebt = financials.longTermDebt + financials.shortTermDebt;
  const totalCapital = financials.totalEquity + totalDebt;
  
  if (totalCapital === 0) return riskFreeRate + marketRiskPremium;

  // Cost of Equity using CAPM
  const costOfEquity = riskFreeRate + beta * marketRiskPremium;

  // Cost of Debt
  const costOfDebt = totalDebt > 0 ? financials.interestExpense / totalDebt : 0.10;
  const afterTaxCostOfDebt = costOfDebt * (1 - financials.taxRate);

  const weightEquity = financials.totalEquity / totalCapital;
  const weightDebt = totalDebt / totalCapital;

  return weightEquity * costOfEquity + weightDebt * afterTaxCostOfDebt;
}

export interface DCFFCFFParams {
  financials: FinancialDataInput;
  latestFinancials: FinancialDataInput;
  currentPrice: number;
  beta?: number;
  projectionYears?: number;
  baseGrowthRate?: number;
  terminalGrowthRate?: number;
}

export function dcfFCFF(params: DCFFCFFParams): ValuationOutput {
  const {
    financials,
    latestFinancials,
    currentPrice,
    beta = 1.0,
    projectionYears = 10,
    baseGrowthRate,
    terminalGrowthRate = 0.03,
  } = params;

  // Calculate current FCFF
  const currentFCFF = calculateFCFF(latestFinancials);

  // Estimate growth rate from historical revenue if not provided
  const fallbackGrowth = financials.revenue > 0
    ? (latestFinancials.revenue / financials.revenue - 1) / 4
    : 0.05;
  const estimatedGrowthRate = baseGrowthRate ?? 
    Math.max(0.02, Math.min(0.25, isNaN(fallbackGrowth) ? 0.05 : fallbackGrowth));

  // Calculate WACC for base case
  const baseWACC = calculateWACC(latestFinancials, 0.27, 0.08, beta);

  // Bear case: lower growth, higher WACC
  const bearGrowthRate = estimatedGrowthRate * 0.6;
  const bearWACC = baseWACC * 1.25;
  const bearTerminalGrowth = terminalGrowthRate * 0.5;

  // Bull case: higher growth, lower WACC
  const bullGrowthRate = Math.min(estimatedGrowthRate * 1.4, 0.30);
  const bullWACC = baseWACC * 0.85;
  const bullTerminalGrowth = terminalGrowthRate * 1.5;

  function computeDCF(growthRate: number, wacc: number, tgr: number): number {
    let enterpriseValue = 0;
    let projectedFCFF = currentFCFF;

    for (let year = 1; year <= projectionYears; year++) {
      // Growth rate declines towards terminal growth in later years
      const yearGrowth = growthRate - (growthRate - tgr) * (year / projectionYears) * 0.5;
      projectedFCFF = projectedFCFF * (1 + yearGrowth);
      const discountFactor = Math.pow(1 + wacc, year);
      enterpriseValue += projectedFCFF / discountFactor;
    }

    // Terminal Value using Gordon Growth Model
    const terminalFCFF = projectedFCFF * (1 + tgr);
    const terminalValue = terminalFCFF / (wacc - tgr);
    const discountedTerminalValue = terminalValue / Math.pow(1 + wacc, projectionYears);

    enterpriseValue += discountedTerminalValue;

    // Subtract net debt to get equity value
    const totalDebt = latestFinancials.longTermDebt + latestFinancials.shortTermDebt;
    const netDebt = totalDebt - latestFinancials.cash;
    const equityValue = enterpriseValue - netDebt;

    // Per share value
    const fairValuePerShare = latestFinancials.sharesOutstanding > 0
      ? equityValue / latestFinancials.sharesOutstanding
      : 0;

    return Math.max(0, fairValuePerShare);
  }

  const bearCase = computeDCF(bearGrowthRate, bearWACC, bearTerminalGrowth);
  const baseCase = computeDCF(estimatedGrowthRate, baseWACC, terminalGrowthRate);
  const bullCase = computeDCF(bullGrowthRate, bullWACC, bullTerminalGrowth);

  // Weighted fair value (weighted average)
  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  // Confidence based on spread between bear and bull
  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = Math.max(0.1, Math.min(0.95, 1 - spread * 0.3));

  const assumptions = `FCFF Model: Base growth ${(estimatedGrowthRate * 100).toFixed(1)}%, WACC ${(baseWACC * 100).toFixed(1)}%, Terminal growth ${(terminalGrowthRate * 100).toFixed(1)}%. Bear: ${(bearGrowthRate * 100).toFixed(1)}% growth, ${(bearWACC * 100).toFixed(1)}% WACC. Bull: ${(bullGrowthRate * 100).toFixed(1)}% growth, ${(bullWACC * 100).toFixed(1)}% WACC. Projection: ${projectionYears} years.`;

  return {
    model: 'DCF FCFF',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}
