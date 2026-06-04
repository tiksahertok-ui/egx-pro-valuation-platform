// Financial Metrics Library
// Calculate comprehensive financial metrics including WACC, CAPM, ROE, ROA, ROIC, etc.

import { EGYPT_MARKET_PARAMS } from '../valuation/egyptMarketParams';
import { calculateCostOfEquityEgypt, calculateWACC } from '../valuation/wacc';

export interface MetricsResult {
  // Cost of Capital
  wacc: number;
  costOfEquity: number;
  costOfDebt: number;
  debtToValue: number;
  equityToValue: number;

  // Profitability Ratios
  roe: number;           // Return on Equity
  roa: number;           // Return on Assets
  roic: number;          // Return on Invested Capital
  roicDescription: string;

  // Growth Metrics
  epsGrowth: number;
  revenueCAGR: number;
  netIncomeCAGR: number;

  // Leverage Ratios
  debtToEquity: number;
  debtToAssets: number;
  interestCoverage: number;
  equityMultiplier: number;

  // Margin Analysis
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  ebitdaMargin: number;

  // Efficiency Ratios
  assetTurnover: number;
  receivablesTurnover: number;
  payablesTurnover: number;

  // Liquidity Ratios
  currentRatio: number;
  quickRatio: number;

  // Valuation Metrics
  peRatio: number;
  pbRatio: number;
  evEbitda: number;
  priceToFCF: number;
  dividendPayoutRatio: number;

  // Additional
  fcffYield: number;
  fcfeYield: number;
  earningsQuality: number; // CFO / Net Income

  // CAPM Inputs
  riskFreeRate: number;
  marketRiskPremium: number;
  beta: number;
}

export interface MetricsInput {
  financials: {
    revenue: number;
    costOfRevenue: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    ebitda: number;
    depreciation: number;
    interestExpense: number;
    netIncome: number;
    eps: number;
    dividendsPerShare: number;
    totalAssets: number;
    currentAssets: number;
    cash: number;
    totalLiabilities: number;
    currentLiabilities: number;
    longTermDebt: number;
    shortTermDebt: number;
    totalEquity: number;
    sharesOutstanding: number;
    operatingCashFlow: number;
    capitalExpenditure: number;
    freeCashFlow: number;
    changeInNWC: number;
    netBorrowing: number;
    taxRate: number;
    year: number;
  }[];
  currentPrice: number;
  marketCap: number;
  beta: number;
  sharesOutstanding: number;
}

function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (denominator === 0 || !isFinite(denominator)) return defaultValue;
  return numerator / denominator;
}

export function calculateMetrics(input: MetricsInput): MetricsResult {
  const { financials, currentPrice, marketCap, beta, sharesOutstanding } = input;

  if (financials.length === 0) {
    return getEmptyMetrics();
  }

  // Use latest financial data
  const sorted = [...financials].sort((a, b) => b.year - a.year);
  const latest = sorted[0];
  const earliest = sorted[sorted.length - 1];

  // =============================================
  // Cost of Capital Calculations (Egypt-specific)
  // =============================================

  // Cost of Equity using Egypt CAPM: Ke = Rf + β × (ERP_mature + CRP)
  const costOfEquity = calculateCostOfEquityEgypt(beta);

  // Cost of Debt: Interest Expense / Total Debt
  const totalDebt = latest.longTermDebt + latest.shortTermDebt;
  const costOfDebt = safeDivide(latest.interestExpense, totalDebt, 0.10);

  // WACC calculation using Egypt-specific parameters
  const totalCapital = latest.totalEquity + totalDebt;
  const equityWeight = safeDivide(latest.totalEquity, totalCapital, 0.5);
  const debtWeight = safeDivide(totalDebt, totalCapital, 0.5);
  const wacc = calculateWACC(costOfEquity, costOfDebt, equityWeight, debtWeight);

  // =============================================
  // Profitability Ratios
  // =============================================

  const roe = safeDivide(latest.netIncome, latest.totalEquity, 0);
  const roa = safeDivide(latest.netIncome, latest.totalAssets, 0);

  // ROIC = EBIT * (1-T) / (Total Equity + Total Debt)
  const investedCapital = latest.totalEquity + totalDebt;
  const nopat = latest.operatingIncome * (1 - latest.taxRate);
  const roic = safeDivide(nopat, investedCapital, 0);
  const roicDescription = roic > costOfEquity
    ? 'Value-creating: ROIC exceeds cost of equity'
    : roic > wacc
    ? 'Marginally value-creating: ROIC exceeds WACC but not cost of equity'
    : 'Value-destroying: ROIC below WACC';

  // =============================================
  // Growth Metrics
  // =============================================

  let epsGrowth = 0;
  let revenueCAGR = 0;
  let netIncomeCAGR = 0;

  if (sorted.length >= 2) {
    const prevYear = sorted[1];
    
    // EPS Growth
    epsGrowth = safeDivide(latest.eps - prevYear.eps, Math.abs(prevYear.eps), 0);

    // Revenue CAGR: ((Revenue_n / Revenue_0)^(1/n)) - 1
    const years = latest.year - earliest.year;
    if (years > 0 && earliest.revenue > 0) {
      revenueCAGR = Math.pow(latest.revenue / earliest.revenue, 1 / years) - 1;
    }

    // Net Income CAGR
    if (years > 0 && earliest.netIncome > 0) {
      netIncomeCAGR = Math.pow(latest.netIncome / earliest.netIncome, 1 / years) - 1;
    }
  }

  // =============================================
  // Leverage Ratios
  // =============================================

  const debtToEquity = safeDivide(totalDebt, latest.totalEquity, 0);
  const debtToAssets = safeDivide(totalDebt, latest.totalAssets, 0);
  const interestCoverage = safeDivide(latest.operatingIncome, latest.interestExpense, 0);
  const equityMultiplier = safeDivide(latest.totalAssets, latest.totalEquity, 1);

  // =============================================
  // Margin Analysis
  // =============================================

  const grossMargin = safeDivide(latest.grossProfit, latest.revenue, 0);
  const operatingMargin = safeDivide(latest.operatingIncome, latest.revenue, 0);
  const netMargin = safeDivide(latest.netIncome, latest.revenue, 0);
  const ebitdaMargin = safeDivide(latest.ebitda, latest.revenue, 0);

  // =============================================
  // Efficiency Ratios
  // =============================================

  const assetTurnover = safeDivide(latest.revenue, latest.totalAssets, 0);
  // Approximations for receivables/payables turnover
  const receivablesTurnover = safeDivide(latest.revenue, latest.currentAssets * 0.3, 0);
  const payablesTurnover = safeDivide(latest.costOfRevenue, latest.currentLiabilities * 0.4, 0);

  // =============================================
  // Liquidity Ratios
  // =============================================

  const currentRatio = safeDivide(latest.currentAssets, latest.currentLiabilities, 0);
  const quickRatio = safeDivide(
    latest.currentAssets - (latest.currentAssets * 0.2), // Approx inventory
    latest.currentLiabilities,
    0
  );

  // =============================================
  // Valuation Metrics
  // =============================================

  const peRatio = safeDivide(currentPrice, latest.eps, 0);
  const bookValuePerShare = safeDivide(latest.totalEquity, sharesOutstanding, 0);
  const pbRatio = safeDivide(currentPrice, bookValuePerShare, 0);
  
  const netDebt = totalDebt - latest.cash;
  const ev = marketCap + netDebt;
  const evEbitda = safeDivide(ev, latest.ebitda, 0);
  
  const fcfPerShare = safeDivide(latest.freeCashFlow, sharesOutstanding, 0);
  const priceToFCF = safeDivide(currentPrice, fcfPerShare, 0);
  
  const dividendPayoutRatio = safeDivide(latest.dividendsPerShare * sharesOutstanding, latest.netIncome, 0);

  // =============================================
  // Additional Metrics
  // =============================================

  const fcffYield = safeDivide(latest.operatingCashFlow - latest.capitalExpenditure, marketCap, 0);
  const fcfeYield = safeDivide(latest.freeCashFlow, marketCap, 0);
  const earningsQuality = safeDivide(latest.operatingCashFlow, latest.netIncome, 0);

  return {
    wacc: parseFloat(wacc.toFixed(4)),
    costOfEquity: parseFloat(costOfEquity.toFixed(4)),
    costOfDebt: parseFloat(costOfDebt.toFixed(4)),
    debtToValue: parseFloat(debtWeight.toFixed(4)),
    equityToValue: parseFloat(equityWeight.toFixed(4)),

    roe: parseFloat(roe.toFixed(4)),
    roa: parseFloat(roa.toFixed(4)),
    roic: parseFloat(roic.toFixed(4)),
    roicDescription,

    epsGrowth: parseFloat(epsGrowth.toFixed(4)),
    revenueCAGR: parseFloat(revenueCAGR.toFixed(4)),
    netIncomeCAGR: parseFloat(netIncomeCAGR.toFixed(4)),

    debtToEquity: parseFloat(debtToEquity.toFixed(4)),
    debtToAssets: parseFloat(debtToAssets.toFixed(4)),
    interestCoverage: parseFloat(interestCoverage.toFixed(4)),
    equityMultiplier: parseFloat(equityMultiplier.toFixed(4)),

    grossMargin: parseFloat(grossMargin.toFixed(4)),
    operatingMargin: parseFloat(operatingMargin.toFixed(4)),
    netMargin: parseFloat(netMargin.toFixed(4)),
    ebitdaMargin: parseFloat(ebitdaMargin.toFixed(4)),

    assetTurnover: parseFloat(assetTurnover.toFixed(4)),
    receivablesTurnover: parseFloat(receivablesTurnover.toFixed(4)),
    payablesTurnover: parseFloat(payablesTurnover.toFixed(4)),

    currentRatio: parseFloat(currentRatio.toFixed(4)),
    quickRatio: parseFloat(quickRatio.toFixed(4)),

    peRatio: parseFloat(peRatio.toFixed(2)),
    pbRatio: parseFloat(pbRatio.toFixed(2)),
    evEbitda: parseFloat(evEbitda.toFixed(2)),
    priceToFCF: parseFloat(priceToFCF.toFixed(2)),
    dividendPayoutRatio: parseFloat(dividendPayoutRatio.toFixed(4)),

    fcffYield: parseFloat(fcffYield.toFixed(4)),
    fcfeYield: parseFloat(fcfeYield.toFixed(4)),
    earningsQuality: parseFloat(earningsQuality.toFixed(4)),

    riskFreeRate: EGYPT_MARKET_PARAMS.riskFreeRate,
    marketRiskPremium: EGYPT_MARKET_PARAMS.totalEquityRiskPremium,
    beta,
  };
}

function getEmptyMetrics(): MetricsResult {
  return {
    wacc: 0, costOfEquity: 0, costOfDebt: 0, debtToValue: 0, equityToValue: 0,
    roe: 0, roa: 0, roic: 0, roicDescription: 'No data available',
    epsGrowth: 0, revenueCAGR: 0, netIncomeCAGR: 0,
    debtToEquity: 0, debtToAssets: 0, interestCoverage: 0, equityMultiplier: 0,
    grossMargin: 0, operatingMargin: 0, netMargin: 0, ebitdaMargin: 0,
    assetTurnover: 0, receivablesTurnover: 0, payablesTurnover: 0,
    currentRatio: 0, quickRatio: 0,
    peRatio: 0, pbRatio: 0, evEbitda: 0, priceToFCF: 0, dividendPayoutRatio: 0,
    fcffYield: 0, fcfeYield: 0, earningsQuality: 0,
    riskFreeRate: EGYPT_MARKET_PARAMS.riskFreeRate, marketRiskPremium: EGYPT_MARKET_PARAMS.totalEquityRiskPremium, beta: 1.0,
  };
}
