/**
 * Real Estate NAV (Net Asset Value) Model
 * Primary valuation model for real estate and construction companies.
 * Calculates fair value based on net assets per share with adjustments.
 */

export interface NAVStockData {
  totalAssets: number;
  totalDebt: number;
  cashEquivalents: number;
  minorityInterests: number;
  sharesOutstanding: number;
  price: number;
  roe: number;
  totalEquity: number;
}

export interface NAVResult {
  model: string;
  modelName: string;
  fairValue: number;
  upsideDownside: number;
  confidence: number;
  assumptions: Record<string, number | string>;
  verdict: 'undervalued' | 'fair' | 'overvalued';
  terminalGrowthCapped: boolean;
}

function safeDivide(a: number, b: number, fallback: number = 0): number {
  if (!b || !isFinite(b) || b === 0) return fallback;
  const result = a / b;
  return isFinite(result) ? result : fallback;
}

export function calcNAV(stock: NAVStockData): NAVResult {
  const grossAssets = stock.totalAssets;
  const netDebt = stock.totalDebt - stock.cashEquivalents;
  const minorityInterests = stock.minorityInterests ?? 0;
  const nav = grossAssets - netDebt - minorityInterests;
  const navPerShare = safeDivide(nav, stock.sharesOutstanding);

  // Apply ROE-based adjustment premium/discount
  // If ROE > cost of equity (~27%), apply premium; otherwise discount
  const costOfEquity = 0.27;
  let adjustmentFactor = 1.0;
  if (stock.roe > costOfEquity) {
    adjustmentFactor = 1 + (stock.roe - costOfEquity) * 1.5;
  } else {
    adjustmentFactor = 1 + (stock.roe - costOfEquity) * 0.8;
  }
  adjustmentFactor = Math.max(0.5, Math.min(adjustmentFactor, 2.0));

  const fairValue = navPerShare * adjustmentFactor;
  const upside = safeDivide(fairValue - stock.price, stock.price);

  return {
    model: 'nav',
    modelName: 'Real Estate NAV',
    fairValue: Math.round(fairValue * 100) / 100,
    upsideDownside: Math.round(upside * 10000) / 100,
    confidence: stock.totalAssets > 0 && stock.sharesOutstanding > 0 ? 0.75 : 0.2,
    assumptions: {
      grossAssets: Math.round(grossAssets).toLocaleString(),
      netDebt: Math.round(netDebt).toLocaleString(),
      minorityInterests: Math.round(minorityInterests).toLocaleString(),
      navPerShare: navPerShare.toFixed(2),
      adjustmentFactor: adjustmentFactor.toFixed(2),
      roe: (stock.roe * 100).toFixed(1) + '%',
    },
    verdict: upside > 0.15 ? 'undervalued' : upside < -0.15 ? 'overvalued' : 'fair',
    terminalGrowthCapped: false,
  };
}
