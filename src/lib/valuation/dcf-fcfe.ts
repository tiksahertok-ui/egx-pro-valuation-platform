// DCF FCFE (Free Cash Flow to Equity) Valuation Model
// FCFE = Net Income + D&A - CapEx - Change in NWC + Net Borrowing
// Terminal value using Gordon Growth, discounted at Cost of Equity (CAPM)

import { FinancialDataInput, ValuationOutput } from './dcf-fcff';

export interface DCFFCFEParams {
  financials: FinancialDataInput;
  latestFinancials: FinancialDataInput;
  currentPrice: number;
  beta?: number;
  projectionYears?: number;
  baseGrowthRate?: number;
  terminalGrowthRate?: number;
}

/**
 * Calculate FCFE (Free Cash Flow to Equity)
 * FCFE = Net Income + Depreciation - CapEx - Change in NWC + Net Borrowing
 */
function calculateFCFE(financials: FinancialDataInput): number {
  return financials.netIncome + financials.depreciation - financials.capex - financials.changeInNWC + financials.netBorrowing;
}

/**
 * Calculate Cost of Equity using CAPM
 * Ke = Rf + Beta * (Rm - Rf)
 */
function calculateCostOfEquity(beta: number, riskFreeRate: number = 0.27, marketRiskPremium: number = 0.08): number {
  return riskFreeRate + beta * marketRiskPremium;
}

export function dcfFCFE(params: DCFFCFEParams): ValuationOutput {
  const {
    financials,
    latestFinancials,
    currentPrice,
    beta = 1.0,
    projectionYears = 10,
    baseGrowthRate,
    terminalGrowthRate = 0.03,
  } = params;

  const currentFCFE = calculateFCFE(latestFinancials);

  // Estimate growth rate
  const fallbackGrowth = financials.revenue > 0
    ? (latestFinancials.revenue / financials.revenue - 1) / 4
    : 0.05;
  const estimatedGrowthRate = baseGrowthRate ??
    Math.max(0.02, Math.min(0.25, isNaN(fallbackGrowth) ? 0.05 : fallbackGrowth));

  // Cost of Equity for base case
  const baseKe = calculateCostOfEquity(beta);

  // Bear case: lower growth, higher discount rate
  const bearGrowthRate = estimatedGrowthRate * 0.6;
  const bearKe = baseKe * 1.20;
  const bearTerminalGrowth = terminalGrowthRate * 0.5;

  // Bull case: higher growth, lower discount rate
  const bullGrowthRate = Math.min(estimatedGrowthRate * 1.4, 0.30);
  const bullKe = baseKe * 0.85;
  const bullTerminalGrowth = terminalGrowthRate * 1.5;

  function computeDCFE(growthRate: number, ke: number, tgr: number): number {
    let equityValue = 0;
    let projectedFCFE = currentFCFE;

    for (let year = 1; year <= projectionYears; year++) {
      // Growth rate gradually converges toward terminal growth
      const yearGrowth = growthRate - (growthRate - tgr) * (year / projectionYears) * 0.5;
      projectedFCFE = projectedFCFE * (1 + yearGrowth);
      const discountFactor = Math.pow(1 + ke, year);
      equityValue += projectedFCFE / discountFactor;
    }

    // Terminal Value using Gordon Growth Model
    const terminalFCFE = projectedFCFE * (1 + tgr);
    if (ke <= tgr) return 0; // Invalid: discount rate must exceed terminal growth
    const terminalValue = terminalFCFE / (ke - tgr);
    const discountedTerminalValue = terminalValue / Math.pow(1 + ke, projectionYears);

    equityValue += discountedTerminalValue;

    // Per share value
    const fairValuePerShare = latestFinancials.sharesOutstanding > 0
      ? equityValue / latestFinancials.sharesOutstanding
      : 0;

    return Math.max(0, fairValuePerShare);
  }

  const bearCase = computeDCFE(bearGrowthRate, bearKe, bearTerminalGrowth);
  const baseCase = computeDCFE(estimatedGrowthRate, baseKe, terminalGrowthRate);
  const bullCase = computeDCFE(bullGrowthRate, bullKe, bullTerminalGrowth);

  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = Math.max(0.1, Math.min(0.95, 1 - spread * 0.3));

  const assumptions = `FCFE Model: Base growth ${(estimatedGrowthRate * 100).toFixed(1)}%, Ke (CAPM) ${(baseKe * 100).toFixed(1)}%, Terminal growth ${(terminalGrowthRate * 100).toFixed(1)}%. Bear: ${(bearGrowthRate * 100).toFixed(1)}% growth, ${(bearKe * 100).toFixed(1)}% Ke. Bull: ${(bullGrowthRate * 100).toFixed(1)}% growth, ${(bullKe * 100).toFixed(1)}% Ke. Rf=27%, MRP=8%.`;

  return {
    model: 'DCF FCFE',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}
