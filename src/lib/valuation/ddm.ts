// Dividend Discount Model (DDM)
// Single-stage DDM for mature companies
// Two-stage DDM for growing companies
// Uses dividend per share, growth rate, cost of equity

import { ValuationOutput } from './dcf-fcff';

export interface DDMParams {
  currentDividendsPerShare: number;
  currentEPS: number;
  currentPrice: number;
  beta: number;
  payoutRatio?: number;
  isMature?: boolean; // If true, use single-stage; if false, use two-stage
  stage1GrowthRate?: number;
  stage1Years?: number;
  terminalGrowthRate?: number;
}

/**
 * Calculate Cost of Equity using CAPM
 */
function calculateCostOfEquity(beta: number, riskFreeRate: number = 0.27, marketRiskPremium: number = 0.08): number {
  return riskFreeRate + beta * marketRiskPremium;
}

/**
 * Single-stage (Gordon Growth) DDM
 * Value = D1 / (Ke - g)
 */
function singleStageDDM(dps: number, growthRate: number, ke: number): number {
  if (ke <= growthRate) return 0; // Invalid assumption
  const d1 = dps * (1 + growthRate);
  return d1 / (ke - growthRate);
}

/**
 * Two-stage DDM
 * Stage 1: High growth for N years
 * Stage 2: Terminal growth using Gordon Growth
 */
function twoStageDDM(dps: number, stage1Growth: number, stage1Years: number, terminalGrowth: number, ke: number): number {
  let value = 0;
  let currentDPS = dps;

  // Stage 1: High growth
  for (let year = 1; year <= stage1Years; year++) {
    currentDPS = currentDPS * (1 + stage1Growth);
    value += currentDPS / Math.pow(1 + ke, year);
  }

  // Stage 2: Terminal value
  const terminalDPS = currentDPS * (1 + terminalGrowth);
  if (ke <= terminalGrowth) return value;
  const terminalValue = terminalDPS / (ke - terminalGrowth);
  value += terminalValue / Math.pow(1 + ke, stage1Years);

  return value;
}

export function ddm(params: DDMParams): ValuationOutput {
  const {
    currentDividendsPerShare,
    currentEPS,
    currentPrice,
    beta,
    payoutRatio,
    isMature = false,
    stage1GrowthRate,
    stage1Years = 5,
    terminalGrowthRate = 0.03,
  } = params;

  const effectiveDPS = currentDividendsPerShare > 0 
    ? currentDividendsPerShare 
    : (payoutRatio ?? 0.4) * currentEPS;

  if (effectiveDPS <= 0) {
    return {
      model: 'DDM',
      fairValue: 0,
      bearCase: 0,
      baseCase: 0,
      bullCase: 0,
      upside: 0,
      confidence: 0.1,
      assumptions: 'DDM not applicable: No dividends paid.',
    };
  }

  // Estimate sustainable growth rate: g = ROE * Retention Ratio
  const retentionRatio = 1 - (effectiveDPS / currentEPS);
  const estimatedROE = currentEPS > 0 ? 0.15 : 0; // Use average ROE estimate
  const sustainableGrowth = estimatedROE * retentionRatio;

  const baseGrowthRate = stage1GrowthRate ?? Math.min(sustainableGrowth, 0.12);
  const baseKe = calculateCostOfEquity(beta);

  // Bear case: lower growth, higher Ke
  const bearGrowthRate = baseGrowthRate * 0.5;
  const bearTerminalGrowth = terminalGrowthRate * 0.5;
  const bearKe = baseKe * 1.20;

  // Bull case: higher growth, lower Ke
  const bullGrowthRate = Math.min(baseGrowthRate * 1.5, 0.20);
  const bullTerminalGrowth = terminalGrowthRate * 1.5;
  const bullKe = baseKe * 0.85;

  function computeDDM(growthRate: number, tgr: number, ke: number): number {
    if (isMature) {
      return singleStageDDM(effectiveDPS, tgr, ke);
    } else {
      return twoStageDDM(effectiveDPS, growthRate, stage1Years, tgr, ke);
    }
  }

  const bearCase = computeDDM(bearGrowthRate, bearTerminalGrowth, bearKe);
  const baseCase = computeDDM(baseGrowthRate, terminalGrowthRate, baseKe);
  const bullCase = computeDDM(bullGrowthRate, bullTerminalGrowth, bullKe);

  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = effectiveDPS > 0 ? Math.max(0.1, Math.min(0.90, 1 - spread * 0.3)) : 0.1;

  const modelType = isMature ? 'Single-stage (Gordon Growth)' : `Two-stage (${stage1Years}yr high growth + terminal)`;
  const assumptions = `DDM ${modelType}: DPS EGP ${effectiveDPS.toFixed(2)}, Base growth ${(baseGrowthRate * 100).toFixed(1)}%, Ke ${(baseKe * 100).toFixed(1)}%, Terminal growth ${(terminalGrowthRate * 100).toFixed(1)}%. Payout ratio ${((effectiveDPS / currentEPS) * 100).toFixed(1)}%.`;

  return {
    model: 'DDM',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}
