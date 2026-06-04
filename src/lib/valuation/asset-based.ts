// Asset-Based Valuation
// NAV = Total Assets - Total Liabilities (adjusted)
// Adjust assets for market values (real estate, investments at market)
// Apply discount for illiquid assets
// Bear: 20% discount, Base: 10% discount, Bull: 5% discount

import { FinancialDataInput, ValuationOutput } from './dcf-fcff';

export interface AssetBasedParams {
  financials: FinancialDataInput;
  currentPrice: number;
  sector: string;
  // Adjustment factors for different asset types
  realEstateAdjustment?: number; // Premium for real estate assets
  investmentAdjustment?: number; // Premium for investment securities
  illiquidDiscount?: number; // Discount for illiquid/hard-to-value assets
}

/**
 * Sector-specific adjustment factors
 */
function getSectorAdjustments(sector: string): {
  realEstateAdj: number;
  investmentAdj: number;
  illiquidDiscount: number;
  cashPremium: number;
} {
  switch (sector) {
    case 'Real Estate':
      return { realEstateAdj: 1.30, investmentAdj: 1.10, illiquidDiscount: 0.15, cashPremium: 1.0 };
    case 'Banking':
      return { realEstateAdj: 1.10, investmentAdj: 1.05, illiquidDiscount: 0.05, cashPremium: 1.0 };
    case 'Financial Services':
      return { realEstateAdj: 1.10, investmentAdj: 1.05, illiquidDiscount: 0.08, cashPremium: 1.0 };
    case 'Energy':
      return { realEstateAdj: 1.05, investmentAdj: 1.0, illiquidDiscount: 0.20, cashPremium: 1.0 };
    case 'Construction':
      return { realEstateAdj: 1.15, investmentAdj: 1.0, illiquidDiscount: 0.15, cashPremium: 1.0 };
    case 'Chemicals':
      return { realEstateAdj: 1.05, investmentAdj: 1.0, illiquidDiscount: 0.12, cashPremium: 1.0 };
    case 'Technology':
      return { realEstateAdj: 1.0, investmentAdj: 1.15, illiquidDiscount: 0.10, cashPremium: 1.0 };
    default:
      return { realEstateAdj: 1.05, investmentAdj: 1.0, illiquidDiscount: 0.10, cashPremium: 1.0 };
  }
}

export function assetBasedValuation(params: AssetBasedParams): ValuationOutput {
  const {
    financials,
    currentPrice,
    sector,
    realEstateAdjustment,
    investmentAdjustment,
    illiquidDiscount,
  } = params;

  const sectorAdj = getSectorAdjustments(sector);

  // Apply adjustments (user-provided overrides sector defaults)
  const realEstateAdj = realEstateAdjustment ?? sectorAdj.realEstateAdj;
  const investmentAdj = investmentAdjustment ?? sectorAdj.investmentAdj;
  const illiqDiscount = illiquidDiscount ?? sectorAdj.illiquidDiscount;

  // Break down total assets into components for adjustment
  const cash = financials.cash;
  const currentAssets = financials.currentAssets;
  const nonCurrentAssets = financials.totalAssets - financials.currentAssets;

  // Estimate composition of non-current assets
  // Real estate portion (typically 30-50% of non-current for RE companies)
  const realEstatePortion = sector === 'Real Estate' ? nonCurrentAssets * 0.60
    : sector === 'Construction' ? nonCurrentAssets * 0.35
    : sector === 'Banking' ? nonCurrentAssets * 0.15
    : nonCurrentAssets * 0.20;

  const investmentPortion = sector === 'Banking' || sector === 'Financial Services'
    ? nonCurrentAssets * 0.30
    : nonCurrentAssets * 0.10;

  const otherAssets = nonCurrentAssets - realEstatePortion - investmentPortion;

  // Adjust assets
  const adjustedCash = cash * sectorAdj.cashPremium;
  const adjustedCurrentAssets = (currentAssets - cash); // Other current assets at book
  const adjustedRealEstate = realEstatePortion * realEstateAdj;
  const adjustedInvestments = investmentPortion * investmentAdj;
  const adjustedOtherAssets = otherAssets * (1 - illiqDiscount); // Apply illiquidity discount

  const adjustedTotalAssets = adjustedCash + adjustedCurrentAssets + adjustedRealEstate + adjustedInvestments + adjustedOtherAssets;

  // Liabilities are typically kept at book value (conservative)
  const totalLiabilities = financials.totalLiabilities;

  // Adjusted NAV
  const adjustedNAV = adjustedTotalAssets - totalLiabilities;

  // Per share NAV
  const navPerShare = financials.sharesOutstanding > 0
    ? adjustedNAV / financials.sharesOutstanding
    : 0;

  // Apply scenario discounts
  const bearDiscount = 0.20;
  const baseDiscount = 0.10;
  const bullDiscount = 0.05;

  const bearCase = navPerShare * (1 - bearDiscount);
  const baseCase = navPerShare * (1 - baseDiscount);
  const bullCase = navPerShare * (1 - bullDiscount);

  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  // Confidence: higher for asset-heavy businesses, lower for service/tech
  const assetIntensity = financials.totalAssets > 0 ? (adjustedNAV / financials.totalAssets) : 0;
  const confidence = Math.max(0.15, Math.min(0.85, assetIntensity * 0.8 + 0.3));

  const bookNAV = financials.totalAssets - financials.totalLiabilities;
  const premiumToBook = bookNAV > 0 ? (adjustedNAV / bookNAV - 1) * 100 : 0;

  const assumptions = `Asset-Based NAV: Adjusted NAV EGP ${(adjustedNAV / 1e9).toFixed(1)}B vs Book NAV EGP ${(bookNAV / 1e9).toFixed(1)}B (${premiumToBook >= 0 ? '+' : ''}${premiumToBook.toFixed(1)}% adjustment). Real estate adj ${(realEstateAdj * 100).toFixed(0)}%, Investment adj ${(investmentAdj * 100).toFixed(0)}%, Illiquid discount ${(illiqDiscount * 100).toFixed(0)}%. Bear: -20%, Base: -10%, Bull: -5% discount. NAV/share EGP ${navPerShare.toFixed(2)}.`;

  return {
    model: 'Asset-Based',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}
