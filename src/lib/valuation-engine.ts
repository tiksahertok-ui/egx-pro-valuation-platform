/**
 * EGX Pro Valuation Engine
 * 8 Institutional-Grade Valuation Models
 *
 * All models return: { fairValue, upsideDownside, confidence, assumptions }
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
}

export interface SectorAverages {
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgEVEbitda: number;
  avgDividendYield: number;
}

export interface MarketParams {
  riskFreeRate: number;     // e.g. 0.18 (18%)
  equityRiskPremium: number; // e.g. 0.08 (8%)
  inflationRate: number;    // e.g. 0.30 (30%)
  gdpGrowthRate: number;    // e.g. 0.05 (5%)
  usdegpRate?: number;      // USD/EGP exchange rate
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

export interface ComprehensiveValuation {
  ticker: string;
  currentPrice: number;
  models: ValuationResult[];
  averageFairValue: number;
  medianFairValue: number;
  averageUpside: number;
  overallVerdict: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidenceScore: number;
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

function safeDivide(a: number, b: number, fallback: number = 0): number {
  if (!b || !isFinite(b) || b === 0) return fallback;
  const result = a / b;
  return isFinite(result) ? result : fallback;
}

function calculateWACC(fundamentals: StockFundamentals, params: MarketParams): number {
  const costOfEquity = params.riskFreeRate + (fundamentals.beta || 1.0) * params.equityRiskPremium;
  const afterTaxCostOfDebt = params.riskFreeRate * 0.7; // approx after-tax
  const equityWeight = fundamentals.totalEquity / (fundamentals.totalEquity + fundamentals.totalDebt) || 0.7;
  const debtWeight = 1 - equityWeight;
  return equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt * 0.8; // tax shield
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ============================================================
// Model 1: DCF (Discounted Cash Flow)
// ============================================================

function dcfValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const fcf = fundamentals.freeCashflow || (fundamentals.operatingCashflow * 0.7) || 0;
  const wacc = calculateWACC(fundamentals, params);
  const growthRate = Math.min(fundamentals.revenueGrowth || params.gdpGrowthRate, 0.15);
  const terminalGrowth = Math.min(params.gdpGrowthRate * 0.5, 0.03);

  // Terminal growth rate guard: ensure g < WACC - 1%
  const safeG = Math.min(terminalGrowth, wacc - 0.01);
  const terminalGrowthCapped = safeG < terminalGrowth;
  const effectiveTerminalGrowth = Math.max(safeG, 0);

  const projectionYears = 10;

  // FX normalization for USD-denominated revenue
  const usdPct = fundamentals.usdRevenuePct ?? 0;
  const usdegpRate = params.usdegpRate ?? 51.89;
  const effectiveRevenue = fundamentals.revenue * ((1 - usdPct) + usdPct * usdegpRate);

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
  const equityValue = enterpriseValue - fundamentals.totalDebt + (fundamentals.totalAssets - fundamentals.totalEquity - fundamentals.totalDebt); // add cash approx
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
      sectorConfidence: isModelSectorAppropriate('dcf', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped,
  };
}

// ============================================================
// Model 2: DDM (Dividend Discount Model)
// ============================================================

function ddmValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const dividendYield = fundamentals.dividendYield || sectorAvg.avgDividendYield; // already as decimal
  const dps = fundamentals.price * dividendYield;
  const costOfEquity = params.riskFreeRate + (fundamentals.beta || 1.0) * params.equityRiskPremium;
  const growthRate = Math.min(fundamentals.earningsGrowth || params.gdpGrowthRate, 0.12);

  // Gordon Growth Model: P = D1 / (k - g)
  const d1 = dps * (1 + growthRate);
  const denominator = costOfEquity - growthRate;

  let fairValue: number;
  if (denominator <= 0.01) {
    // If growth >= required return, use two-stage model with lower growth
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

function grahamValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const eps = fundamentals.eps;
  const bvps = fundamentals.bookValuePerShare;

  // Graham Number = sqrt(22.5 × EPS × BVPS)
  // Adjusted for Egypt: use 15 instead of 22.5 (more conservative for emerging market)
  const grahamMultiplier = 15;
  let grahamNumber: number;

  if (eps > 0 && bvps > 0) {
    grahamNumber = Math.sqrt(grahamMultiplier * eps * bvps);
  } else if (eps > 0) {
    // Fallback: Graham's PE-based formula: EPS × (8.5 + 2g) × 4.4 / Y
    const growthRate = fundamentals.earningsGrowth || params.gdpGrowthRate;
    grahamNumber = eps * (8.5 + 2 * growthRate * 100) * 4.4 / (params.riskFreeRate * 100);
  } else {
    grahamNumber = 0;
  }

  const upside = safeDivide(grahamNumber - fundamentals.price, fundamentals.price);

  return {
    model: 'graham',
    modelName: 'Graham Number',
    modelNameAr: 'رقم جراهام',
    fairValue: Math.round(grahamNumber * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: (eps > 0 && bvps > 0) ? 0.7 : 0.3,
    assumptions: {
      eps: eps.toFixed(2),
      bookValuePerShare: bvps.toFixed(2),
      grahamMultiplier,
      formula: `sqrt(${grahamMultiplier} × ${eps.toFixed(2)} × ${bvps.toFixed(2)})`,
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

  // PE-based fair value
  const fairValuePE = eps > 0 ? eps * sectorAvg.avgPE : 0;

  // PB-based fair value
  const fairValuePB = bvps > 0 ? bvps * sectorAvg.avgPB : 0;

  // Weight based on which metrics are available
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

function residualIncomeValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const bvps = fundamentals.bookValuePerShare;
  const roe = fundamentals.roe || (fundamentals.eps > 0 && bvps > 0 ? fundamentals.eps / bvps : sectorAvg.avgROE);
  const costOfEquity = params.riskFreeRate + (fundamentals.beta || 1.0) * params.equityRiskPremium;
  const projectionYears = 5;

  // Residual Income = EPS - (BVPS × costOfEquity)
  // In perpetuity: Fair Value = BVPS + (ROE - costOfEquity) × BVPS / costOfEquity
  let fairValue: number;

  if (roe > costOfEquity) {
    // Company creates value above required return
    // PV of residual income over projection years + terminal
    let pvResidualIncome = 0;
    let currentBVPS = bvps;
    let decliningROE = roe;

    for (let year = 1; year <= projectionYears; year++) {
      const eps = currentBVPS * decliningROE;
      const residualIncome = eps - currentBVPS * costOfEquity;
      pvResidualIncome += residualIncome / Math.pow(1 + costOfEquity, year);
      currentBVPS = currentBVPS + eps - (fundamentals.dividendYield * fundamentals.price);
      // ROE fades toward cost of equity
      decliningROE = decliningROE + (costOfEquity - decliningROE) * 0.2;
    }

    // Terminal residual income (faded to near cost of equity)
    const terminalRI = currentBVPS * (decliningROE - costOfEquity);
    const pvTerminalRI = terminalRI > 0 ? safeDivide(terminalRI, costOfEquity) / Math.pow(1 + costOfEquity, projectionYears) : 0;

    fairValue = bvps + pvResidualIncome + pvTerminalRI;
  } else {
    // Company doesn't earn above required return - fair value ≈ book value
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

function evEbitdaValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  const ev = fundamentals.marketCap + fundamentals.totalDebt - (fundamentals.totalAssets - fundamentals.totalEquity - fundamentals.totalDebt);
  const ebitda = fundamentals.operatingCashflow + (fundamentals.totalDebt * 0.05); // approximate depreciation
  const currentEVEbitda = safeDivide(ev, ebitda);

  // Use sector average EV/EBITDA
  const targetMultiple = sectorAvg.avgEVEbitda || DEFAULT_SECTOR_AVERAGES.avgEVEbitda;
  const impliedEV = ebitda * targetMultiple;
  const impliedEquity = impliedEV - fundamentals.totalDebt + (fundamentals.totalAssets - fundamentals.totalEquity - fundamentals.totalDebt);
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

function assetBasedValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  // For real estate & construction sectors, use the specialized NAV model
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
  // Net Asset Value = (Total Assets - Total Liabilities) / Shares Outstanding
  const totalLiabilities = fundamentals.totalAssets - fundamentals.totalEquity;
  const nav = fundamentals.totalEquity;
  const navShares = fundamentals.sharesOutstanding || (fundamentals.price > 0 ? fundamentals.marketCap / fundamentals.price : 1);
  const navPerShare = safeDivide(nav, navShares);

  // Apply discount/premium based on ROE vs cost of equity
  const costOfEquity = params.riskFreeRate + (fundamentals.beta || 1.0) * params.equityRiskPremium;
  const roe = fundamentals.roe || safeDivide(fundamentals.eps, fundamentals.bookValuePerShare);

  let adjustmentFactor = 1.0;
  if (roe > costOfEquity) {
    adjustmentFactor = 1 + (roe - costOfEquity) * 2; // Premium for value creation
  } else {
    adjustmentFactor = 1 + (roe - costOfEquity); // Discount for value destruction
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

function earningsPowerValuation(fundamentals: StockFundamentals, sectorAvg: SectorAverages, params: MarketParams, sector: string): ValuationResult {
  // EPV = Normalized Earnings / Cost of Capital
  const normalizedEarnings = fundamentals.netIncome || (fundamentals.revenue * (fundamentals.profitMargin || sectorAvg.avgROE * 0.5));
  const wacc = calculateWACC(fundamentals, params);

  // Adjust for maintenance capex (typically 70-80% of operating cashflow is available)
  const distributableEarnings = normalizedEarnings * 0.85; // conservative

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
      sectorConfidence: isModelSectorAppropriate('epv', sector) ? 'HIGH' : 'LOW',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}

// ============================================================
// Comprehensive Valuation (All Models)
// ============================================================

export function runAllModels(
  fundamentals: StockFundamentals,
  sectorAvg: SectorAverages = DEFAULT_SECTOR_AVERAGES,
  params: MarketParams = DEFAULT_MARKET_PARAMS,
  sector: string = '',
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

  // Compute weighted fair value
  const validModels = models.filter(m => m.fairValue > 0);
  let weightedFairValue = 0;
  let totalWeight = 0;
  for (const model of validModels) {
    const weight = sectorConfig.weights[model.model] ?? 0;
    if (weight > 0) {
      weightedFairValue += model.fairValue * weight;
      totalWeight += weight;
    }
  }
  // If no sector weights matched, fall back to equal weighting
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

  return {
    ticker: fundamentals.ticker,
    currentPrice: fundamentals.price,
    models,
    averageFairValue: Math.round(averageFairValue * 100) / 100,
    medianFairValue: Math.round(medianFairValue * 100) / 100,
    averageUpside: Math.round(averageUpside * 100) / 100,
    overallVerdict,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
  };
}

// ============================================================
// Quick Valuation (for stock list display)
// ============================================================

export function quickValuation(fundamentals: Partial<StockFundamentals>): {
  fairValue: number;
  upside: number;
  verdict: string;
} {
  const price = fundamentals.price || 0;
  const eps = fundamentals.eps || 0;
  const bvps = fundamentals.bookValuePerShare || 0;

  // Quick Graham + PE blend
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
