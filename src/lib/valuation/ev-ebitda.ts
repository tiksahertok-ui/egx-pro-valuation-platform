// EV/EBITDA Valuation Model
// EV = Market Cap + Net Debt
// Apply sector EV/EBITDA multiple to stock's EBITDA
// Subtract net debt to get equity value, divide by shares for per-share value

import { FinancialDataInput, ValuationOutput } from './dcf-fcff';

export interface EVEBITDAParams {
  financials: FinancialDataInput;
  currentPrice: number;
  marketCap: number;
  sectorAvgEVEBITDA: number;
  qualityPremium?: number;
}

/**
 * Calculate quality premium based on fundamentals
 */
function calculateQualityPremium(financials: FinancialDataInput): number {
  let premium = 0;

  // EBITDA margin premium
  const ebitdaMargin = financials.revenue > 0 ? financials.ebitda / financials.revenue : 0;
  if (ebitdaMargin > 0.25) premium += 0.05;
  else if (ebitdaMargin < 0.10) premium -= 0.05;

  // Revenue growth estimate
  const revenueGrowthEstimate = 0.12; // Default estimate
  if (revenueGrowthEstimate > 0.15) premium += 0.05;

  // Leverage discount
  const totalDebt = financials.longTermDebt + financials.shortTermDebt;
  const debtToEquity = financials.totalEquity > 0 ? totalDebt / financials.totalEquity : 2;
  if (debtToEquity > 2.0) premium -= 0.05;
  else if (debtToEquity < 0.5) premium += 0.03;

  return Math.max(-0.15, Math.min(0.20, premium));
}

export function evEbitdaValuation(params: EVEBITDAParams): ValuationOutput {
  const {
    financials,
    currentPrice,
    marketCap,
    sectorAvgEVEBITDA,
    qualityPremium: providedPremium,
  } = params;

  const premium = providedPremium ?? calculateQualityPremium(financials);

  // Calculate Net Debt
  const totalDebt = financials.longTermDebt + financials.shortTermDebt;
  const netDebt = totalDebt - financials.cash;

  // Current EBITDA
  const ebitda = financials.ebitda;

  if (ebitda <= 0) {
    return {
      model: 'EV/EBITDA',
      fairValue: 0,
      bearCase: 0,
      baseCase: 0,
      bullCase: 0,
      upside: currentPrice > 0 ? -100 : 0,
      confidence: 0.1,
      assumptions: 'EV/EBITDA not applicable: Negative EBITDA.',
    };
  }

  // Calculate implied multiples
  const baseMultiple = sectorAvgEVEBITDA * (1 + premium);
  const bearMultiple = sectorAvgEVEBITDA * 0.75 * (1 + premium * 0.5);
  const bullMultiple = sectorAvgEVEBITDA * 1.25 * (1 + premium * 1.2);

  // Calculate enterprise values
  const bearEV = bearMultiple * ebitda;
  const baseEV = baseMultiple * ebitda;
  const bullEV = bullMultiple * ebitda;

  // Subtract net debt to get equity value
  const bearEquity = bearEV - netDebt;
  const baseEquity = baseEV - netDebt;
  const bullEquity = bullEV - netDebt;

  // Per share value
  const bearCase = financials.sharesOutstanding > 0 ? Math.max(0, bearEquity / financials.sharesOutstanding) : 0;
  const baseCase = financials.sharesOutstanding > 0 ? Math.max(0, baseEquity / financials.sharesOutstanding) : 0;
  const bullCase = financials.sharesOutstanding > 0 ? Math.max(0, bullEquity / financials.sharesOutstanding) : 0;

  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = Math.max(0.15, Math.min(0.85, 1 - spread * 0.2));

  // Calculate current EV/EBITDA for comparison
  const currentEV = marketCap + netDebt;
  const currentEVEBITDA = ebitda > 0 ? currentEV / ebitda : 0;

  const premiumStr = premium >= 0 ? `+${(premium * 100).toFixed(1)}%` : `${(premium * 100).toFixed(1)}%`;

  const assumptions = `EV/EBITDA Model: Sector avg ${sectorAvgEVEBITDA.toFixed(1)}x, Quality premium ${premiumStr}. Bear: ${(bearMultiple).toFixed(1)}x, Base: ${(baseMultiple).toFixed(1)}x, Bull: ${(bullMultiple).toFixed(1)}x. EBITDA EGP ${(ebitda / 1e9).toFixed(1)}B, Net Debt EGP ${(netDebt / 1e9).toFixed(1)}B. Current EV/EBITDA: ${currentEVEBITDA.toFixed(1)}x.`;

  return {
    model: 'EV/EBITDA',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}
