// DCF FCFF (Free Cash Flow to Firm) Valuation Model
// Projects FCFF for 10 years, calculates terminal value using Gordon Growth Model,
// discounts at WACC, and returns fair value per share with bear/base/bull scenarios

import { calculateCostOfEquityEgypt, calculateWACC, validateTerminalGrowthRate, CurrencyConvention } from './wacc'
import { EGYPT_MARKET_PARAMS } from './egyptMarketParams'

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
  hasOCI?: boolean;
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
  hasCleanSurplusViolation?: boolean;
  cleanSurplusWarning?: string;
}

/**
 * Calculate FCFF (Free Cash Flow to Firm)
 * FCFF = EBIT * (1 - Tax Rate) + Depreciation - CapEx - Change in NWC
 */
function calculateFCFF(financials: FinancialDataInput): number {
  const nopat = financials.operatingIncome * (1 - financials.taxRate);
  return nopat + financials.depreciation - financials.capex - financials.changeInNWC;
}

export interface DCFFCFFParams {
  financials: FinancialDataInput;
  latestFinancials: FinancialDataInput;
  currentPrice: number;
  beta?: number;
  projectionYears?: number;
  baseGrowthRate?: number;
  terminalGrowthRate?: number;
  currencyConvention?: CurrencyConvention;
}

export function dcfFCFF(params: DCFFCFFParams): ValuationOutput {
  const {
    financials,
    latestFinancials,
    currentPrice,
    beta = 1.0,
    projectionYears = 10,
    baseGrowthRate,
    terminalGrowthRate = 0.08,
    currencyConvention = 'EGP_NOMINAL',
  } = params;

  // Calculate current FCFF
  const currentFCFF = calculateFCFF(latestFinancials);

  // Estimate growth rate from historical revenue if not provided
  const fallbackGrowth = financials.revenue > 0
    ? (latestFinancials.revenue / financials.revenue - 1) / 4
    : 0.05;
  const estimatedGrowthRate = baseGrowthRate ?? 
    Math.max(0.02, Math.min(0.25, isNaN(fallbackGrowth) ? 0.05 : fallbackGrowth));

  // Calculate Egypt-aware cost of equity and WACC
  const totalDebt = latestFinancials.longTermDebt + latestFinancials.shortTermDebt;
  const totalCapital = latestFinancials.totalEquity + totalDebt;
  
  const costOfEquity = calculateCostOfEquityEgypt(beta);
  const costOfDebt = totalDebt > 0 ? latestFinancials.interestExpense / totalDebt : 0.10;
  
  const equityWeight = totalCapital > 0 ? latestFinancials.totalEquity / totalCapital : 0.5;
  const debtWeight = totalCapital > 0 ? totalDebt / totalCapital : 0.5;

  // Calculate base WACC using Egypt-specific parameters
  const baseWACC = calculateWACC(costOfEquity, costOfDebt, equityWeight, debtWeight);

  // Validate terminal growth rate against WACC and currency convention
  const growthValidation = validateTerminalGrowthRate(terminalGrowthRate, baseWACC, currencyConvention);
  const effectiveTerminalGrowth = growthValidation.valid
    ? terminalGrowthRate
    : baseWACC * 0.6; // Fallback: 60% of WACC as a conservative terminal rate

  // Bear case: lower growth, higher WACC
  const bearGrowthRate = estimatedGrowthRate * 0.6;
  const bearWACC = baseWACC * 1.25;
  const bearTerminalGrowth = effectiveTerminalGrowth * 0.5;

  // Bull case: higher growth, lower WACC
  const bullGrowthRate = Math.min(estimatedGrowthRate * 1.4, 0.30);
  const bullWACC = baseWACC * 0.85;
  const bullTerminalGrowth = effectiveTerminalGrowth * 1.5;

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
    const netDebt = totalDebt - latestFinancials.cash;
    const equityValue = enterpriseValue - netDebt;

    // Per share value
    const fairValuePerShare = latestFinancials.sharesOutstanding > 0
      ? equityValue / latestFinancials.sharesOutstanding
      : 0;

    return Math.max(0, fairValuePerShare);
  }

  const bearCase = computeDCF(bearGrowthRate, bearWACC, bearTerminalGrowth);
  const baseCase = computeDCF(estimatedGrowthRate, baseWACC, effectiveTerminalGrowth);
  const bullCase = computeDCF(bullGrowthRate, bullWACC, bullTerminalGrowth);

  // Weighted fair value (weighted average)
  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  // Confidence based on spread between bear and bull
  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = Math.max(0.1, Math.min(0.95, 1 - spread * 0.3));

  const growthWarning = growthValidation.warning ? ` [Note: ${growthValidation.warning}]` : '';
  const assumptions = `FCFF Model: Base growth ${(estimatedGrowthRate * 100).toFixed(1)}%, WACC ${(baseWACC * 100).toFixed(1)}%, Terminal growth ${(effectiveTerminalGrowth * 100).toFixed(1)}%. Bear: ${(bearGrowthRate * 100).toFixed(1)}% growth, ${(bearWACC * 100).toFixed(1)}% WACC. Bull: ${(bullGrowthRate * 100).toFixed(1)}% growth, ${(bullWACC * 100).toFixed(1)}% WACC. Projection: ${projectionYears} years. Currency: ${currencyConvention}.${growthWarning}`;

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
