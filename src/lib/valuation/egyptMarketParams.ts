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
  riskFreeRate: 0.19,            // CBE overnight rate cut to 19% as of June 2026
  baseEquityRiskPremium: 0.045,  // Damodaran mature market ERP (US base ~4.5%)
  countryRiskPremium: 0.085,     // Egypt CRP from Damodaran's country risk table
  totalEquityRiskPremium: 0.13,  // 4.5% + 8.5% = 13.0%
  corporateTaxRate: 0.225,       // Egypt standard corporate tax rate 22.5%
  inflationRateEGP: 0.149,       // 14.9% urban inflation April 2026
  inflationRateUSD: 0.025,       // US Fed 2% target
  usdEgpRate: 51.82,             // Current USD/EGP spot rate
  lastUpdated: '2026-06-01',
}
