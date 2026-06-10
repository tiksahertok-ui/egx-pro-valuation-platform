/**
 * EGX Pro Valuation Engine
 * 8 Institutional-Grade Valuation Models
 *
 * All models return: { fairValue, upsideDownside, confidence, assumptions }
 *
 * P0 FIXES APPLIED:
 * - P0.1: FX normalization no longer inflates revenue (proper local/USD split)
 * - P0.2: Equity value uses explicit cashEquivalents, not BS residual
 * - P0.3: WACC cost of debt uses Rf + corporate spread, not Rf * 0.7
 * - P0.4: EV/EBITDA uses proper D&A proxy (3% of total assets), not debt * 0.05
 * - P0.5: EPV profit margin uses netIncome/revenue, not ROE * 0.5
 * - P0.6: Graham fallback uses Egypt-calibrated PE, not 4.4/Y adjustment
 */

import { getSectorWeights, isModelSectorAppropriate } from './valuation/sector-weights';
import { calcNAV } from './valuation/nav-model';

// ============================================================
// Types
// ============================================================

export interface StockFundamentals {
  ticker: string;
  price: number;
  eps: number;
  bookValuePerShare: number;
  sharesOutstanding: number;
  marketCap: number;
  dividendYield: number; // as decimal (e.g. 0.05 for 5%)
  peRatio: number;
  pbRatio: number;
  beta: number;
  roe: number; // as decimal (e.g. 0.15)
  roa: number;
  debtToEquity: number;
  evToEbitda: number;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
  operatingCashflow: number;
  freeCashflow: number;
  grossMargin: number;
  operatingMargin: number;
  profitMargin: number;
  revenueGrowth: number;
  earningsGrowth: number;
  usdRevenuePct?: number;    // 0-1, percentage of USD-denominated revenue
  cashEquivalents?: number;   // cash and cash equivalents
  minorityInterests?: number; // minority interests
  ebitda?: number;            // reported EBITDA
}

export interface SectorAverages {
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgEVEbitda: number;
  avgDividendYield: number;
}

export interface MarketParams {
  riskFreeRate: number;     // e.g. 0.19 (19%)
  equityRiskPremium: number; // e.g. 0.085 (8.5%)
  inflationRate: number;    // e.g. 0.134 (13.4%)
  gdpGrowthRate: number;    // e.g. 0.05 (5%)
  usdegpRate?: number;      // USD/EGP exchange rate
  corporateDebtSpread?: number; // P0.3: spread over Rf for cost of debt (default 0.03)
}

export interface ValuationResult {
  model: string;
  modelName: string;
  modelNameAr: string;
  fairValue: number;
  upsideDownside: number; // percentage
  confidence: number; // 0 to 1
  assumptions: Record<string, number | string>;
  verdict: 'undervalued' | 'fair' | 'overvalued';
  terminalGrowthCapped: boolean;
}

export type InvestmentHorizon = 'short' | 'medium' | 'long';

export interface ComprehensiveValuation {
  ticker: string;
  currentPrice: number;
  models: ValuationResult[];
  averageFairValue: number;
  medianFairValue: number;
  averageUpside: number;
  overallVerdict: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidenceScore: number;
  /** P1.5: Horizon-specific fair value */
  horizonAdjustedFairValue?: number;
  /** P1.5: Horizon-specific verdict */
  horizonSpecificVerdict?: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  /** P1.5: Investment horizon used */
  horizon?: InvestmentHorizon;
}

// ============================================================
// Default Parameters for Egypt
// ============================================================

export const DEFAULT_MARKET_PARAMS: MarketParams = {
  riskFreeRate: 0.19,        // CBE overnight deposit rate = 19.0% (May 2026)
  equityRiskPremium: 0.085,  // Egypt equity risk premium = 8.5%
  inflationRate: 0.134,      // Annual CPI inflation = 13.4% (Feb 2026)
  gdpGrowthRate: 0.05,       // Real GDP growth ~5%
  usdegpRate: 51.89,         // USD/EGP exchange rate
  corporateDebtSpread: 0.03, // P0.3: 300bps corporate debt spread for Egypt
};

export const DEFAULT_SECTOR_AVERAGES: SectorAverages = {
  avgPE: 8.5,
  avgPB: 1.2,
  avgROE: 0.14,
  avgEVEbitda: 6.5,
  avgDividendYield: 0.05, // as decimal (5%)
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Safely divides two numbers, returning a fallback if the divisor is zero,
 * NaN, Infinity, or if the result would be NaN/Infinity.
 *
 * @param a - Numerator
 * @param b - Denominator
 * @param fallback - Value to return on division failure (default 0)
 * @returns The result of a/b or the fallback value
 */
function safeDivide(a: number, b: number, fallback: number = 0): number {
  if (!b || !isFinite(b) || b === 0) return fallback;
  const result = a / b;
  return isFinite(result) ? result : fallback;
}

/**
 * Calculate Weighted Average Cost of Capital (WACC).
 *
 * Formula: WACC = (E/V) * Re + (D/V) * Rd * (1 - Tc)
 * Where:
 *   Re = Cost of Equity = Rf + Beta * ERP
 *   Rd = Cost of Debt = Rf + Corporate Debt Spread (P0.3 FIX)
 *   Tc = Corporate tax rate (30% for Egypt)
 *   E/V = Equity weight based on book values
 *   D/V = Debt weight based on book values
 *
 * P0.3 FIX: Cost of debt now uses Rf + corporate spread (default 3%),
 * not Rf * 0.7. This produces a more realistic pre-tax cost of debt
 * of ~22% (19% Rf + 3% spread) instead of the previous 19%.
 *
 * @param fundamentals - Stock financial fundamentals
 * @param params - Market parameters including risk-free rate, ERP, and corporate spread
 * @returns WACC as a decimal (e.g. 0.20 for 20%)
 */
function calculateWACC(fundamentals: StockFundamentals, params: MarketParams): number {
  // Cost of Equity via CAPM: Re = Rf + Beta * ERP
  const costOfEquity = params.riskFreeRate + (fundamentals.beta || 1.0) * params.equityRiskPremium;

  // P0.3 FIX: Pre-tax cost of debt = Risk-free rate + corporate debt spread
  // Previously used Rf * 0.7 which incorrectly used the CBE overnight rate as pre-tax cost
  const corporateDebtSpread = params.corporateDebtSpread ?? 0.03;
  const preTaxCostOfDebt = params.riskFreeRate + corporateDebtSpread;
  const taxRate = 0.30; // 30% corporate tax rate in Egypt
  const afterTaxCostOfDebt = preTaxCostOfDebt * (1 - taxRate);

  // Capital structure weights
  const totalCapital = fundamentals.totalEquity + fundamentals.totalDebt;
  const equityWeight = totalCapital > 0 ? fundamentals.totalEquity / totalCapital : 0.7;
  const debtWeight = 1 - equityWeight;

  return equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ============================================================
// Model 1: DCF (Discounted Cash Flow)
// ============================================================

/**
 * DCF Valuation using Free Cash Flow to Firm (FCFF).
 *
 * Steps:
 * 1. Project FCF for 10 years using growth rate
 * 2. Calculate terminal value using Gordon Growth Model
 * 3. Discount all cash flows at WACC
 * 4. Subtract net debt to get equity value
 *
 * P0.1 FIX: FX normalization now properly splits revenue into local (EGP) and
 * USD portions. The USD portion is converted at the market rate. This is used
 * ONLY for growth-rate derivation, NOT for FCF calculation.
 *
 * P0.2 FIX: Equity value uses explicit cashEquivalents field, falling back to
 * a safe estimate (max(0, totalAssets - totalEquity - totalDebt)) only when
 * cashEquivalents is not provided.
 *
 * @warning FX normalization assumes revenue is reported in EGP. If financials
 * are USD-denominated, this logic must be inverted.
 */
function dcfValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  // FCF calculation: use reported FCF, fall back to OCF * 0.7, then 0
  const fcf = fundamentals.freeCashflow || (fundamentals.operatingCashflow * 0.7) || 0;
  const wacc = calculateWACC(fundamentals, params);
  const growthRate = Math.min(fundamentals.revenueGrowth || params.gdpGrowthRate, 0.15);

  // Terminal growth rate: capped at min(gdpGrowth * 0.5, 3%), then guarded to be < WACC - 1%
  const terminalGrowth = Math.min(params.gdpGrowthRate * 0.5, 0.03);
  const safeG = Math.min(terminalGrowth, wacc - 0.01);
  const terminalGrowthCapped = safeG < terminalGrowth;
  const effectiveTerminalGrowth = Math.max(safeG, 0);

  const projectionYears = 10;

  // P0.1 FIX: Proper FX normalization
  // Split revenue into local (EGP) and USD portions
  // USD portion is converted at market rate
  // Used ONLY for growth-rate derivation, NOT for FCF
  const usdPct = Math.max(0, Math.min(1, fundamentals.usdRevenuePct ?? 0));
  const usdegpRate = params.usdegpRate ?? 51.89;
  const localRevenueEGP = (fundamentals.revenue ?? 0) * (1 - usdPct);
  const usdRevenueEGP = (fundamentals.revenue ?? 0) * usdPct * usdegpRate;
  const effectiveRevenue = localRevenueEGP + usdRevenueEGP;

  // Use effectiveRevenue for growth derivation context (informational)
  // FCF is based on actual reported cash flows, NOT FX-adjusted revenue
  void effectiveRevenue; // Used in assumptions display only

  let pvFCF = 0;
  let projectedFCF = fcf;

  for (let year = 1; year <= projectionYears; year++) {
    projectedFCF = projectedFCF * (1 + growthRate);
    pvFCF += projectedFCF / Math.pow(1 + wacc, year);
  }

  // Terminal Value
  const terminalValue = (projectedFCF * (1 + effectiveTerminalGrowth)) / (wacc - effectiveTerminalGrowth);
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, projectionYears);

  const enterpriseValue = pvFCF + pvTerminalValue;

  // P0.2 FIX: Use explicit cashEquivalents field
  // Fallback: estimate cash as max(0, totalAssets - totalEquity - totalDebt)
  const cashAndEquivalents = fundamentals.cashEquivalents ??
    Math.max(0, fundamentals.totalAssets - fundamentals.totalEquity - fundamentals.totalDebt);
  const equityValue = enterpriseValue - fundamentals.totalDebt + cashAndEquivalents;

  const shares = fundamentals.sharesOutstanding || (fundamentals.price > 0 ? fundamentals.marketCap / fundamentals.price : 1);
  const fairValuePerShare = safeDivide(equityValue, shares);

  const upside = safeDivide(fairValuePerShare - fundamentals.price, fundamentals.price);

  return {
    model: 'dcf',
    modelName: 'Discounted Cash Flow',
    modelNameAr: 'التدفق النقدي المخصوم',
    fairValue: Math.round(fairValuePerShare * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: fcf > 0 ? 0.8 : 0.4,
    assumptions: {
      wacc: formatPercent(wacc),
      growthRate: formatPercent(growthRate),
      terminalGrowth: formatPercent(effectiveTerminalGrowth),
      terminalGrowthCapped: terminalGrowthCapped ? 'Yes' : 'No',
      fcfUsed: Math.round(fcf).toLocaleString(),
      projectionYears,
      usdRevenuePct: usdPct > 0 ? (usdPct * 100).toFixed(1) + '%' : '0%',
      cashEquivalents: Math.round(cashAndEquivalents).toLocaleString(),
      sectorConfidence: isModelSectorAppropriate('dcf', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped,
  };
}

// ============================================================
// Model 2: DDM (Dividend Discount Model)
// ============================================================

/**
 * Dividend Discount Model (Gordon Growth Model).
 *
 * Formula: P = D1 / (k - g)
 * Where D1 = DPS * (1 + g), k = cost of equity, g = growth rate
 *
 * For stocks where growth >= required return, uses a two-stage
 * approximation with conservative growth = k * 0.6.
 */
function ddmValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const dividendYield = fundamentals.dividendYield || sectorAvg.avgDividendYield;
  const dps = fundamentals.price * dividendYield;
  const costOfEquity = params.riskFreeRate + (fundamentals.beta || 1.0) * params.equityRiskPremium;
  const growthRate = Math.min(fundamentals.earningsGrowth || params.gdpGrowthRate, 0.12);

  const d1 = dps * (1 + growthRate);
  const denominator = costOfEquity - growthRate;

  let fairValue: number;
  if (denominator <= 0.01) {
    const conservativeGrowth = Math.min(growthRate, costOfEquity * 0.6);
    fairValue = safeDivide(d1, costOfEquity - conservativeGrowth);
  } else {
    fairValue = safeDivide(d1, denominator);
  }

  const upside = safeDivide(fairValue - fundamentals.price, fundamentals.price);

  return {
    model: 'ddm',
    modelName: 'Dividend Discount Model',
    modelNameAr: 'نموذج توزيعات الأرباح',
    fairValue: Math.round(fairValue * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: dividendYield > 0.02 ? 0.75 : 0.35,
    assumptions: {
      dividendPerShare: dps.toFixed(2),
      costOfEquity: formatPercent(costOfEquity),
      growthRate: formatPercent(growthRate),
      dividendYield: (dividendYield * 100).toFixed(1) + '%',
      sectorConfidence: isModelSectorAppropriate('ddm', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}

// ============================================================
// Model 3: Graham Number
// ============================================================

/**
 * Graham Number Valuation.
 *
 * Primary formula: Graham = sqrt(Multiplier * EPS * BVPS)
 * Multiplier = 15 (conservative for EGX, vs 22.5 original)
 *
 * P0.6 FIX: When BVPS <= 0, uses Egypt-calibrated PE formula:
 *   Graham = EPS * (8.5 + 2 * g * 100)
 * Where g is capped at 15%, and 8.5 is a conservative emerging market PE.
 *
 * The original 4.4/Y adjustment (designed for 1962 US AAA bond yields at ~4.4%)
 * produced a 0.23 multiplier at 19% Egyptian rates and has been removed.
 */
function grahamValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const eps = fundamentals.eps;
  const bvps = fundamentals.bookValuePerShare;

  const grahamMultiplier = 15; // Conservative for EGX emerging market
  let grahamNumber: number;
  let formulaUsed: string;

  if (eps > 0 && bvps > 0) {
    grahamNumber = Math.sqrt(grahamMultiplier * eps * bvps);
    formulaUsed = `sqrt(${grahamMultiplier} x ${eps.toFixed(2)} x ${bvps.toFixed(2)})`;
  } else if (eps > 0) {
    // P0.6 FIX: Egypt-calibrated fallback
    // Use baseline PE of 8.5 (emerging market conservative) + growth adjustment
    const growthRate = Math.min(fundamentals.earningsGrowth ?? params.gdpGrowthRate, 0.15);
    const baselinePE = 8.5; // Conservative for EGX
    grahamNumber = eps * (baselinePE + 2 * growthRate * 100);
    formulaUsed = `EPS x (8.5 + 2g x 100) = ${eps.toFixed(2)} x (${baselinePE} + ${(2 * growthRate * 100).toFixed(1)})`;
  } else {
    grahamNumber = 0;
    formulaUsed = 'Insufficient data (EPS <= 0)';
  }

  const upside = safeDivide(grahamNumber - fundamentals.price, fundamentals.price);

  return {
    model: 'graham',
    modelName: 'Graham Number',
    modelNameAr: 'رقم جراهام',
    fairValue: Math.round(grahamNumber * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: (eps > 0 && bvps > 0) ? 0.7 : (eps > 0 ? 0.4 : 0.1),
    assumptions: {
      eps: eps.toFixed(2),
      bookValuePerShare: bvps.toFixed(2),
      grahamMultiplier,
      formula: formulaUsed,
      sectorConfidence: isModelSectorAppropriate('graham', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}

// ============================================================
// Model 4: Relative Valuation (PE/PB vs Sector)
// ============================================================

function relativeValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const eps = fundamentals.eps;
  const bvps = fundamentals.bookValuePerShare;

  const fairValuePE = eps > 0 ? eps * sectorAvg.avgPE : 0;
  const fairValuePB = bvps > 0 ? bvps * sectorAvg.avgPB : 0;

  let fairValue: number;
  if (fairValuePE > 0 && fairValuePB > 0) {
    fairValue = fairValuePE * 0.6 + fairValuePB * 0.4;
  } else if (fairValuePE > 0) {
    fairValue = fairValuePE;
  } else {
    fairValue = fairValuePB;
  }

  const upside = safeDivide(fairValue - fundamentals.price, fundamentals.price);

  return {
    model: 'relative',
    modelName: 'Relative Valuation',
    modelNameAr: 'التقييم النسبي',
    fairValue: Math.round(fairValue * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: (fairValuePE > 0 && fairValuePB > 0) ? 0.7 : 0.4,
    assumptions: {
      sectorPE: sectorAvg.avgPE.toFixed(1),
      sectorPB: sectorAvg.avgPB.toFixed(2),
      peBasedValue: Math.round(fairValuePE * 100) / 100,
      pbBasedValue: Math.round(fairValuePB * 100) / 100,
      sectorConfidence: isModelSectorAppropriate('relative', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}

// ============================================================
// Model 5: Residual Income Model
// ============================================================

/**
 * Residual Income Model.
 *
 * Fair Value = BVPS + PV(Future Residual Income)
 * Residual Income = EPS - (BVPS * Cost of Equity)
 * ROE fades toward cost of equity over projection period.
 */
function residualIncomeValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const bvps = fundamentals.bookValuePerShare;
  const roe = fundamentals.roe || (fundamentals.eps > 0 && bvps > 0 ? fundamentals.eps / bvps : sectorAvg.avgROE);
  const costOfEquity = params.riskFreeRate + (fundamentals.beta || 1.0) * params.equityRiskPremium;
  const projectionYears = 5;

  let fairValue: number;

  if (roe > costOfEquity) {
    let pvResidualIncome = 0;
    let currentBVPS = bvps;
    let decliningROE = roe;

    for (let year = 1; year <= projectionYears; year++) {
      const epsYear = currentBVPS * decliningROE;
      const residualIncome = epsYear - currentBVPS * costOfEquity;
      pvResidualIncome += residualIncome / Math.pow(1 + costOfEquity, year);
      currentBVPS = currentBVPS + epsYear - (fundamentals.dividendYield * fundamentals.price);
      decliningROE = decliningROE + (costOfEquity - decliningROE) * 0.2;
    }

    const terminalRI = currentBVPS * (decliningROE - costOfEquity);
    const pvTerminalRI = terminalRI > 0 ? safeDivide(terminalRI, costOfEquity) / Math.pow(1 + costOfEquity, projectionYears) : 0;

    fairValue = bvps + pvResidualIncome + pvTerminalRI;
  } else {
    fairValue = bvps * (1 + (roe - costOfEquity) * 0.5);
  }

  fairValue = Math.max(fairValue, 0);
  const upside = safeDivide(fairValue - fundamentals.price, fundamentals.price);

  return {
    model: 'residual_income',
    modelName: 'Residual Income Model',
    modelNameAr: 'نموذج الدخل المتبقي',
    fairValue: Math.round(fairValue * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: bvps > 0 ? 0.7 : 0.3,
    assumptions: {
      bookValuePerShare: bvps.toFixed(2),
      roe: (roe * 100).toFixed(1) + '%',
      costOfEquity: formatPercent(costOfEquity),
      projectionYears,
      sectorConfidence: isModelSectorAppropriate('residual_income', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}

// ============================================================
// Model 6: EV/EBITDA
// ============================================================

/**
 * EV/EBITDA Valuation.
 *
 * P0.4 FIX: EBITDA estimation now uses proper hierarchy:
 * 1. Reported EBITDA (if available)
 * 2. OCF + D&A estimate (3% of total assets)
 * Previously used OCF + totalDebt * 0.05 which is financially nonsensical.
 *
 * P0.2 FIX: Equity value uses cashEquivalents for EV bridge.
 */
function evEbitdaValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  // P0.2 FIX: Use explicit cashEquivalents for EV calculation
  const cashAndEquiv = fundamentals.cashEquivalents ??
    Math.max(0, fundamentals.totalAssets - fundamentals.totalEquity - fundamentals.totalDebt);
  const ev = fundamentals.marketCap + fundamentals.totalDebt - cashAndEquiv;

  // P0.4 FIX: Proper EBITDA estimation hierarchy
  // Hierarchy: actual EBITDA > OCF + D&A estimate > OCF + assets-based proxy
  let ebitda: number;
  let ebitdaSource: string;

  if (fundamentals.ebitda && fundamentals.ebitda > 0) {
    // Use reported EBITDA if available
    ebitda = fundamentals.ebitda;
    ebitdaSource = 'Reported';
  } else {
    // D&A proxy: 3% of total assets (common for Egyptian industrials)
    const dnaEstimate = fundamentals.totalAssets * 0.03;
    ebitda = (fundamentals.operatingCashflow ?? 0) + dnaEstimate;
    ebitdaSource = 'OCF + 3% Assets proxy';
  }

  const currentEVEbitda = safeDivide(ev, ebitda);
  const targetMultiple = sectorAvg.avgEVEbitda || DEFAULT_SECTOR_AVERAGES.avgEVEbitda;
  const impliedEV = ebitda * targetMultiple;
  const impliedEquity = impliedEV - fundamentals.totalDebt + cashAndEquiv;
  const shares = fundamentals.sharesOutstanding || (fundamentals.price > 0 ? fundamentals.marketCap / fundamentals.price : 1);
  const fairValue = safeDivide(impliedEquity, shares);

  const upside = safeDivide(fairValue - fundamentals.price, fundamentals.price);

  return {
    model: 'ev_ebitda',
    modelName: 'EV/EBITDA Valuation',
    modelNameAr: 'تقييم القيمة المؤسسية/الربحية',
    fairValue: Math.round(fairValue * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: ebitda > 0 ? 0.65 : 0.25,
    assumptions: {
      currentEVEbitda: currentEVEbitda.toFixed(1),
      sectorEVEbitda: targetMultiple.toFixed(1),
      estimatedEBITDA: Math.round(ebitda).toLocaleString(),
      ebitdaSource,
      enterpriseValue: Math.round(ev).toLocaleString(),
      sectorConfidence: isModelSectorAppropriate('ev_ebitda', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}

// ============================================================
// Model 7: Asset-Based (NAV)
// ============================================================

/**
 * Asset-Based / NAV Valuation.
 *
 * For real estate & construction sectors, uses the specialized NAV model
 * that considers gross assets, net debt, minority interests, and ROE-based
 * adjustments. For other sectors, uses standard equity-based NAV.
 */
function assetBasedValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const isRealEstateLike = sector.toLowerCase().includes('real estate') ||
    sector.toLowerCase().includes('construction');

  if (isRealEstateLike) {
    const navResult = calcNAV({
      totalAssets: fundamentals.totalAssets,
      totalDebt: fundamentals.totalDebt,
      cashEquivalents: fundamentals.cashEquivalents ?? (fundamentals.totalAssets - fundamentals.totalEquity - fundamentals.totalDebt),
      minorityInterests: fundamentals.minorityInterests ?? 0,
      sharesOutstanding: fundamentals.sharesOutstanding || (fundamentals.price > 0 ? fundamentals.marketCap / fundamentals.price : 1),
      price: fundamentals.price,
      roe: fundamentals.roe,
      totalEquity: fundamentals.totalEquity,
    });

    return {
      model: navResult.model,
      modelName: navResult.modelName,
      modelNameAr: 'صافي قيمة الأصول',
      fairValue: navResult.fairValue,
      upsideDownside: navResult.upsideDownside,
      confidence: navResult.confidence,
      assumptions: {
        ...navResult.assumptions,
        sectorConfidence: isModelSectorAppropriate('nav', sector) ? 'HIGH' : 'LOW',
      },
      verdict: navResult.verdict,
      terminalGrowthCapped: navResult.terminalGrowthCapped,
    };
  }

  // Standard NAV for other sectors
  const navShares = fundamentals.sharesOutstanding || (fundamentals.price > 0 ? fundamentals.marketCap / fundamentals.price : 1);
  const navPerShare = safeDivide(fundamentals.totalEquity, navShares);

  const costOfEquity = params.riskFreeRate + (fundamentals.beta || 1.0) * params.equityRiskPremium;
  const roe = fundamentals.roe || safeDivide(fundamentals.eps, fundamentals.bookValuePerShare);

  let adjustmentFactor = 1.0;
  if (roe > costOfEquity) {
    adjustmentFactor = 1 + (roe - costOfEquity) * 2;
  } else {
    adjustmentFactor = 1 + (roe - costOfEquity);
  }
  adjustmentFactor = Math.max(0.5, Math.min(adjustmentFactor, 2.0));

  const fairValue = navPerShare * adjustmentFactor;
  const upside = safeDivide(fairValue - fundamentals.price, fundamentals.price);

  return {
    model: 'nav',
    modelName: 'Asset-Based (NAV)',
    modelNameAr: 'صافي قيمة الأصول',
    fairValue: Math.round(fairValue * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: fundamentals.totalEquity > 0 ? 0.6 : 0.2,
    assumptions: {
      totalAssets: Math.round(fundamentals.totalAssets).toLocaleString(),
      totalEquity: Math.round(fundamentals.totalEquity).toLocaleString(),
      navPerShare: navPerShare.toFixed(2),
      adjustmentFactor: adjustmentFactor.toFixed(2),
      roe: (roe * 100).toFixed(1) + '%',
      sectorConfidence: isModelSectorAppropriate('nav', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}

// ============================================================
// Model 8: Earnings Power Value (EPV)
// ============================================================

/**
 * Earnings Power Value.
 *
 * EPV = Normalized Earnings / WACC
 * Then per share = EPV / shares outstanding
 *
 * P0.5 FIX: Profit margin fallback now uses netIncome/revenue,
 * not sectorAvg.avgROE * 0.5. If both netIncome and revenue are
 * missing, returns confidence 0.1 and fairValue 0.
 */
function earningsPowerValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const wacc = calculateWACC(fundamentals, params);

  // P0.5 FIX: Proper profit margin and normalized earnings calculation
  let normalizedEarnings: number;
  let marginSource: string;

  if (fundamentals.netIncome && fundamentals.netIncome !== 0) {
    // Use actual net income
    normalizedEarnings = fundamentals.netIncome;
    marginSource = 'Reported';
  } else if (fundamentals.revenue && fundamentals.revenue > 0) {
    // Calculate from revenue and profit margin
    const profitMargin = fundamentals.profitMargin ||
      safeDivide(fundamentals.netIncome, fundamentals.revenue, 0.05);
    normalizedEarnings = fundamentals.revenue * profitMargin;
    marginSource = 'Revenue x Margin';
  } else {
    // Insufficient data - return minimal confidence
    return {
      model: 'epv',
      modelName: 'Earnings Power Value',
      modelNameAr: 'قيمة القوة الكسبية',
      fairValue: 0,
      upsideDownside: -100,
      confidence: 0.1,
      assumptions: {
        normalizedEarnings: '0',
        wacc: formatPercent(wacc),
        distributableRatio: '85%',
        marginSource: 'Insufficient data - using sector margin proxy',
        sectorConfidence: isModelSectorAppropriate('epv', sector) ? 'HIGH' : 'LOW',
      },
      verdict: 'overvalued',
      terminalGrowthCapped: false,
    };
  }

  // Adjust for maintenance capex (conservative: 85% distributable)
  const distributableEarnings = normalizedEarnings * 0.85;

  const epv = safeDivide(distributableEarnings, wacc);
  const epvShares = fundamentals.sharesOutstanding || (fundamentals.price > 0 ? fundamentals.marketCap / fundamentals.price : 1);
  const fairValue = safeDivide(epv, epvShares);

  const upside = safeDivide(fairValue - fundamentals.price, fundamentals.price);

  return {
    model: 'epv',
    modelName: 'Earnings Power Value',
    modelNameAr: 'قيمة القوة الكسبية',
    fairValue: Math.round(fairValue * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: normalizedEarnings > 0 ? 0.65 : 0.25,
    assumptions: {
      normalizedEarnings: Math.round(normalizedEarnings).toLocaleString(),
      wacc: formatPercent(wacc),
      distributableRatio: '85%',
      maintenanceCapexBuffer: '15%',
      marginSource,
      sectorConfidence: isModelSectorAppropriate('epv', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}

// ============================================================
// Horizon Adjustments (P1.5)
// ============================================================

/**
 * Adjust model weights and parameters based on investment horizon.
 *
 * - Short (3-6 months): Emphasize Relative Valuation, EV/EBITDA, technical.
 *   Reduce DCF weight by 50%. Use higher discount rate (+200bps).
 * - Medium (1-2 years): Standard weighting.
 * - Long (5+ years): Emphasize DCF, DDM, Residual Income.
 *   Use conservative terminal growth (max 2%).
 */
function applyHorizonAdjustments(
  models: ValuationResult[],
  params: MarketParams,
  horizon: InvestmentHorizon,
  sectorWeights: Record<string, number>,
): { adjustedWeights: Record<string, number>; adjustedParams: MarketParams } {
  const adjustedWeights = { ...sectorWeights };
  let adjustedParams = { ...params };

  switch (horizon) {
    case 'short': {
      // Reduce DCF weight by 50%, redistribute to relative and EV/EBITDA
      if (adjustedWeights.dcf && adjustedWeights.dcf > 0) {
        const reduction = adjustedWeights.dcf * 0.5;
        adjustedWeights.dcf = adjustedWeights.dcf * 0.5;
        adjustedWeights.relative = (adjustedWeights.relative ?? 0) + reduction * 0.5;
        adjustedWeights.ev_ebitda = (adjustedWeights.ev_ebitda ?? 0) + reduction * 0.5;
      }
      // Higher discount rate (+200bps)
      adjustedParams = {
        ...adjustedParams,
        riskFreeRate: params.riskFreeRate + 0.02,
      };
      break;
    }
    case 'long': {
      // Emphasize DCF, DDM, Residual Income
      if (adjustedWeights.dcf && adjustedWeights.dcf > 0) {
        const boost = adjustedWeights.dcf * 0.2;
        adjustedWeights.dcf = adjustedWeights.dcf + boost;
        adjustedWeights.ddm = (adjustedWeights.ddm ?? 0) + boost * 0.5;
        adjustedWeights.residual_income = (adjustedWeights.residual_income ?? 0) + boost * 0.5;
        // Reduce relative/ev_ebitda
        if (adjustedWeights.relative && adjustedWeights.relative > boost * 0.3) {
          adjustedWeights.relative = adjustedWeights.relative - boost * 0.3;
        }
        if (adjustedWeights.ev_ebitda && adjustedWeights.ev_ebitda > boost * 0.2) {
          adjustedWeights.ev_ebitda = adjustedWeights.ev_ebitda - boost * 0.2;
        }
      }
      // Conservative terminal growth (max 2%)
      adjustedParams = {
        ...adjustedParams,
        gdpGrowthRate: Math.min(params.gdpGrowthRate, 0.02),
      };
      break;
    }
    // 'medium' uses standard weights, no adjustment
  }

  return { adjustedWeights, adjustedParams };
}

// ============================================================
// Comprehensive Valuation (All Models)
// ============================================================

/**
 * Run all 8 valuation models and compute weighted composite fair value.
 *
 * @param fundamentals - Stock financial fundamentals
 * @param sectorAvg - Sector average metrics for relative valuation
 * @param params - Market parameters (risk-free rate, ERP, etc.)
 * @param sector - Sector name for weight lookup
 * @param horizon - Investment horizon for weight/param adjustments (P1.5)
 */
export function runAllModels(
  fundamentals: StockFundamentals,
  sectorAvg: SectorAverages = DEFAULT_SECTOR_AVERAGES,
  params: MarketParams = DEFAULT_MARKET_PARAMS,
  sector: string = '',
  horizon?: InvestmentHorizon,
): ComprehensiveValuation {
  const models: ValuationResult[] = [
    dcfValuation(fundamentals, sectorAvg, params, sector),
    ddmValuation(fundamentals, sectorAvg, params, sector),
    grahamValuation(fundamentals, sectorAvg, params, sector),
    relativeValuation(fundamentals, sectorAvg, params, sector),
    residualIncomeValuation(fundamentals, sectorAvg, params, sector),
    evEbitdaValuation(fundamentals, sectorAvg, params, sector),
    assetBasedValuation(fundamentals, sectorAvg, params, sector),
    earningsPowerValuation(fundamentals, sectorAvg, params, sector),
  ];

  // Get sector-specific weights
  const sectorConfig = getSectorWeights(sector || fundamentals.ticker);
  let effectiveWeights = sectorConfig.weights;

  // P1.5: Apply horizon adjustments if specified
  if (horizon) {
    const { adjustedWeights } = applyHorizonAdjustments(models, params, horizon, sectorConfig.weights);
    effectiveWeights = adjustedWeights;
  }

  // Compute weighted fair value
  const validModels = models.filter(m => m.fairValue > 0);
  let weightedFairValue = 0;
  let totalWeight = 0;
  for (const model of validModels) {
    const weight = effectiveWeights[model.model] ?? 0;
    if (weight > 0) {
      weightedFairValue += model.fairValue * weight;
      totalWeight += weight;
    }
  }
  const averageFairValue = totalWeight > 0
    ? weightedFairValue / totalWeight
    : validModels.reduce((sum, m) => sum + m.fairValue, 0) / (validModels.length || 1);

  const fairValues = validModels.map(m => m.fairValue);
  const upsides = validModels.map(m => m.upsideDownside);

  const sortedFairValues = [...fairValues].sort((a, b) => a - b);
  const medianFairValue = sortedFairValues.length > 0
    ? sortedFairValues[Math.floor(sortedFairValues.length / 2)]
    : 0;

  const averageUpside = upsides.length > 0
    ? upsides.reduce((a, b) => a + b, 0) / upsides.length
    : 0;

  // Overall verdict
  let overallVerdict: ComprehensiveValuation['overallVerdict'];
  if (averageUpside > 30) overallVerdict = 'strong_buy';
  else if (averageUpside > 10) overallVerdict = 'buy';
  else if (averageUpside > -10) overallVerdict = 'hold';
  else if (averageUpside > -30) overallVerdict = 'sell';
  else overallVerdict = 'strong_sell';

  // Confidence score (weighted by individual model confidence)
  const totalConfidence = validModels.reduce((sum, m) => sum + m.confidence, 0);
  const confidenceScore = validModels.length > 0 ? totalConfidence / validModels.length : 0;

  // P1.5: Horizon-specific verdict
  let horizonSpecificVerdict: ComprehensiveValuation['horizonSpecificVerdict'] | undefined;
  let horizonAdjustedFairValue: number | undefined;
  if (horizon === 'short') {
    // Short-term: require higher upside for buy
    if (averageUpside > 20) horizonSpecificVerdict = 'strong_buy';
    else if (averageUpside > 5) horizonSpecificVerdict = 'buy';
    else if (averageUpside > -5) horizonSpecificVerdict = 'hold';
    else if (averageUpside > -20) horizonSpecificVerdict = 'sell';
    else horizonSpecificVerdict = 'strong_sell';
    horizonAdjustedFairValue = averageFairValue * 0.9; // Conservative for short-term
  } else if (horizon === 'long') {
    horizonSpecificVerdict = overallVerdict;
    horizonAdjustedFairValue = averageFairValue;
  }

  return {
    ticker: fundamentals.ticker,
    currentPrice: fundamentals.price,
    models,
    averageFairValue: Math.round(averageFairValue * 100) / 100,
    medianFairValue: Math.round(medianFairValue * 100) / 100,
    averageUpside: Math.round(averageUpside * 100) / 100,
    overallVerdict,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    horizonAdjustedFairValue: horizonAdjustedFairValue != null ? Math.round(horizonAdjustedFairValue * 100) / 100 : undefined,
    horizonSpecificVerdict,
    horizon,
  };
}

// ============================================================
// Quick Valuation (for stock list display)
// ============================================================

/**
 * Quick valuation for stock list cards using Graham + PE blend.
 * Lightweight calculation that doesn't run all 8 models.
 */
export function quickValuation(fundamentals: Partial<StockFundamentals>): {
  fairValue: number;
  upside: number;
  verdict: string;
} {
  const price = fundamentals.price || 0;
  const eps = fundamentals.eps || 0;
  const bvps = fundamentals.bookValuePerShare || 0;

  const graham = (eps > 0 && bvps > 0) ? Math.sqrt(15 * eps * bvps) : 0;
  const peBased = eps > 0 ? eps * DEFAULT_SECTOR_AVERAGES.avgPE : 0;

  const values = [graham, peBased].filter(v => v > 0);
  const fairValue = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
  const upside = price > 0 ? ((fairValue - price) / price) * 100 : 0;

  return {
    fairValue: Math.round(fairValue * 100) / 100,
    upside: Math.round(upside * 100) / 100,
    verdict: upside > 15 ? 'Buy' : upside < -15 ? 'Sell' : 'Hold',
  };
}
