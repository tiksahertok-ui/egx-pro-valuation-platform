/**
 * EGX Pro - Hardcoded Financial Data for Major EGX Stocks
 * Approximate 2024/2025 data based on publicly available information.
 * Used as fallback when Yahoo Finance or Supabase data is unavailable.
 *
 * All monetary values in EGP (Egyptian Pounds)
 * Market cap in billions (1e9) of EGP
 * Dividend yield as decimal (0.05 = 5%)
 * ROE as decimal (0.20 = 20%)
 */

export interface EGXFinancialData {
  ticker: string;
  name: string;
  sector: string;
  price: number;           // Current approximate price in EGP
  eps: number;             // Earnings per share
  bookValuePerShare: number; // BVPS
  peRatio: number;         // Price-to-Earnings
  pbRatio: number;         // Price-to-Book
  marketCap: number;       // In EGP (not billions)
  dividendYield: number;   // As decimal (0.05 = 5%)
  roe: number;             // Return on Equity as decimal
  roa: number;             // Return on Assets as decimal
  revenue: number;         // Annual revenue in EGP
  netIncome: number;       // Annual net income in EGP
  totalAssets: number;     // Total assets in EGP
  totalEquity: number;     // Total equity in EGP
  totalDebt: number;       // Total debt in EGP
  debtToEquity: number;    // Debt-to-equity ratio
  grossMargin: number;     // As decimal
  operatingMargin: number; // As decimal
  profitMargin: number;    // As decimal
  beta: number;            // Beta coefficient
  sharesOutstanding: number; // Shares outstanding
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: number;       // Average daily volume
  evToEbitda: number;      // EV/EBITDA
  operatingCashflow: number;
  freeCashflow: number;
  revenueGrowth: number;   // As decimal
  earningsGrowth: number;  // As decimal
}

// Helper to create financial data entries concisely
function f(
  ticker: string,
  name: string,
  sector: string,
  price: number,
  eps: number,
  bvps: number,
  pe: number,
  pb: number,
  marketCapB: number, // in billions
  divYield: number,   // as decimal
  roe: number,        // as decimal
  roa: number,
  revenueB: number,
  netIncomeB: number,
  totalAssetsB: number,
  totalEquityB: number,
  totalDebtB: number,
  de: number,
  gm: number,
  om: number,
  pm: number,
  beta: number,
  evEbitda: number,
  revGrowth: number,
  earnGrowth: number,
): EGXFinancialData {
  const B = 1e9;
  return {
    ticker,
    name,
    sector,
    price,
    eps,
    bookValuePerShare: bvps,
    peRatio: pe,
    pbRatio: pb,
    marketCap: marketCapB * B,
    dividendYield: divYield,
    roe,
    roa,
    revenue: revenueB * B,
    netIncome: netIncomeB * B,
    totalAssets: totalAssetsB * B,
    totalEquity: totalEquityB * B,
    totalDebt: totalDebtB * B,
    debtToEquity: de,
    grossMargin: gm,
    operatingMargin: om,
    profitMargin: pm,
    beta,
    sharesOutstanding: Math.round((marketCapB * B) / price),
    fiftyTwoWeekHigh: price * 1.25,
    fiftyTwoWeekLow: price * 0.75,
    avgVolume: Math.round((marketCapB * B) / price * 0.003),
    evToEbitda: evEbitda,
    operatingCashflow: netIncomeB * B * 1.2,
    freeCashflow: netIncomeB * B * 0.7,
    revenueGrowth: revGrowth,
    earningsGrowth: earnGrowth,
  };
}

export const EGX_FINANCIAL_DATA: EGXFinancialData[] = [
  // === BANKING ===
  f('COMI', 'Commercial International Bank', 'Banking',
    70, 11.5, 58, 6.1, 1.2, 159, 0.05, 0.20, 0.032, 45, 26.5, 830, 130, 180, 1.38, 0.55, 0.42, 0.35, 0.8, 5.5, 0.22, 0.18),
  f('MISR', 'Banque Misr', 'Banking',
    5, 1.67, 10, 3.0, 0.5, 25, 0.07, 0.17, 0.018, 30, 8.3, 460, 50, 120, 2.4, 0.48, 0.32, 0.28, 0.6, 4.0, 0.15, 0.12),
  f('NBEA', 'National Bank of Egypt', 'Banking',
    50, 16.67, 83.3, 3.0, 0.6, 50, 0.06, 0.20, 0.025, 55, 10, 400, 52, 100, 1.92, 0.52, 0.38, 0.30, 0.7, 4.5, 0.18, 0.15),
  f('CIEB', 'Credit Agricole Egypt', 'Banking',
    5, 1.25, 7.14, 4.0, 0.7, 8, 0.06, 0.17, 0.022, 6, 2, 90, 12, 20, 1.67, 0.50, 0.35, 0.28, 0.65, 4.2, 0.12, 0.10),
  f('BTFH', 'Beltone Financial Holding', 'Banking',
    15, 1.25, 7.5, 12, 2.0, 6, 0.02, 0.17, 0.015, 3, 0.5, 40, 3, 15, 5.0, 0.42, 0.28, 0.15, 1.1, 10, 0.25, 0.20),
  f('SAUD', 'Al Baraka Bank Egypt', 'Banking',
    2, 0.4, 4, 5.0, 0.5, 8, 0.04, 0.10, 0.012, 2.5, 0.8, 65, 8, 15, 1.88, 0.40, 0.25, 0.18, 0.55, 5.5, 0.10, 0.08),
  f('ADIB', 'Abu Dhabi Islamic Bank Egypt', 'Banking',
    3, 0.6, 3.75, 5.0, 0.8, 18, 0.03, 0.16, 0.020, 5, 3, 150, 18, 30, 1.67, 0.45, 0.30, 0.25, 0.7, 5.0, 0.15, 0.12),
  f('FAIT', 'Faisal Islamic Bank of Egypt', 'Banking',
    4, 1, 8, 4.0, 0.5, 15, 0.05, 0.12, 0.015, 4, 1.8, 120, 15, 25, 1.67, 0.42, 0.28, 0.22, 0.6, 4.8, 0.12, 0.10),
  f('QNBA', 'Qatar National Bank Alahli', 'Banking',
    8, 2, 12, 4.0, 0.67, 12, 0.05, 0.17, 0.022, 6, 2.5, 110, 15, 22, 1.47, 0.50, 0.35, 0.28, 0.65, 4.5, 0.14, 0.12),
  f('AUBK', 'Bank of Alexandria', 'Banking',
    12, 2.4, 14, 5.0, 0.86, 10, 0.04, 0.17, 0.020, 4, 1.4, 70, 8, 18, 2.25, 0.48, 0.32, 0.25, 0.7, 4.8, 0.13, 0.10),

  // === REAL ESTATE ===
  f('TMGH', 'Talaat Moustafa Group', 'Real Estate',
    5.5, 0.9, 5.5, 6.1, 1.0, 50, 0.04, 0.16, 0.085, 15, 8.2, 60, 50, 10, 0.20, 0.38, 0.28, 0.22, 0.9, 6.0, 0.20, 0.15),
  f('PHDC', 'Palm Hills Development', 'Real Estate',
    5, 0.71, 5.5, 7.0, 0.91, 22, 0.02, 0.13, 0.045, 8, 3.1, 50, 24, 12, 0.50, 0.35, 0.22, 0.15, 1.05, 7.5, 0.18, 0.12),
  f('MNHD', 'Madinet Nasr for Housing', 'Real Estate',
    8, 1.33, 10, 6.0, 0.8, 16, 0.03, 0.13, 0.060, 5, 2.1, 35, 16, 8, 0.50, 0.32, 0.25, 0.18, 0.85, 5.5, 0.15, 0.10),
  f('OCDI', 'SODIC', 'Real Estate',
    35, 4.37, 29.17, 8.0, 1.2, 9, 0.02, 0.15, 0.060, 4, 1.4, 25, 10, 5, 0.50, 0.30, 0.20, 0.14, 0.9, 7.0, 0.12, 0.08),
  f('ORHD', 'Orascom Development Egypt', 'Real Estate',
    3, 0.37, 7.5, 8.1, 0.4, 4, 0.01, 0.05, 0.020, 2, 0.2, 20, 4, 2, 2.00, 0.28, 0.12, 0.05, 1.2, 12, 0.08, 0.05),
  f('HDBK', 'Housing & Development Bank', 'Real Estate',
    15, 3, 18.75, 5.0, 0.8, 10, 0.05, 0.16, 0.025, 3, 1.6, 65, 10, 15, 1.50, 0.45, 0.32, 0.25, 0.7, 4.5, 0.14, 0.12),
  f('HELI', 'Heliopolis Company for Housing', 'Real Estate',
    25, 3.5, 20, 7.1, 1.25, 8, 0.03, 0.12, 0.080, 3, 1, 15, 8, 3, 0.38, 0.30, 0.18, 0.12, 0.8, 8.0, 0.10, 0.08),

  // === FINANCIAL SERVICES ===
  f('HRHO', 'EFG Hermes Holding', 'Financial Services',
    7, 0.87, 7, 8.0, 1.0, 20, 0.03, 0.12, 0.040, 8, 2.5, 55, 20, 15, 0.75, 0.42, 0.28, 0.18, 1.0, 8.0, 0.15, 0.12),
  f('CIRA', 'CI Capital Holding', 'Financial Services',
    5, 1, 7.1, 5.0, 0.7, 7, 0.02, 0.14, 0.035, 3, 1, 30, 7, 8, 1.14, 0.38, 0.22, 0.14, 0.85, 5.5, 0.12, 0.10),
  f('BINV', 'B Investments Holding', 'Financial Services',
    5, 0.71, 6.25, 7.0, 0.8, 3, 0.01, 0.11, 0.030, 1, 0.4, 15, 4, 3, 1.33, 0.35, 0.20, 0.12, 0.9, 6.0, 0.10, 0.08),
  f('VALU', 'valU for Financial Technology', 'Financial Services',
    5, 0.25, 1.67, 20, 3.0, 10, 0.0, 0.15, 0.050, 2, 0.5, 10, 3, 2, 0.67, 0.45, 0.15, 0.08, 1.2, 15, 0.35, 0.30),

  // === TELECOMMUNICATIONS ===
  f('ETEL', 'Telecom Egypt', 'Telecommunications',
    30, 3.75, 25, 8.0, 1.2, 50, 0.07, 0.15, 0.055, 35, 6.3, 115, 42, 20, 0.48, 0.52, 0.22, 0.12, 0.75, 5.0, 0.10, 0.08),
  f('OTMT', 'Orascom Telecom Media', 'Telecommunications',
    1.5, 0.1, 1.88, 15, 0.8, 3, 0.0, 0.05, 0.025, 1, 0.15, 12, 3, 2, 1.50, 0.25, 0.08, 0.03, 1.3, 20, 0.05, 0.02),

  // === FOOD & BEVERAGES ===
  f('JUFO', 'Juhayna Food Industries', 'Food & Beverages',
    4, 0.5, 3.3, 8.0, 1.2, 5, 0.03, 0.15, 0.060, 7, 0.75, 13, 5, 3, 0.60, 0.35, 0.15, 0.10, 0.8, 6.0, 0.12, 0.10),
  f('EKRI', 'Edita Food Industries', 'Food & Beverages',
    20, 2.22, 10, 9.0, 2.0, 4, 0.04, 0.22, 0.100, 5, 0.45, 5, 2, 1, 0.50, 0.40, 0.18, 0.12, 0.7, 7.0, 0.10, 0.08),
  f('DOMT', 'Arabian Food Industries (Domty)', 'Food & Beverages',
    20, 2.86, 11.11, 7.0, 1.8, 4, 0.03, 0.25, 0.120, 5, 0.5, 4, 2, 0.5, 0.25, 0.35, 0.18, 0.12, 0.65, 5.5, 0.15, 0.12),
  f('BDCO', 'Bisco Misr', 'Food & Beverages',
    40, 5, 20, 8.0, 2.0, 3, 0.05, 0.25, 0.150, 1, 0.08, 0.6, 0.3, 0.2, 0.67, 0.38, 0.20, 0.15, 0.5, 5.0, 0.08, 0.05),
  f('HALW', 'Halwani Bros', 'Food & Beverages',
    18, 2, 10, 9.0, 1.8, 2.5, 0.03, 0.15, 0.080, 2, 0.2, 3, 1.5, 0.8, 0.53, 0.32, 0.15, 0.10, 0.6, 6.5, 0.08, 0.05),

  // === CONSTRUCTION & ENGINEERING ===
  f('ORAS', 'Orascom Construction', 'Construction & Engineering',
    700, 58, 388, 12.1, 1.8, 32, 0.03, 0.15, 0.050, 30, 2.7, 55, 18, 12, 0.67, 0.22, 0.12, 0.08, 1.1, 8.0, 0.15, 0.10),
  f('SWDY', 'Elsewedy Electric', 'Construction & Engineering',
    25, 3.1, 16.6, 8.1, 1.5, 55, 0.03, 0.19, 0.055, 80, 10.5, 140, 55, 35, 0.64, 0.28, 0.14, 0.09, 1.0, 6.5, 0.18, 0.15),
  f('ESRS', 'Ezz Steel', 'Construction & Engineering',
    25, 2.5, 20.8, 10.0, 1.2, 18, 0.02, 0.12, 0.035, 60, 1.8, 55, 15, 20, 1.33, 0.15, 0.05, 0.02, 1.2, 12, 0.10, 0.05),
  f('ALUM', 'Egyptian Aluminium Company', 'Construction & Engineering',
    75, 9.37, 50, 8.0, 1.5, 15, 0.04, 0.18, 0.080, 15, 1.9, 25, 10, 5, 0.50, 0.22, 0.12, 0.08, 0.9, 6.0, 0.12, 0.08),
  f('SKPC', 'Sidi Kerir Petrochemicals (SIDPEC)', 'Construction & Engineering',
    30, 5, 20, 6.0, 1.5, 30, 0.06, 0.25, 0.130, 15, 7.5, 58, 30, 10, 0.33, 0.35, 0.25, 0.20, 0.6, 4.5, 0.15, 0.12),

  // === ENERGY ===
  f('CCAP', 'Qalaa Holdings', 'Energy',
    5, 0.5, 8.3, 10.0, 0.6, 12, 0.0, 0.06, 0.020, 20, 0.6, 55, 10, 25, 2.50, 0.20, 0.05, 0.02, 1.3, 15, 0.12, 0.08),
  f('AMOC', 'Alexandria Mineral Oils', 'Energy',
    50, 10, 38.5, 5.0, 1.3, 10, 0.08, 0.26, 0.120, 8, 2.6, 22, 10, 5, 0.50, 0.28, 0.18, 0.15, 0.5, 3.5, 0.10, 0.08),
  f('TAQA', 'Taqa Arabia', 'Energy',
    8, 0.8, 5, 10.0, 1.6, 5, 0.02, 0.12, 0.050, 10, 0.6, 12, 5, 3, 0.60, 0.25, 0.10, 0.06, 0.85, 8.0, 0.18, 0.12),

  // === CHEMICALS & FERTILIZERS ===
  f('ABUK', 'Abu Qir Fertilizers', 'Chemicals & Fertilizers',
    45, 6.4, 30, 7.0, 1.5, 63, 0.05, 0.21, 0.100, 25, 13, 130, 62, 20, 0.32, 0.35, 0.28, 0.22, 0.6, 5.0, 0.15, 0.12),
  f('SPMD', 'Sidi Kerir Petrochemicals', 'Chemicals & Fertilizers',
    30, 5, 20, 6.0, 1.5, 30, 0.06, 0.25, 0.130, 15, 7.5, 58, 30, 10, 0.33, 0.35, 0.25, 0.20, 0.6, 4.5, 0.15, 0.12),
  f('KIMA', 'Egyptian Chemical Industries', 'Chemicals & Fertilizers',
    25, 3.57, 20.83, 7.0, 1.2, 7, 0.04, 0.17, 0.060, 5, 1, 18, 6, 4, 0.67, 0.28, 0.18, 0.12, 0.75, 5.5, 0.12, 0.08),

  // === TOBACCO ===
  f('EAST', 'Eastern Company for Tobacco', 'Tobacco',
    30, 5, 20, 6.0, 1.5, 30, 0.10, 0.25, 0.180, 10, 5, 28, 17, 5, 0.29, 0.42, 0.30, 0.25, 0.5, 4.0, 0.10, 0.08),

  // === TECHNOLOGY ===
  f('FWRY', 'Fawry for Banking Technology', 'Technology',
    7, 0.28, 1.4, 25.0, 5.0, 35, 0.0, 0.20, 0.080, 2.5, 0.4, 5, 2, 1, 0.50, 0.45, 0.18, 0.08, 1.1, 18, 0.30, 0.25),
  f('EFLS', 'E-Finance for Digital Investments', 'Technology',
    15, 1.25, 5, 12.0, 3.0, 12, 0.02, 0.25, 0.100, 3, 0.8, 8, 3, 2, 0.67, 0.42, 0.20, 0.10, 0.9, 10, 0.20, 0.15),
  f('RAYA', 'Raya Holding', 'Technology',
    10, 1.25, 6.67, 8.0, 1.5, 6, 0.02, 0.18, 0.060, 6, 1, 18, 6, 4, 0.67, 0.30, 0.15, 0.08, 0.9, 6.0, 0.15, 0.10),

  // === TOURISM ===
  f('OCH', 'Orascom Hotels and Development', 'Tourism',
    6, 0.5, 3, 12.0, 2.0, 3, 0.01, 0.08, 0.030, 2, 0.25, 8, 3, 2, 1.00, 0.30, 0.12, 0.05, 1.2, 12, 0.10, 0.05),
  f('ALCN', 'Alakan Touristic Investments', 'Tourism',
    4, 0.3, 2, 13.3, 2.0, 1.5, 0.01, 0.06, 0.025, 1, 0.09, 4, 1.5, 0.8, 1.88, 0.25, 0.08, 0.04, 1.1, 15, 0.08, 0.04),

  // === HEALTHCARE & PHARMA ===
  f('MPCO', 'Minapharm Pharmaceuticals', 'Healthcare & Pharma',
    20, 2, 12, 10.0, 1.67, 5, 0.02, 0.14, 0.060, 3, 0.7, 12, 5, 3, 0.60, 0.35, 0.20, 0.12, 0.8, 7.0, 0.12, 0.08),
  f('PHAR', 'Pharco Pharmaceuticals', 'Healthcare & Pharma',
    8, 0.8, 5, 10.0, 1.6, 3, 0.01, 0.12, 0.050, 2, 0.36, 7, 3, 1.5, 0.50, 0.32, 0.18, 0.10, 0.75, 8.0, 0.10, 0.06),
  f('ADCI', 'Arab Drug Company', 'Healthcare & Pharma',
    15, 1.5, 8, 10.0, 1.88, 2, 0.02, 0.15, 0.060, 1.5, 0.3, 5, 2, 1, 0.50, 0.35, 0.20, 0.12, 0.7, 6.5, 0.10, 0.06),
];

/** Get financial data by ticker */
export function getFinancialDataByTicker(ticker: string): EGXFinancialData | undefined {
  return EGX_FINANCIAL_DATA.find(d => d.ticker === ticker.toUpperCase());
}

/** Get financial data for a sector */
export function getFinancialDataBySector(sector: string): EGXFinancialData[] {
  return EGX_FINANCIAL_DATA.filter(d => d.sector === sector);
}

/** Compute sector averages from hardcoded data */
export function getHardcodedSectorAverages(sector: string): {
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgEVEbitda: number;
  avgDividendYield: number;
} {
  const sectorData = getFinancialDataBySector(sector);
  if (sectorData.length === 0) {
    return { avgPE: 8.5, avgPB: 1.2, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.04 };
  }
  return {
    avgPE: sectorData.reduce((s, d) => s + d.peRatio, 0) / sectorData.length,
    avgPB: sectorData.reduce((s, d) => s + d.pbRatio, 0) / sectorData.length,
    avgROE: sectorData.reduce((s, d) => s + d.roe, 0) / sectorData.length,
    avgEVEbitda: sectorData.reduce((s, d) => s + d.evToEbitda, 0) / sectorData.length,
    avgDividendYield: sectorData.reduce((s, d) => s + d.dividendYield, 0) / sectorData.length,
  };
}
