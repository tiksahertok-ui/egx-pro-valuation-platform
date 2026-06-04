// Master Valuation Engine - runs all 8 models
import { dcfFCFF, FinancialDataInput, ValuationOutput } from './dcf-fcff';
import { dcfFCFE } from './dcf-fcfe';
import { ddm } from './ddm';
import { residualIncome } from './residual-income';
import { peRelativeValuation, pbRelativeValuation } from './relative-valuation';
import { evEbitdaValuation } from './ev-ebitda';
import { assetBasedValuation } from './asset-based';
import { getWeightsForSector, modelWeightsToArray } from './sectorWeights';

export type { FinancialDataInput, ValuationOutput };
export type { CurrencyConvention } from './wacc';
export { dcfFCFF } from './dcf-fcff';
export { dcfFCFE } from './dcf-fcfe';
export { ddm } from './ddm';
export { residualIncome } from './residual-income';
export { peRelativeValuation, pbRelativeValuation, relativeValuation } from './relative-valuation';
export { evEbitdaValuation } from './ev-ebitda';
export { assetBasedValuation } from './asset-based';
export { getWeightsForSector, modelWeightsToArray } from './sectorWeights';
export { EGYPT_MARKET_PARAMS } from './egyptMarketParams';
export { calculateCostOfEquityEgypt, calculateWACC, validateTerminalGrowthRate } from './wacc';

interface StockData {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  price: number;
  marketCap: number;
  beta: number;
  eps: number;
  bookValuePerShare: number;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  sharesOutstanding: number;
}

interface SectorStatsData {
  avgPE: number;
  avgPB: number;
  avgEVEbitda: number;
  avgDivYield: number;
  avgROE: number;
  avgROA: number;
  avgDebtEquity: number;
}

/**
 * Run all 8 valuation models for a given stock
 * Model order: [DCF FCFF, DCF FCFE, DDM, Residual Income, P/E Relative, P/B Relative, EV/EBITDA, Asset-Based]
 */
export async function runAllValuations(
  stock: StockData,
  financials: FinancialDataInput[],
  sectorStats: SectorStatsData | null
): Promise<ValuationOutput[]> {
  if (financials.length === 0) return [];

  // Use earliest and latest financial data for growth calculations
  const sortedFinancials = [...financials].sort((a, b) => a.year - b.year);
  const earliestFinancials = sortedFinancials[0];
  const latestFinancials = sortedFinancials[sortedFinancials.length - 1];

  // Default sector stats if not available
  const sector = sectorStats ?? {
    avgPE: latestFinancials.sharesOutstanding > 0 && latestFinancials.netIncome > 0
      ? (stock.marketCap / latestFinancials.netIncome) : 10,
    avgPB: latestFinancials.sharesOutstanding > 0 && latestFinancials.totalEquity > 0
      ? (stock.marketCap / latestFinancials.totalEquity) : 1,
    avgEVEbitda: 8,
    avgDivYield: 0.04,
    avgROE: 0.15,
    avgROA: 0.05,
    avgDebtEquity: 1.0,
  };

  // Calculate derived metrics
  const totalDebt = latestFinancials.longTermDebt + latestFinancials.shortTermDebt;
  const debtToEquity = latestFinancials.totalEquity > 0 ? totalDebt / latestFinancials.totalEquity : 0;
  const roe = latestFinancials.totalEquity > 0 ? latestFinancials.netIncome / latestFinancials.totalEquity : 0;
  const revenueGrowth = earliestFinancials.revenue > 0 && (latestFinancials.year - earliestFinancials.year) > 0
    ? (latestFinancials.revenue / earliestFinancials.revenue) ** (1 / (latestFinancials.year - earliestFinancials.year)) - 1
    : 0.05;

  // 1. DCF FCFF
  const dcfFCFFResult = dcfFCFF({
    financials: earliestFinancials,
    latestFinancials,
    currentPrice: stock.price,
    beta: stock.beta,
    baseGrowthRate: revenueGrowth,
  });

  // 2. DCF FCFE
  const dcfFCFEResult = dcfFCFE({
    financials: earliestFinancials,
    latestFinancials,
    currentPrice: stock.price,
    beta: stock.beta,
    baseGrowthRate: revenueGrowth,
  });

  // 3. DDM
  const ddmResult = ddm({
    currentDividendsPerShare: latestFinancials.dividendsPerShare ?? 0,
    currentEPS: stock.eps,
    currentPrice: stock.price,
    beta: stock.beta,
    payoutRatio: latestFinancials.netIncome > 0 && stock.eps > 0
      ? latestFinancials.dividendsPerShare / stock.eps 
      : 0.4,
    isMature: stock.dividendYield > 0.05,
  });

  // 4. Residual Income
  const riResult = residualIncome({
    financials: earliestFinancials,
    latestFinancials,
    currentPrice: stock.price,
    beta: stock.beta,
  });

  // 5. P/E Relative Valuation
  const peRelativeParams = {
    currentPrice: stock.price,
    eps: stock.eps,
    bookValuePerShare: stock.bookValuePerShare,
    peRatio: stock.peRatio,
    pbRatio: stock.pbRatio,
    roe,
    revenueGrowth,
    sectorAvgPE: sector.avgPE,
    sectorAvgPB: sector.avgPB,
    debtToEquity,
  };
  const peRelativeResult = peRelativeValuation(peRelativeParams);

  // 6. P/B Relative Valuation
  const pbRelativeResult = pbRelativeValuation(peRelativeParams);

  // 7. EV/EBITDA
  const evEbitdaResult = evEbitdaValuation({
    financials: latestFinancials,
    currentPrice: stock.price,
    marketCap: stock.marketCap,
    sectorAvgEVEBITDA: sector.avgEVEbitda,
  });

  // 8. Asset-Based
  const assetResult = assetBasedValuation({
    financials: latestFinancials,
    currentPrice: stock.price,
    sector: stock.sector,
  });

  // All 8 models in the canonical order matching sectorWeights
  // Order: [DCF FCFF, DCF FCFE, DDM, Residual Income, P/E Relative, P/B Relative, EV/EBITDA, Asset-Based]
  const allModels = [dcfFCFFResult, dcfFCFEResult, ddmResult, riResult, peRelativeResult, pbRelativeResult, evEbitdaResult, assetResult];

  // Composite model: Weighted average using sector-aware weights
  const sectorWeights = getWeightsForSector(stock.sector);
  const modelWeights = modelWeightsToArray(sectorWeights);

  const compositeFairValue = allModels.reduce((sum, result, idx) => {
    const weight = modelWeights[idx];
    return sum + result.fairValue * weight;
  }, 0);

  const compositeBear = allModels.reduce((sum, result, idx) => {
    return sum + result.bearCase * modelWeights[idx];
  }, 0);

  const compositeBase = allModels.reduce((sum, result, idx) => {
    return sum + result.baseCase * modelWeights[idx];
  }, 0);

  const compositeBull = allModels.reduce((sum, result, idx) => {
    return sum + result.bullCase * modelWeights[idx];
  }, 0);

  const compositeUpside = stock.price > 0
    ? ((compositeFairValue - stock.price) / stock.price) * 100
    : 0;

  const avgConfidence = allModels.reduce((sum, r) => sum + r.confidence, 0) / allModels.length;

  const compositeResult: ValuationOutput = {
    model: 'Composite (Weighted)',
    fairValue: parseFloat(compositeFairValue.toFixed(2)),
    bearCase: parseFloat(compositeBear.toFixed(2)),
    baseCase: parseFloat(compositeBase.toFixed(2)),
    bullCase: parseFloat(compositeBull.toFixed(2)),
    upside: parseFloat(compositeUpside.toFixed(2)),
    confidence: parseFloat(Math.min(0.95, avgConfidence * 1.05).toFixed(2)),
    assumptions: `Composite model: Weighted average of DCF FCFF (${(modelWeights[0]*100).toFixed(0)}%), DCF FCFE (${(modelWeights[1]*100).toFixed(0)}%), DDM (${(modelWeights[2]*100).toFixed(0)}%), Residual Income (${(modelWeights[3]*100).toFixed(0)}%), P/E Relative (${(modelWeights[4]*100).toFixed(0)}%), P/B Relative (${(modelWeights[5]*100).toFixed(0)}%), EV/EBITDA (${(modelWeights[6]*100).toFixed(0)}%), Asset-Based (${(modelWeights[7]*100).toFixed(0)}%). Weights optimized for ${stock.sector} sector.`,
  };

  return [...allModels, compositeResult];
}
