// Relative Valuation (P/E and P/B)
// Apply sector average P/E and P/B to stock's EPS and Book Value per Share
// Apply premium/discount based on quality metrics
// Bear: sector avg * 0.8, Base: sector avg, Bull: sector avg * 1.2

import { ValuationOutput } from './dcf-fcff';

export interface RelativeValuationParams {
  currentPrice: number;
  eps: number;
  bookValuePerShare: number;
  peRatio: number;
  pbRatio: number;
  roe: number;
  revenueGrowth: number;
  sectorAvgPE: number;
  sectorAvgPB: number;
  debtToEquity: number;
}

/**
 * Calculate quality premium/discount
 * Higher ROE, higher growth, lower debt = premium
 */
function calculateQualityPremium(roe: number, revenueGrowth: number, debtToEquity: number): number {
  // Base premium starts at 0
  let premium = 0;

  // ROE premium: above 15% ROE adds premium
  if (roe > 0.15) premium += (roe - 0.15) * 0.5;
  else if (roe < 0.08) premium -= (0.08 - roe) * 0.5;

  // Growth premium: above 10% growth adds premium
  if (revenueGrowth > 0.10) premium += (revenueGrowth - 0.10) * 0.3;
  else if (revenueGrowth < 0.05) premium -= (0.05 - revenueGrowth) * 0.3;

  // Debt discount: above 1.0 D/E adds discount
  if (debtToEquity > 1.0) premium -= (debtToEquity - 1.0) * 0.05;
  else if (debtToEquity < 0.5) premium += 0.05;

  // Cap premium between -20% and +30%
  return Math.max(-0.20, Math.min(0.30, premium));
}

/**
 * P/E Relative Valuation
 * Apply sector average P/E to stock's EPS with quality premium/discount
 */
export function peRelativeValuation(params: RelativeValuationParams): ValuationOutput {
  const {
    currentPrice,
    eps,
    roe,
    revenueGrowth,
    sectorAvgPE,
    debtToEquity,
  } = params;

  const qualityPremium = calculateQualityPremium(roe, revenueGrowth, debtToEquity);

  // P/E based valuation
  const basePE = sectorAvgPE * (1 + qualityPremium);
  const bearPE = sectorAvgPE * 0.8 * (1 + qualityPremium * 0.5);
  const bullPE = sectorAvgPE * 1.2 * (1 + qualityPremium * 1.3);

  const bearCase = eps > 0 ? bearPE * eps : 0;
  const baseCase = eps > 0 ? basePE * eps : 0;
  const bullCase = eps > 0 ? bullPE * eps : 0;

  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = Math.max(0.15, Math.min(0.85, 1 - spread * 0.2));

  const premiumStr = qualityPremium >= 0 ? `+${(qualityPremium * 100).toFixed(1)}%` : `${(qualityPremium * 100).toFixed(1)}%`;

  const assumptions = `P/E Relative: Sector avg P/E ${sectorAvgPE.toFixed(1)}x. Quality premium: ${premiumStr} (ROE ${(roe * 100).toFixed(1)}%, Growth ${(revenueGrowth * 100).toFixed(1)}%, D/E ${debtToEquity.toFixed(2)}). Bear: 80% sector avg. Bull: 120% sector avg.`;

  return {
    model: 'P/E Relative',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}

/**
 * P/B Relative Valuation
 * Apply sector average P/B to stock's Book Value per Share with quality premium/discount
 */
export function pbRelativeValuation(params: RelativeValuationParams): ValuationOutput {
  const {
    currentPrice,
    bookValuePerShare,
    roe,
    revenueGrowth,
    sectorAvgPB,
    debtToEquity,
  } = params;

  const qualityPremium = calculateQualityPremium(roe, revenueGrowth, debtToEquity);

  // P/B based valuation
  const basePB = sectorAvgPB * (1 + qualityPremium);
  const bearPB = sectorAvgPB * 0.8 * (1 + qualityPremium * 0.5);
  const bullPB = sectorAvgPB * 1.2 * (1 + qualityPremium * 1.3);

  const bearCase = bookValuePerShare > 0 ? bearPB * bookValuePerShare : 0;
  const baseCase = bookValuePerShare > 0 ? basePB * bookValuePerShare : 0;
  const bullCase = bookValuePerShare > 0 ? bullPB * bookValuePerShare : 0;

  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = Math.max(0.15, Math.min(0.85, 1 - spread * 0.2));

  const premiumStr = qualityPremium >= 0 ? `+${(qualityPremium * 100).toFixed(1)}%` : `${(qualityPremium * 100).toFixed(1)}%`;

  const assumptions = `P/B Relative: Sector avg P/B ${sectorAvgPB.toFixed(1)}x. Quality premium: ${premiumStr} (ROE ${(roe * 100).toFixed(1)}%, Growth ${(revenueGrowth * 100).toFixed(1)}%, D/E ${debtToEquity.toFixed(2)}). Bear: 80% sector avg. Bull: 120% sector avg.`;

  return {
    model: 'P/B Relative',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}

/**
 * Combined Relative Valuation (P/E and P/B)
 * Legacy function that combines P/E (60%) and P/B (40%) valuations
 */
export function relativeValuation(params: RelativeValuationParams): ValuationOutput {
  const peResult = peRelativeValuation(params);
  const pbResult = pbRelativeValuation(params);

  // Combine P/E and P/B valuations (60% P/E, 40% P/B)
  const bearCase = peResult.bearCase * 0.6 + pbResult.bearCase * 0.4;
  const baseCase = peResult.baseCase * 0.6 + pbResult.baseCase * 0.4;
  const bullCase = peResult.bullCase * 0.6 + pbResult.bullCase * 0.4;

  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = params.currentPrice > 0 ? ((fairValue - params.currentPrice) / params.currentPrice) * 100 : 0;

  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = Math.max(0.15, Math.min(0.85, 1 - spread * 0.2));

  const qualityPremium = calculateQualityPremium(params.roe, params.revenueGrowth, params.debtToEquity);
  const premiumStr = qualityPremium >= 0 ? `+${(qualityPremium * 100).toFixed(1)}%` : `${(qualityPremium * 100).toFixed(1)}%`;

  const assumptions = `Relative Valuation (P/E + P/B): Sector avg P/E ${params.sectorAvgPE.toFixed(1)}x, P/B ${params.sectorAvgPB.toFixed(1)}x. Quality premium: ${premiumStr} (ROE ${(params.roe * 100).toFixed(1)}%, Growth ${(params.revenueGrowth * 100).toFixed(1)}%, D/E ${params.debtToEquity.toFixed(2)}). Bear: 80% sector avg. Bull: 120% sector avg. Weight: 60% P/E, 40% P/B.`;

  return {
    model: 'Relative Valuation',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}
