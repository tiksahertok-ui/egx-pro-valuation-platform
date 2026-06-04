export interface EgyptMarketParams {
  riskFreeRate: number           // CBE overnight deposit rate or 1Y T-bill yield
  baseEquityRiskPremium: number  // Damodaran mature market ERP (US base ~4.5%)
  countryRiskPremium: number     // Egypt CRP from Damodaran's country risk table
  totalEquityRiskPremium: number // baseERP + CRP
  corporateTaxRate: number       // Egypt standard corporate tax rate
  inflationRateEGP: number       // CBE medium-term inflation target
  inflationRateUSD: number       // US Fed target inflation
  usdEgpRate: number             // Current USD/EGP spot rate
  lastUpdated: string            // ISO date string
}

// Default values — update quarterly from CBE and Damodaran sources
export const EGYPT_MARKET_PARAMS: EgyptMarketParams = {
  riskFreeRate: 0.275,           // ~27.5% (CBE 1Y T-bill as of 2024-2025)
  baseEquityRiskPremium: 0.045,  // Damodaran mature market ERP
  countryRiskPremium: 0.085,     // Egypt CRP (Damodaran Jan 2025 ~8.5%)
  totalEquityRiskPremium: 0.130, // 4.5% + 8.5% = 13.0%
  corporateTaxRate: 0.225,       // Egypt standard 22.5%
  inflationRateEGP: 0.25,        // CBE medium-term target corridor
  inflationRateUSD: 0.025,       // US Fed 2% target
  usdEgpRate: 48.5,              // Update to current spot rate
  lastUpdated: '2025-01-01',
}
