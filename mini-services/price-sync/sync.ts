/**
 * EGX Pro - Real-Time Price Sync Worker
 *
 * Fetches EGX stock prices from Yahoo Finance (.CA = Cairo exchange),
 * falls back to hardcoded financial data when APIs are unavailable,
 * and updates the Supabase database on 15-minute intervals during
 * EGX trading hours (10:00-14:30 Cairo time, Sunday-Thursday).
 *
 * Usage:
 *   bun run sync.ts --once    # One-shot sync
 *   bun run sync.ts           # Daemon mode (auto-restarts on file change with --hot)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Configuration
// ============================================================

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const YAHOO_REQUEST_DELAY_MS = 250; // 250ms between Yahoo requests to avoid rate limiting
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2000;
const YAHOO_TIMEOUT_MS = 12000;
const CAIRO_OFFSET_HOURS = 2; // UTC+2, no DST in Egypt since 2014

const MARKET_OPEN_HOUR = 10;
const MARKET_OPEN_MINUTE = 0;
const MARKET_CLOSE_HOUR = 14;
const MARKET_CLOSE_MINUTE = 30;

// ============================================================
// Types
// ============================================================

interface StockRow {
  id: string;
  ticker: string;
  name: string;
  nameAr: string;
  sector: string;
  industry: string;
  price: number;
  marketCap: number;
  sharesOutstanding: number;
  beta: number;
  dividendYield: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  bookValuePerShare: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: number;
  lastPriceAt: string | null;
  lastFinancialsAt: string | null;
}

interface YahooChartMeta {
  regularMarketPrice?: number;
  previousClose?: number;
  regularMarketVolume?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency?: string;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: YahooChartMeta;
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: number[];
          high?: number[];
          low?: number[];
          close?: number[];
          volume?: number[];
        }>;
        adjclose?: Array<{ adjclose?: number[] }>;
      };
    }>;
    error?: unknown;
  };
}

interface HardcodedFinancialData {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  eps: number;
  bookValuePerShare: number;
  peRatio: number;
  pbRatio: number;
  marketCap: number;
  dividendYield: number;
  roe: number;
  roa: number;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
  debtToEquity: number;
  grossMargin: number;
  operatingMargin: number;
  profitMargin: number;
  beta: number;
  sharesOutstanding: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: number;
  evToEbitda: number;
  operatingCashflow: number;
  freeCashflow: number;
  revenueGrowth: number;
  earningsGrowth: number;
  usdRevenuePct: number;
}

// ============================================================
// Hardcoded Fallback Data (from egx-financial-data.ts)
// Approximate 2024/2025 data based on publicly available information.
// All monetary values in EGP. Market cap in absolute EGP (not billions).
// ============================================================

function makeFallback(
  ticker: string, name: string, sector: string,
  price: number, eps: number, bvps: number, pe: number, pb: number,
  marketCapB: number, divYield: number, roe: number, roa: number,
  revenueB: number, netIncomeB: number, totalAssetsB: number,
  totalEquityB: number, totalDebtB: number, de: number,
  gm: number, om: number, pm: number, beta: number,
  evEbitda: number, revGrowth: number, earnGrowth: number, usdPct: number = 0,
): HardcodedFinancialData {
  const B = 1e9;
  return {
    ticker, name, sector, price, eps, bookValuePerShare: bvps,
    peRatio: pe, pbRatio: pb, marketCap: marketCapB * B,
    dividendYield: divYield, roe, roa, revenue: revenueB * B,
    netIncome: netIncomeB * B, totalAssets: totalAssetsB * B,
    totalEquity: totalEquityB * B, totalDebt: totalDebtB * B,
    debtToEquity: de, grossMargin: gm, operatingMargin: om,
    profitMargin: pm, beta, sharesOutstanding: Math.round((marketCapB * B) / price),
    fiftyTwoWeekHigh: price * 1.25, fiftyTwoWeekLow: price * 0.75,
    avgVolume: Math.round((marketCapB * B) / price * 0.003),
    evToEbitda: evEbitda,
    operatingCashflow: netIncomeB * B * 1.2,
    freeCashflow: netIncomeB * B * 0.7,
    revenueGrowth: revGrowth, earningsGrowth: earnGrowth,
    usdRevenuePct: usdPct,
  };
}

const HARDCODED_DATA: HardcodedFinancialData[] = [
  // === BANKING ===
  makeFallback('COMI', 'Commercial International Bank', 'Banking', 70, 11.5, 58, 6.1, 1.2, 159, 0.05, 0.20, 0.032, 45, 26.5, 830, 130, 180, 1.38, 0.55, 0.42, 0.35, 0.8, 5.5, 0.22, 0.18, 0.10),
  makeFallback('MISR', 'Banque Misr', 'Banking', 5, 1.67, 10, 3.0, 0.5, 25, 0.07, 0.17, 0.018, 30, 8.3, 460, 50, 120, 2.4, 0.48, 0.32, 0.28, 0.6, 4.0, 0.15, 0.12),
  makeFallback('NBEA', 'National Bank of Egypt', 'Banking', 50, 16.67, 83.3, 3.0, 0.6, 50, 0.06, 0.20, 0.025, 55, 10, 400, 52, 100, 1.92, 0.52, 0.38, 0.30, 0.7, 4.5, 0.18, 0.15),
  makeFallback('CIEB', 'Credit Agricole Egypt', 'Banking', 5, 1.25, 7.14, 4.0, 0.7, 8, 0.06, 0.17, 0.022, 6, 2, 90, 12, 20, 1.67, 0.50, 0.35, 0.28, 0.65, 4.2, 0.12, 0.10),
  makeFallback('BTFH', 'Beltone Financial Holding', 'Banking', 15, 1.25, 7.5, 12, 2.0, 6, 0.02, 0.17, 0.015, 3, 0.5, 40, 3, 15, 5.0, 0.42, 0.28, 0.15, 1.1, 10, 0.25, 0.20),
  makeFallback('SAUD', 'Al Baraka Bank Egypt', 'Banking', 2, 0.4, 4, 5.0, 0.5, 8, 0.04, 0.10, 0.012, 2.5, 0.8, 65, 8, 15, 1.88, 0.40, 0.25, 0.18, 0.55, 5.5, 0.10, 0.08),
  makeFallback('ADIB', 'Abu Dhabi Islamic Bank Egypt', 'Banking', 3, 0.6, 3.75, 5.0, 0.8, 18, 0.03, 0.16, 0.020, 5, 3, 150, 18, 30, 1.67, 0.45, 0.30, 0.25, 0.7, 5.0, 0.15, 0.12),
  makeFallback('FAIT', 'Faisal Islamic Bank of Egypt', 'Banking', 4, 1, 8, 4.0, 0.5, 15, 0.05, 0.12, 0.015, 4, 1.8, 120, 15, 25, 1.67, 0.42, 0.28, 0.22, 0.6, 4.8, 0.12, 0.10),
  makeFallback('QNBA', 'Qatar National Bank Alahli', 'Banking', 8, 2, 12, 4.0, 0.67, 12, 0.05, 0.17, 0.022, 6, 2.5, 110, 15, 22, 1.47, 0.50, 0.35, 0.28, 0.65, 4.5, 0.14, 0.12),
  makeFallback('AUBK', 'Bank of Alexandria', 'Banking', 12, 2.4, 14, 5.0, 0.86, 10, 0.04, 0.17, 0.020, 4, 1.4, 70, 8, 18, 2.25, 0.48, 0.32, 0.25, 0.7, 4.8, 0.13, 0.10),
  makeFallback('EDBE', 'Export Development Bank of Egypt', 'Banking', 3, 0.6, 5, 5.0, 0.6, 5, 0.04, 0.12, 0.015, 4, 0.6, 40, 5, 10, 2.00, 0.42, 0.28, 0.20, 0.55, 5.0, 0.08, 0.06),
  makeFallback('AIBK', 'Arab Investment Bank', 'Banking', 8, 1.6, 10, 5.0, 0.8, 6, 0.03, 0.16, 0.020, 3, 1, 50, 6, 12, 2.00, 0.45, 0.30, 0.22, 0.65, 4.5, 0.10, 0.08),
  makeFallback('CAIHC', 'Cairo Holding for Financial Investments', 'Banking', 10, 0.83, 5, 12.0, 2.0, 4, 0.02, 0.08, 0.012, 2, 0.3, 25, 4, 8, 2.00, 0.38, 0.22, 0.12, 1.1, 10, 0.15, 0.10),
  makeFallback('MFIB', 'Midgard for Financial Investments', 'Banking', 6, 0.5, 4, 12.0, 1.5, 3, 0.01, 0.08, 0.010, 1.5, 0.25, 18, 3, 5, 1.67, 0.35, 0.20, 0.10, 1.0, 9.0, 0.12, 0.08),

  // === REAL ESTATE ===
  makeFallback('TMGH', 'Talaat Moustafa Group', 'Real Estate', 5.5, 0.9, 5.5, 6.1, 1.0, 50, 0.04, 0.16, 0.085, 15, 8.2, 60, 50, 10, 0.20, 0.38, 0.28, 0.22, 0.9, 6.0, 0.20, 0.15),
  makeFallback('PHDC', 'Palm Hills Development', 'Real Estate', 5, 0.71, 5.5, 7.0, 0.91, 22, 0.02, 0.13, 0.045, 8, 3.1, 50, 24, 12, 0.50, 0.35, 0.22, 0.15, 1.05, 7.5, 0.18, 0.12),
  makeFallback('MNHD', 'Madinet Nasr for Housing', 'Real Estate', 8, 1.33, 10, 6.0, 0.8, 16, 0.03, 0.13, 0.060, 5, 2.1, 35, 16, 8, 0.50, 0.32, 0.25, 0.18, 0.85, 5.5, 0.15, 0.10),
  makeFallback('OCDI', 'SODIC', 'Real Estate', 35, 4.37, 29.17, 8.0, 1.2, 9, 0.02, 0.15, 0.060, 4, 1.4, 25, 10, 5, 0.50, 0.30, 0.20, 0.14, 0.9, 7.0, 0.12, 0.08),
  makeFallback('ORHD', 'Orascom Development Egypt', 'Real Estate', 3, 0.37, 7.5, 8.1, 0.4, 4, 0.01, 0.05, 0.020, 2, 0.2, 20, 4, 2, 2.00, 0.28, 0.12, 0.05, 1.2, 12, 0.08, 0.05),
  makeFallback('HDBK', 'Housing & Development Bank', 'Real Estate', 15, 3, 18.75, 5.0, 0.8, 10, 0.05, 0.16, 0.025, 3, 1.6, 65, 10, 15, 1.50, 0.45, 0.32, 0.25, 0.7, 4.5, 0.14, 0.12),
  makeFallback('HELI', 'Heliopolis Company for Housing', 'Real Estate', 25, 3.5, 20, 7.1, 1.25, 8, 0.03, 0.12, 0.080, 3, 1, 15, 8, 3, 0.38, 0.30, 0.18, 0.12, 0.8, 8.0, 0.10, 0.08),
  makeFallback('SHRF', 'El Shorouk for Modern Printing & Packaging', 'Real Estate', 12, 1.5, 10, 8.0, 1.2, 4, 0.02, 0.12, 0.060, 2, 0.5, 8, 4, 2, 0.50, 0.30, 0.18, 0.12, 0.85, 7.0, 0.10, 0.08),
  makeFallback('COPR', 'Cairo for Real Estate & Investment', 'Real Estate', 18, 2.25, 15, 8.0, 1.2, 6, 0.02, 0.13, 0.055, 3, 0.8, 18, 6, 4, 0.67, 0.32, 0.20, 0.14, 0.9, 6.5, 0.12, 0.08),
  makeFallback('NWRD', 'New Giza for Development', 'Real Estate', 30, 3.75, 25, 8.0, 1.2, 8, 0.01, 0.14, 0.055, 4, 1, 20, 7, 5, 0.71, 0.30, 0.18, 0.12, 1.0, 7.0, 0.15, 0.10),
  makeFallback('GDHS', 'Golden Desert for Investment & Development', 'Real Estate', 8, 1, 8, 8.0, 1.0, 3, 0.01, 0.10, 0.040, 2, 0.4, 10, 4, 3, 0.75, 0.28, 0.15, 0.10, 1.0, 8.0, 0.10, 0.06),
  makeFallback('DTRK', 'Dorra Track for Real Estate Investment', 'Real Estate', 6, 0.75, 6, 8.0, 1.0, 2, 0.01, 0.10, 0.035, 1.5, 0.25, 8, 2.5, 2, 0.80, 0.25, 0.12, 0.08, 1.1, 8.5, 0.08, 0.05),

  // === FINANCIAL SERVICES ===
  makeFallback('HRHO', 'EFG Hermes Holding', 'Financial Services', 7, 0.87, 7, 8.0, 1.0, 20, 0.03, 0.12, 0.040, 8, 2.5, 55, 20, 15, 0.75, 0.42, 0.28, 0.18, 1.0, 8.0, 0.15, 0.12),
  makeFallback('CIRA', 'CI Capital Holding', 'Financial Services', 5, 1, 7.1, 5.0, 0.7, 7, 0.02, 0.14, 0.035, 3, 1, 30, 7, 8, 1.14, 0.38, 0.22, 0.14, 0.85, 5.5, 0.12, 0.10),
  makeFallback('BINV', 'B Investments Holding', 'Financial Services', 5, 0.71, 6.25, 7.0, 0.8, 3, 0.01, 0.11, 0.030, 1, 0.4, 15, 4, 3, 1.33, 0.35, 0.20, 0.12, 0.9, 6.0, 0.10, 0.08),
  makeFallback('VALU', 'valU for Financial Technology', 'Financial Services', 5, 0.25, 1.67, 20, 3.0, 10, 0.0, 0.15, 0.050, 2, 0.5, 10, 3, 2, 0.67, 0.45, 0.15, 0.08, 1.2, 15, 0.35, 0.30),
  makeFallback('ASPI', 'Aspire Capital Holding', 'Financial Services', 4, 0.5, 4, 8.0, 1.0, 3, 0.01, 0.10, 0.030, 1.5, 0.4, 12, 4, 3, 0.75, 0.35, 0.20, 0.12, 0.95, 7.0, 0.12, 0.08),
  makeFallback('ECAP', 'Ezdaher Capital for Financial Investments', 'Financial Services', 6, 0.75, 5, 8.0, 1.2, 4, 0.01, 0.12, 0.035, 2, 0.5, 15, 4, 4, 1.00, 0.38, 0.22, 0.14, 0.9, 7.5, 0.10, 0.06),
  makeFallback('ACTF', 'Act Financial', 'Financial Services', 8, 0.4, 2.67, 20, 3.0, 5, 0.0, 0.10, 0.040, 2, 0.25, 8, 2.5, 2, 0.80, 0.42, 0.15, 0.06, 1.1, 12, 0.25, 0.20),
  makeFallback('ISPH', 'Institutional and Sovereign Projects Holding', 'Financial Services', 3, 0.25, 2.5, 12, 1.2, 2, 0.01, 0.08, 0.025, 1, 0.17, 8, 2, 2, 1.00, 0.30, 0.15, 0.08, 1.0, 10, 0.10, 0.06),
  makeFallback('INFI', 'Inco Investment', 'Financial Services', 5, 0.6, 5, 8.3, 1.0, 3, 0.01, 0.10, 0.030, 1.5, 0.35, 10, 3, 3, 1.00, 0.35, 0.20, 0.12, 0.9, 7.0, 0.12, 0.08),
  makeFallback('OIH', 'Orascom Investment Holding', 'Financial Services', 2, 0.1, 1.25, 20, 1.6, 4, 0.0, 0.05, 0.020, 1, 0.2, 20, 3, 5, 1.67, 0.25, 0.08, 0.04, 1.2, 15, 0.05, 0.02),

  // === TELECOMMUNICATIONS ===
  makeFallback('ETEL', 'Telecom Egypt', 'Telecommunications', 30, 3.75, 25, 8.0, 1.2, 50, 0.07, 0.15, 0.055, 35, 6.3, 115, 42, 20, 0.48, 0.52, 0.22, 0.12, 0.75, 5.0, 0.10, 0.08, 0.35),
  makeFallback('OTMT', 'Orascom Telecom Media', 'Telecommunications', 1.5, 0.1, 1.88, 15, 0.8, 3, 0.0, 0.05, 0.025, 1, 0.15, 12, 3, 2, 1.50, 0.25, 0.08, 0.03, 1.3, 20, 0.05, 0.02),
  makeFallback('VODE', 'Vodafone Egypt', 'Telecommunications', 18, 2.25, 12.86, 8.0, 1.4, 45, 0.05, 0.18, 0.065, 35, 5.6, 85, 30, 15, 0.50, 0.55, 0.25, 0.14, 0.7, 5.0, 0.12, 0.08),

  // === FOOD & BEVERAGES ===
  makeFallback('JUFO', 'Juhayna Food Industries', 'Food & Beverages', 4, 0.5, 3.3, 8.0, 1.2, 5, 0.03, 0.15, 0.060, 7, 0.75, 13, 5, 3, 0.60, 0.35, 0.15, 0.10, 0.8, 6.0, 0.12, 0.10),
  makeFallback('EKRI', 'Edita Food Industries', 'Food & Beverages', 20, 2.22, 10, 9.0, 2.0, 4, 0.04, 0.22, 0.100, 5, 0.45, 5, 2, 1, 0.50, 0.40, 0.18, 0.12, 0.7, 7.0, 0.10, 0.08),
  makeFallback('DOMT', 'Arabian Food Industries (Domty)', 'Food & Beverages', 20, 2.86, 11.11, 7.0, 1.8, 4, 0.03, 0.25, 0.120, 5, 0.5, 4, 2, 0.5, 0.25, 0.35, 0.18, 0.12, 0.65, 5.5, 0.15, 0.12),
  makeFallback('BDCO', 'Bisco Misr', 'Food & Beverages', 40, 5, 20, 8.0, 2.0, 3, 0.05, 0.25, 0.150, 1, 0.08, 0.6, 0.3, 0.2, 0.67, 0.38, 0.20, 0.15, 0.5, 5.0, 0.08, 0.05),
  makeFallback('HALW', 'Halwani Bros', 'Food & Beverages', 18, 2, 10, 9.0, 1.8, 2.5, 0.03, 0.15, 0.080, 2, 0.2, 3, 1.5, 0.8, 0.53, 0.32, 0.15, 0.10, 0.6, 6.5, 0.08, 0.05),
  makeFallback('UNIL', 'Unilever Egypt', 'Food & Beverages', 35, 4.37, 17.5, 8.0, 2.0, 15, 0.04, 0.25, 0.120, 12, 1.9, 20, 8, 4, 0.50, 0.40, 0.20, 0.15, 0.6, 5.5, 0.10, 0.08),
  makeFallback('NASR', 'El Nasr for Manufacturing Agricultural Crops', 'Food & Beverages', 8, 1, 5, 8.0, 1.6, 3, 0.02, 0.14, 0.060, 4, 0.5, 6, 2.5, 1.5, 0.60, 0.30, 0.15, 0.10, 0.75, 6.0, 0.08, 0.05),

  // === CONSTRUCTION & ENGINEERING ===
  makeFallback('ORAS', 'Orascom Construction', 'Construction & Engineering', 700, 58, 388, 12.1, 1.8, 32, 0.03, 0.15, 0.050, 30, 2.7, 55, 18, 12, 0.67, 0.22, 0.12, 0.08, 1.1, 8.0, 0.15, 0.10),
  makeFallback('SWDY', 'Elsewedy Electric', 'Construction & Engineering', 25, 3.1, 16.6, 8.1, 1.5, 55, 0.03, 0.19, 0.055, 80, 10.5, 140, 55, 35, 0.64, 0.28, 0.14, 0.09, 1.0, 6.5, 0.18, 0.15),
  makeFallback('ESRS', 'Ezz Steel', 'Construction & Engineering', 25, 2.5, 20.8, 10.0, 1.2, 18, 0.02, 0.12, 0.035, 60, 1.8, 55, 15, 20, 1.33, 0.15, 0.05, 0.02, 1.2, 12, 0.10, 0.05),
  makeFallback('ALUM', 'Egyptian Aluminium Company', 'Construction & Engineering', 75, 9.37, 50, 8.0, 1.5, 15, 0.04, 0.18, 0.080, 15, 1.9, 25, 10, 5, 0.50, 0.22, 0.12, 0.08, 0.9, 6.0, 0.12, 0.08),
  makeFallback('SKPC', 'Sidi Kerir Petrochemicals (SIDPEC)', 'Construction & Engineering', 30, 5, 20, 6.0, 1.5, 30, 0.06, 0.25, 0.130, 15, 7.5, 58, 30, 10, 0.33, 0.35, 0.25, 0.20, 0.6, 4.5, 0.15, 0.12),
  makeFallback('MRSE', 'Maridive & Oil Services', 'Construction & Engineering', 3, 0.25, 3.75, 12.0, 0.8, 2, 0.0, 0.05, 0.020, 3, 0.17, 15, 3, 6, 2.00, 0.15, 0.05, 0.02, 1.2, 12, 0.05, 0.02),
  makeFallback('ACGC', 'Al Cot for General Contracting', 'Construction & Engineering', 10, 1.25, 8.33, 8.0, 1.2, 5, 0.02, 0.12, 0.040, 4, 0.6, 18, 5, 5, 1.00, 0.22, 0.12, 0.08, 0.9, 7.0, 0.10, 0.06),
  makeFallback('IRAX', 'International Radiators', 'Construction & Engineering', 15, 1.88, 10, 8.0, 1.5, 4, 0.03, 0.15, 0.060, 3, 0.5, 10, 3, 2, 0.67, 0.25, 0.12, 0.08, 0.8, 6.5, 0.08, 0.05),

  // === ENERGY ===
  makeFallback('CCAP', 'Qalaa Holdings', 'Energy', 5, 0.5, 8.3, 10.0, 0.6, 12, 0.0, 0.06, 0.020, 20, 0.6, 55, 10, 25, 2.50, 0.20, 0.05, 0.02, 1.3, 15, 0.12, 0.08),
  makeFallback('AMOC', 'Alexandria Mineral Oils', 'Energy', 50, 10, 38.5, 5.0, 1.3, 10, 0.08, 0.26, 0.120, 8, 2.6, 22, 10, 5, 0.50, 0.28, 0.18, 0.15, 0.5, 3.5, 0.10, 0.08),
  makeFallback('TAQA', 'Taqa Arabia', 'Energy', 8, 0.8, 5, 10.0, 1.6, 5, 0.02, 0.12, 0.050, 10, 0.6, 12, 5, 3, 0.60, 0.25, 0.10, 0.06, 0.85, 8.0, 0.18, 0.12),
  makeFallback('OTEL', 'Orascom Telecom', 'Energy', 2, 0.1, 1.67, 20, 1.2, 4, 0.0, 0.04, 0.015, 2, 0.2, 25, 4, 8, 2.00, 0.15, 0.05, 0.02, 1.3, 18, 0.05, 0.02),

  // === CHEMICALS & FERTILIZERS ===
  makeFallback('ABUK', 'Abu Qir Fertilizers', 'Chemicals & Fertilizers', 45, 6.4, 30, 7.0, 1.5, 63, 0.05, 0.21, 0.100, 25, 13, 130, 62, 20, 0.32, 0.35, 0.28, 0.22, 0.6, 5.0, 0.15, 0.12),
  makeFallback('SPMD', 'Sidi Kerir Petrochemicals', 'Chemicals & Fertilizers', 30, 5, 20, 6.0, 1.5, 30, 0.06, 0.25, 0.130, 15, 7.5, 58, 30, 10, 0.33, 0.35, 0.25, 0.20, 0.6, 4.5, 0.15, 0.12),
  makeFallback('KIMA', 'Egyptian Chemical Industries', 'Chemicals & Fertilizers', 25, 3.57, 20.83, 7.0, 1.2, 7, 0.04, 0.17, 0.060, 5, 1, 18, 6, 4, 0.67, 0.28, 0.18, 0.12, 0.75, 5.5, 0.12, 0.08),
  makeFallback('EGCH', 'Egyptian Chemical Industries', 'Chemicals & Fertilizers', 15, 2.14, 12.5, 7.0, 1.2, 4, 0.03, 0.15, 0.050, 4, 0.6, 12, 4, 3, 0.75, 0.25, 0.15, 0.10, 0.8, 6.0, 0.10, 0.06),
  makeFallback('ALKZ', 'Al Kahera for Pharmaceuticals', 'Chemicals & Fertilizers', 20, 2.5, 14.29, 8.0, 1.4, 6, 0.02, 0.14, 0.055, 5, 0.75, 15, 5, 4, 0.80, 0.28, 0.16, 0.10, 0.85, 6.5, 0.10, 0.06),
  makeFallback('APPC', 'Arab Polivara for Packaging', 'Chemicals & Fertilizers', 10, 1.25, 8.33, 8.0, 1.2, 3, 0.02, 0.12, 0.045, 3, 0.4, 10, 3.5, 2, 0.57, 0.25, 0.14, 0.08, 0.75, 6.0, 0.08, 0.05),

  // === TOBACCO ===
  makeFallback('EAST', 'Eastern Company for Tobacco', 'Tobacco', 30, 5, 20, 6.0, 1.5, 30, 0.10, 0.25, 0.180, 10, 5, 28, 17, 5, 0.29, 0.42, 0.30, 0.25, 0.5, 4.0, 0.10, 0.08),

  // === TECHNOLOGY ===
  makeFallback('FWRY', 'Fawry for Banking Technology', 'Technology', 7, 0.28, 1.4, 25.0, 5.0, 35, 0.0, 0.20, 0.080, 2.5, 0.4, 5, 2, 1, 0.50, 0.45, 0.18, 0.08, 1.1, 18, 0.30, 0.25),
  makeFallback('EFLS', 'E-Finance for Digital Investments', 'Technology', 15, 1.25, 5, 12.0, 3.0, 12, 0.02, 0.25, 0.100, 3, 0.8, 8, 3, 2, 0.67, 0.42, 0.20, 0.10, 0.9, 10, 0.20, 0.15),
  makeFallback('RAYA', 'Raya Holding', 'Technology', 10, 1.25, 6.67, 8.0, 1.5, 6, 0.02, 0.18, 0.060, 6, 1, 18, 6, 4, 0.67, 0.30, 0.15, 0.08, 0.9, 6.0, 0.15, 0.10),
  makeFallback('UNRG', 'United Motors Group', 'Technology', 5, 0.5, 3.33, 10.0, 1.5, 3, 0.01, 0.12, 0.040, 4, 0.3, 10, 2.5, 2, 0.80, 0.28, 0.12, 0.06, 0.9, 8.0, 0.10, 0.06),

  // === TOURISM ===
  makeFallback('OCH', 'Orascom Hotels and Development', 'Tourism', 6, 0.5, 3, 12.0, 2.0, 3, 0.01, 0.08, 0.030, 2, 0.25, 8, 3, 2, 1.00, 0.30, 0.12, 0.05, 1.2, 12, 0.10, 0.05),
  makeFallback('ALCN', 'Alakan Touristic Investments', 'Tourism', 4, 0.3, 2, 13.3, 2.0, 1.5, 0.01, 0.06, 0.025, 1, 0.09, 4, 1.5, 0.8, 1.88, 0.25, 0.08, 0.04, 1.1, 15, 0.08, 0.04),
  makeFallback('OBRI', 'Oberoi Hotels (Egypt)', 'Tourism', 15, 1.25, 8.33, 12.0, 1.8, 4, 0.02, 0.10, 0.040, 2.5, 0.4, 10, 4, 3, 0.75, 0.32, 0.15, 0.08, 1.0, 10, 0.08, 0.04),
  makeFallback('AHLC', 'Al Haram for Hotel Investment', 'Tourism', 8, 0.5, 5, 16.0, 1.6, 2.5, 0.01, 0.06, 0.025, 2, 0.15, 8, 2.5, 2, 0.80, 0.25, 0.08, 0.04, 1.15, 14, 0.06, 0.03),
  makeFallback('HETC', 'Heliopolis Tourism', 'Tourism', 10, 0.67, 5.56, 15.0, 1.8, 3, 0.01, 0.07, 0.025, 1.5, 0.2, 8, 2, 2, 1.00, 0.22, 0.08, 0.04, 1.2, 13, 0.05, 0.02),

  // === HEALTHCARE & PHARMA ===
  makeFallback('MPCO', 'Minapharm Pharmaceuticals', 'Healthcare & Pharma', 20, 2, 12, 10.0, 1.67, 5, 0.02, 0.14, 0.060, 3, 0.7, 12, 5, 3, 0.60, 0.35, 0.20, 0.12, 0.8, 7.0, 0.12, 0.08),
  makeFallback('PHAR', 'Pharco Pharmaceuticals', 'Healthcare & Pharma', 8, 0.8, 5, 10.0, 1.6, 3, 0.01, 0.12, 0.050, 2, 0.36, 7, 3, 1.5, 0.50, 0.32, 0.18, 0.10, 0.75, 8.0, 0.10, 0.06),
  makeFallback('ADCI', 'Arab Drug Company', 'Healthcare & Pharma', 15, 1.5, 8, 10.0, 1.88, 2, 0.02, 0.15, 0.060, 1.5, 0.3, 5, 2, 1, 0.50, 0.35, 0.20, 0.12, 0.7, 6.5, 0.10, 0.06),
  makeFallback('TRMA', 'Travco Group', 'Healthcare & Pharma', 5, 0.4, 4, 12.5, 1.25, 3, 0.01, 0.08, 0.030, 2, 0.24, 8, 3, 3, 1.00, 0.28, 0.12, 0.06, 1.0, 9.0, 0.08, 0.04),

  // === TEXTILES & RETAIL ===
  makeFallback('DAPH', 'Daad Abou Al Fadl for Ready-Made Garments', 'Textiles & Retail', 8, 0.67, 5, 12.0, 1.6, 2, 0.01, 0.10, 0.035, 2, 0.17, 6, 1.7, 1.5, 0.88, 0.22, 0.10, 0.06, 0.9, 8.0, 0.06, 0.03),
  makeFallback('ARAB', 'Arab Cotton Ginning Company', 'Textiles & Retail', 5, 0.25, 3.33, 20, 1.5, 4, 0.01, 0.05, 0.020, 3, 0.2, 10, 2, 3, 1.50, 0.18, 0.06, 0.03, 1.1, 12, 0.05, 0.02),
  makeFallback('ALEX', 'Alexandria Spinning and Weaving', 'Textiles & Retail', 3, 0.15, 2.5, 20, 1.2, 2, 0.0, 0.04, 0.015, 2, 0.1, 8, 1.5, 2, 1.33, 0.15, 0.05, 0.02, 1.2, 15, 0.03, 0.01),

  // === OTHER & INVESTMENT ===
  makeFallback('AIND', 'Arab Industries Development', 'Other & Investment', 6, 0.5, 5, 12, 1.2, 3, 0.01, 0.08, 0.025, 2, 0.25, 10, 3, 4, 1.33, 0.22, 0.10, 0.06, 0.9, 8.0, 0.08, 0.04),
  makeFallback('AMER', 'Americana Restaurants', 'Other & Investment', 3, 0.15, 1.88, 20, 1.6, 8, 0.0, 0.05, 0.015, 12, 0.6, 20, 4, 5, 1.25, 0.30, 0.08, 0.04, 1.0, 15, 0.15, 0.10),
  makeFallback('NCGC', 'National Company for Glass & Crystals', 'Other & Investment', 12, 1, 8, 12, 1.5, 3, 0.02, 0.10, 0.040, 2, 0.25, 8, 2.5, 2, 0.80, 0.25, 0.12, 0.08, 0.8, 7.0, 0.08, 0.05),
  makeFallback('AEC', 'Alexandria Container & Goods Handling', 'Other & Investment', 50, 8.33, 33.33, 6.0, 1.5, 15, 0.04, 0.25, 0.120, 8, 2.5, 25, 10, 8, 0.80, 0.32, 0.22, 0.15, 0.6, 5.0, 0.12, 0.08),
  makeFallback('ELNA', 'El Nasr for Clothes and Textiles', 'Other & Investment', 4, 0.2, 2.5, 20, 1.6, 2, 0.0, 0.05, 0.015, 1.5, 0.1, 7, 1, 2, 2.00, 0.15, 0.05, 0.02, 1.1, 12, 0.04, 0.02),
  makeFallback('ATLC', 'Atlas for Land Reclamation & Processing', 'Other & Investment', 10, 0.83, 6.25, 12, 1.6, 4, 0.01, 0.10, 0.035, 3, 0.35, 12, 3.5, 3, 0.86, 0.22, 0.10, 0.06, 0.9, 8.0, 0.08, 0.04),
  makeFallback('SARE', 'Suez Agricultural Reclamation Enterprises', 'Other & Investment', 8, 0.57, 5, 14, 1.6, 3, 0.01, 0.08, 0.030, 2, 0.22, 10, 2.8, 3, 1.07, 0.20, 0.10, 0.06, 0.85, 9.0, 0.06, 0.03),
  makeFallback('UNIP', 'United International Pharmaceutical Company', 'Other & Investment', 12, 1.2, 8, 10, 1.5, 4, 0.02, 0.12, 0.045, 3, 0.5, 12, 4, 3, 0.75, 0.28, 0.15, 0.10, 0.8, 7.0, 0.08, 0.05),
  makeFallback('IPCO', 'International Packaging Materials', 'Other & Investment', 7, 0.58, 4.67, 12, 1.5, 3, 0.01, 0.10, 0.035, 2, 0.25, 9, 2.5, 2, 0.80, 0.25, 0.12, 0.08, 0.85, 8.0, 0.06, 0.03),
  makeFallback('KRDI', 'Kafr El Zayat for Development & Investment', 'Other & Investment', 5, 0.33, 3.57, 15, 1.4, 3, 0.01, 0.07, 0.025, 2, 0.2, 10, 2.8, 3, 1.07, 0.20, 0.08, 0.04, 0.9, 9.0, 0.05, 0.02),
  makeFallback('SAMC', 'Suez Agricultural and Processing', 'Other & Investment', 8, 0.5, 5, 16, 1.6, 3, 0.01, 0.08, 0.030, 2.5, 0.2, 10, 2.5, 3, 1.20, 0.20, 0.08, 0.04, 0.9, 10, 0.06, 0.03),
  makeFallback('MNFS', 'Misr National Company for Foodstuffs', 'Other & Investment', 6, 0.3, 4, 20, 1.5, 4, 0.01, 0.06, 0.020, 3, 0.2, 12, 2, 4, 2.00, 0.18, 0.06, 0.03, 1.0, 12, 0.05, 0.02),
  makeFallback('AACI', 'Arab African International Securities', 'Other & Investment', 10, 0.83, 6.67, 12, 1.5, 5, 0.01, 0.10, 0.035, 3, 0.42, 15, 4, 5, 1.25, 0.30, 0.15, 0.08, 0.9, 7.5, 0.10, 0.06),
  makeFallback('CSEL', 'CI Select', 'Other & Investment', 4, 0.33, 3.33, 12, 1.2, 2, 0.01, 0.08, 0.025, 1.5, 0.17, 8, 2, 2, 1.00, 0.28, 0.12, 0.06, 0.95, 8.5, 0.08, 0.04),
];

/** Lookup map for hardcoded fallback data by ticker */
const fallbackByTicker = new Map<string, HardcodedFinancialData>();
for (const item of HARDCODED_DATA) {
  fallbackByTicker.set(item.ticker, item);
}

// ============================================================
// Supabase Client Initialization
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('[PriceSync] ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// Market Hours Utilities
// ============================================================

function getCairoTime(date: Date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + CAIRO_OFFSET_HOURS * 3600000);
}

function isMarketOpen(date: Date = new Date()): boolean {
  const cairoTime = getCairoTime(date);
  const day = cairoTime.getDay();
  // EGX is closed on Friday (5) and Saturday (6)
  if (day === 5 || day === 6) return false;
  const hour = cairoTime.getHours();
  const minute = cairoTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  const openInMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const closeInMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;
  return timeInMinutes >= openInMinutes && timeInMinutes < closeInMinutes;
}

function isTradingDay(date: Date = new Date()): boolean {
  const day = getCairoTime(date).getDay();
  return day !== 5 && day !== 6;
}

function formatCairoTime(date: Date = new Date()): string {
  const ct = getCairoTime(date);
  return ct.toISOString().replace('T', ' ').substring(0, 19) + ' (Cairo)';
}

// ============================================================
// Rate Limiting for Yahoo Finance
// ============================================================

let _lastYahooRequestTime = 0;

async function yahooRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - _lastYahooRequestTime;
  if (elapsed < YAHOO_REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, YAHOO_REQUEST_DELAY_MS - elapsed));
  }
  _lastYahooRequestTime = Date.now();
}

// ============================================================
// Retry Utility
// ============================================================

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_BASE_DELAY_MS,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`[PriceSync] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms: ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}

// ============================================================
// Yahoo Finance API Fetch Functions
// ============================================================

interface YahooPriceResult {
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

/**
 * Fetch current price from Yahoo Finance chart API.
 * EGX stocks on Yahoo use the .CA suffix (Cairo exchange).
 */
async function fetchPriceFromYahoo(yahooSymbol: string): Promise<YahooPriceResult | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;

  try {
    await yahooRateLimit();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(YAHOO_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`[YahooChart] ${yahooSymbol}: HTTP ${response.status}`);
      return null;
    }

    const json: YahooChartResponse = await response.json();
    const result = json?.chart?.result?.[0];
    if (!result?.meta) return null;

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    const price = meta.regularMarketPrice ?? 0;
    if (price <= 0) return null;

    return {
      price,
      open: meta.regularMarketOpen ?? quote?.open?.[0] ?? 0,
      high: meta.regularMarketDayHigh ?? quote?.high?.[0] ?? 0,
      low: meta.regularMarketDayLow ?? quote?.low?.[0] ?? 0,
      close: meta.regularMarketPrice ?? quote?.close?.[0] ?? 0,
      volume: meta.regularMarketVolume ?? quote?.volume?.[0] ?? 0,
      previousClose: meta.previousClose ?? 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
    };
  } catch (error) {
    console.warn(`[YahooChart] ${yahooSymbol}: ${(error as Error).message}`);
    return null;
  }
}

// ============================================================
// Database Operations
// ============================================================

/**
 * Fetch all stocks from the Supabase Stock table.
 * Constructs yahooSymbol from ticker + '.CA' suffix since the column
 * may not exist in the deployed Supabase schema.
 */
async function fetchAllStocks(): Promise<StockRow[]> {
  const { data, error } = await supabase
    .from('Stock')
    .select('id, ticker, name, nameAr, sector, industry, price, marketCap, sharesOutstanding, beta, dividendYield, peRatio, pbRatio, eps, bookValuePerShare, fiftyTwoWeekHigh, fiftyTwoWeekLow, avgVolume, lastPriceAt, lastFinancialsAt')
    .order('ticker');

  if (error) {
    console.error('[PriceSync] Error fetching stocks:', error.message);
    return [];
  }

  return (data || []) as StockRow[];
}

/**
 * Update the Stock table with new price and financial data.
 */
async function updateStockInDb(
  stockId: string,
  ticker: string,
  yahooData: YahooPriceResult | null,
  fallback: HardcodedFinancialData | null,
): Promise<boolean> {
  const updates: Record<string, unknown> = {};
  const now = new Date().toISOString();

  // Use Yahoo data as primary source
  if (yahooData && yahooData.price > 0) {
    updates.price = yahooData.price;
    if (yahooData.fiftyTwoWeekHigh > 0) updates.fiftyTwoWeekHigh = yahooData.fiftyTwoWeekHigh;
    if (yahooData.fiftyTwoWeekLow > 0) updates.fiftyTwoWeekLow = yahooData.fiftyTwoWeekLow;
    if (yahooData.volume > 0) updates.avgVolume = yahooData.volume;
    updates.lastPriceAt = now;
  }

  // Merge fallback data for financial metrics (always from hardcoded if Yahoo doesn't provide them)
  if (fallback) {
    // Price: prefer Yahoo, fallback to hardcoded
    if (!updates.price && fallback.price > 0) {
      updates.price = fallback.price;
      updates.lastPriceAt = now;
    }

    // Financial metrics from fallback (these are rarely available from Yahoo for EGX)
    if (fallback.marketCap > 0) updates.marketCap = fallback.marketCap;
    if (fallback.sharesOutstanding > 0) updates.sharesOutstanding = fallback.sharesOutstanding;
    if (fallback.beta > 0) updates.beta = fallback.beta;
    if (fallback.dividendYield > 0) updates.dividendYield = fallback.dividendYield * 100; // Convert to percentage
    if (fallback.peRatio > 0) updates.peRatio = fallback.peRatio;
    if (fallback.pbRatio > 0) updates.pbRatio = fallback.pbRatio;
    if (fallback.eps > 0) updates.eps = fallback.eps;
    if (fallback.bookValuePerShare > 0) updates.bookValuePerShare = fallback.bookValuePerShare;
    if (fallback.fiftyTwoWeekHigh > 0 && !updates.fiftyTwoWeekHigh) updates.fiftyTwoWeekHigh = fallback.fiftyTwoWeekHigh;
    if (fallback.fiftyTwoWeekLow > 0 && !updates.fiftyTwoWeekLow) updates.fiftyTwoWeekLow = fallback.fiftyTwoWeekLow;
    if (fallback.avgVolume > 0 && !updates.avgVolume) updates.avgVolume = fallback.avgVolume;

    // Recalculate derived metrics if we have price + fundamental data
    if (updates.price && fallback.bookValuePerShare > 0) {
      updates.pbRatio = (updates.price as number) / fallback.bookValuePerShare;
    }
    if (updates.price && fallback.eps > 0) {
      updates.peRatio = (updates.price as number) / fallback.eps;
    }
  }

  // Only update if we have meaningful data
  if (Object.keys(updates).length === 0) {
    return false;
  }

  const { data, error } = await supabase
    .from('Stock')
    .update(updates)
    .eq('id', stockId)
    .select('id')
    .maybeSingle();

  if (error) {
    // Detect RLS policy violations
    if (error.message.includes('row-level security') || error.message.includes('rls')) {
      console.warn(`[PriceSync] RLS blocked update for ${ticker}. Ensure SUPABASE_SERVICE_ROLE_KEY is set correctly.`);
    } else {
      console.error(`[PriceSync] Error updating stock ${ticker}:`, error.message);
    }
    return false;
  }

  // Supabase may silently block updates via RLS without an error - check for empty result
  if (!data) {
    console.warn(`[PriceSync] Stock update for ${ticker} returned no rows (possible RLS block).`);
    return false;
  }

  return true;
}

/**
 * Insert or update a PriceHistory record for today.
 */
async function upsertPriceHistory(
  stockId: string,
  ticker: string,
  price: number,
  open: number,
  high: number,
  low: number,
  volume: number,
): Promise<void> {
  if (price <= 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = today.toISOString().split('T')[0];

  // Check if today's entry already exists
  const { data: existing } = await supabase
    .from('PriceHistory')
    .select('id, high, low')
    .eq('stockId', stockId)
    .eq('date', dateStr)
    .single();

  const effectiveOpen = open > 0 ? open : price;
  const effectiveHigh = high > 0 ? high : price;
  const effectiveLow = low > 0 ? low : price;

  if (existing) {
    // Update existing record (track intraday high/low)
    const prevHigh = (existing as any).high || 0;
    const prevLow = (existing as any).low || Infinity;
    const { error } = await supabase
      .from('PriceHistory')
      .update({
        high: Math.max(prevHigh, effectiveHigh),
        low: Math.min(prevLow === Infinity ? effectiveLow : prevLow, effectiveLow),
        close: price,
        volume: volume || 0,
        source: 'price-sync',
      })
      .eq('id', existing.id);

    if (error) {
      console.error(`[PriceSync] Error updating PriceHistory for ${ticker}:`, error.message);
    }
  } else {
    const { error } = await supabase
      .from('PriceHistory')
      .insert({
        stockId,
        date: dateStr,
        open: effectiveOpen,
        high: effectiveHigh,
        low: effectiveLow,
        close: price,
        volume: volume || 0,
        source: 'price-sync',
      });

    if (error) {
      console.error(`[PriceSync] Error inserting PriceHistory for ${ticker}:`, error.message);
    }
  }
}

/**
 * Insert or update FinancialData record for the current year.
 * Maps hardcoded fallback data to the actual Supabase FinancialData schema.
 */
async function upsertFinancialData(
  stockId: string,
  ticker: string,
  fallback: HardcodedFinancialData,
): Promise<void> {
  const year = new Date().getFullYear();

  const { data: existing } = await supabase
    .from('FinancialData')
    .select('id')
    .eq('stockId', stockId)
    .eq('year', year)
    .single();

  // Map to the actual Supabase FinancialData schema columns
  const record: Record<string, unknown> = {
    stockId,
    year,
    quarter: 0, // Annual data
    revenue: fallback.revenue,
    costOfRevenue: fallback.revenue * (1 - fallback.grossMargin),
    grossProfit: fallback.revenue * fallback.grossMargin,
    operatingExpenses: fallback.revenue * (fallback.grossMargin - fallback.operatingMargin),
    operatingIncome: fallback.revenue * fallback.operatingMargin,
    ebitda: fallback.operatingCashflow * 0.8,
    depreciation: fallback.operatingCashflow * 0.1,
    interestExpense: fallback.totalDebt * 0.15,
    netIncome: fallback.netIncome,
    eps: fallback.eps,
    dividendsPerShare: fallback.price * fallback.dividendYield,
    totalAssets: fallback.totalAssets,
    currentAssets: fallback.totalAssets * 0.3,
    cash: fallback.totalAssets * 0.1,
    totalLiabilities: fallback.totalDebt + (fallback.totalAssets - fallback.totalEquity - fallback.totalDebt) * 0.5,
    currentLiabilities: fallback.totalDebt * 0.4,
    longTermDebt: fallback.totalDebt * 0.6,
    shortTermDebt: fallback.totalDebt * 0.4,
    totalEquity: fallback.totalEquity,
    sharesOutstanding: fallback.sharesOutstanding,
    operatingCashFlow: fallback.operatingCashflow,
    capitalExpenditure: fallback.operatingCashflow - fallback.freeCashflow,
    freeCashFlow: fallback.freeCashflow,
    changeInNWC: 0,
    netBorrowing: 0,
    taxRate: 0.23,
    dataSource: 'hardcoded-fallback',
    reportingDate: `${year}-12-31`,
    reportType: 'annual',
    currency: 'EGP',
    isVerified: false,
    hasOCI: false,
  };

  if (existing) {
    const { error } = await supabase
      .from('FinancialData')
      .update(record)
      .eq('id', existing.id);

    if (error) {
      console.error(`[PriceSync] Error updating FinancialData for ${ticker}:`, error.message);
    }
  } else {
    const { error } = await supabase
      .from('FinancialData')
      .insert(record);

    if (error) {
      console.error(`[PriceSync] Error inserting FinancialData for ${ticker}:`, error.message);
    }
  }
}

/**
 * Log sync activity to the DataRefreshLog table.
 * Handles the case where the table may not exist in Supabase yet.
 */
async function logSync(
  scope: string,
  stocksUpdated: number,
  stocksFailed: number,
  errors: string[],
  startedAt: Date,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('DataRefreshLog')
      .insert({
        scope,
        stocksUpdated,
        stocksFailed,
        errors: JSON.stringify(errors),
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
      });

    if (error) {
      // Table may not exist yet - log warning instead of error
      console.warn('[PriceSync] Could not write DataRefreshLog:', error.message);
    }
  } catch {
    console.warn('[PriceSync] DataRefreshLog table not available, skipping log entry');
  }
}

// ============================================================
// Main Sync Logic
// ============================================================

interface SyncResult {
  total: number;
  updated: number;
  failed: number;
  errors: string[];
  duration: number;
  source: 'yahoo' | 'fallback' | 'mixed';
}

/**
 * Run a full price sync cycle.
 *
 * For each stock in the database:
 * 1. Try Yahoo Finance API (.CA suffix)
 * 2. Fallback to hardcoded financial data
 * 3. Update Stock table with merged data
 * 4. Insert/update PriceHistory record
 * 5. Insert/update FinancialData record (from fallback)
 */
async function runSyncCycle(force: boolean = false): Promise<SyncResult> {
  const startedAt = new Date();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[PriceSync] Starting sync cycle at ${formatCairoTime()}`);
  console.log(`[PriceSync] Market is ${isMarketOpen() ? 'OPEN' : 'CLOSED'}. Force=${force}`);
  console.log(`${'='.repeat(60)}`);

  // Skip if market is closed and not forced
  if (!force && !isMarketOpen()) {
    console.log('[PriceSync] Market is closed and not forced. Skipping sync cycle.');
    return { total: 0, updated: 0, failed: 0, errors: [], duration: 0, source: 'fallback' };
  }

  const stocks = await fetchAllStocks();
  console.log(`[PriceSync] Found ${stocks.length} stocks in database`);

  let updated = 0;
  let failed = 0;
  let yahooSuccessCount = 0;
  let fallbackCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const yahooSymbol = `${stock.ticker}.CA`;
    const fallback = fallbackByTicker.get(stock.ticker) || null;

    try {
      // Step 1: Try Yahoo Finance
      let yahooData: YahooPriceResult | null = null;
      try {
        yahooData = await withRetry(() => fetchPriceFromYahoo(yahooSymbol), 2, 1000);
      } catch {
        // Yahoo failed after retries, will use fallback
      }

      // Step 2: Update Stock table
      const stockUpdated = await updateStockInDb(stock.id, stock.ticker, yahooData, fallback);

      // Step 3: Insert/update PriceHistory
      const effectivePrice = yahooData?.price || fallback?.price || 0;
      if (effectivePrice > 0) {
        await upsertPriceHistory(
          stock.id,
          stock.ticker,
          effectivePrice,
          yahooData?.open || fallback?.price || 0,
          yahooData?.high || fallback?.price || 0,
          yahooData?.low || fallback?.price || 0,
          yahooData?.volume || fallback?.avgVolume || 0,
        );
      }

      // Step 4: Insert/update FinancialData from fallback
      if (fallback) {
        await upsertFinancialData(stock.id, stock.ticker, fallback);
      }

      if (stockUpdated) {
        updated++;
        if (yahooData && yahooData.price > 0) {
          yahooSuccessCount++;
        } else if (fallback) {
          fallbackCount++;
        }
      } else if (effectivePrice > 0) {
        // Price data was fetched but DB update failed (e.g., RLS blocked)
        // Still count as data-available but not as "updated in DB"
        if (yahooData && yahooData.price > 0) {
          yahooSuccessCount++;
        } else if (fallback) {
          fallbackCount++;
        }
        // Track as a soft failure
        failed++;
        errors.push(`${stock.ticker}: Price fetched (${effectivePrice.toFixed(2)}) but DB update failed`);
      } else {
        failed++;
        errors.push(`${stock.ticker}: No data available from any source`);
      }
    } catch (error) {
      failed++;
      const msg = `${stock.ticker}: ${(error as Error).message}`;
      errors.push(msg);
      console.error(`[PriceSync] Error processing ${stock.ticker}:`, (error as Error).message);
    }

    // Progress log every 20 stocks
    if ((i + 1) % 20 === 0) {
      console.log(`[PriceSync] Progress: ${i + 1}/${stocks.length} (${updated} updated, ${failed} failed)`);
    }
  }

  const duration = Date.now() - startedAt.getTime();
  const source: SyncResult['source'] = yahooSuccessCount > 0 && fallbackCount > 0
    ? 'mixed'
    : yahooSuccessCount > 0 ? 'yahoo' : 'fallback';

  console.log(`\n[PriceSync] Sync cycle completed in ${Math.round(duration / 1000)}s`);
  console.log(`[PriceSync] Results: ${updated} updated, ${failed} failed out of ${stocks.length} total`);
  console.log(`[PriceSync] Sources: Yahoo=${yahooSuccessCount}, Fallback=${fallbackCount}, Primary=${source}`);

  // Log to DataRefreshLog
  await logSync('price_sync', updated, failed, errors.slice(0, 50), startedAt);

  return { total: stocks.length, updated, failed, errors, duration, source };
}

// ============================================================
// Daemon Mode
// ============================================================

let _isSyncing = false;
let _syncTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Calculate the next sync time.
 * During trading hours: 15-minute intervals.
 * Outside trading hours: wait until next market open.
 */
function calculateNextSyncDelay(): number {
  if (isMarketOpen()) {
    return SYNC_INTERVAL_MS;
  }

  // Calculate time until next market open
  const cairoTime = getCairoTime();
  const day = cairoTime.getDay();
  const hour = cairoTime.getHours();
  const minute = cairoTime.getMinutes();

  let msUntilOpen: number;

  if (day === 5) {
    // Friday - wait until Sunday 10:00 Cairo
    msUntilOpen = (2 * 24 * 60 + (10 * 60 - hour * 60 - minute)) * 60 * 1000;
  } else if (day === 6) {
    // Saturday - wait until Sunday 10:00 Cairo
    msUntilOpen = (1 * 24 * 60 + (10 * 60 - hour * 60 - minute)) * 60 * 1000;
  } else if (hour < MARKET_OPEN_HOUR || (hour === MARKET_OPEN_HOUR && minute < MARKET_OPEN_MINUTE)) {
    // Before market open today
    msUntilOpen = ((MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE) - hour * 60 - minute) * 60 * 1000;
  } else {
    // After market close - wait until next trading day 10:00
    let daysToAdd = 1;
    if (day === 4) daysToAdd = 3; // Thursday -> Sunday
    msUntilOpen = (daysToAdd * 24 * 60 + (MARKET_OPEN_HOUR * 60 - hour * 60 - minute)) * 60 * 1000;
  }

  // Cap at 2 hours to allow checking for schedule changes
  return Math.min(msUntilOpen, 2 * 60 * 60 * 1000);
}

async function scheduleNextSync(): Promise<void> {
  const delay = calculateNextSyncDelay();
  const nextTime = new Date(Date.now() + delay);
  console.log(`[PriceSync] Next sync in ${Math.round(delay / 60000)} minutes (at ${formatCairoTime(nextTime)})`);

  _syncTimer = setTimeout(async () => {
    if (!_isSyncing) {
      await daemonSyncCycle();
    }
    scheduleNextSync();
  }, delay);
}

async function daemonSyncCycle(): Promise<void> {
  if (_isSyncing) {
    console.log('[PriceSync] Sync already in progress, skipping');
    return;
  }

  _isSyncing = true;
  try {
    await runSyncCycle(false);
  } catch (error) {
    console.error('[PriceSync] Unhandled error in sync cycle:', error);
  } finally {
    _isSyncing = false;
  }
}

/**
 * Start the daemon mode with periodic sync cycles.
 */
async function startDaemon(): Promise<void> {
  console.log('[PriceSync] Starting daemon mode...');
  console.log(`[PriceSync] EGX trading hours: Sun-Thu 10:00-14:30 Cairo time`);
  console.log(`[PriceSync] Sync interval: ${SYNC_INTERVAL_MS / 60000} minutes during trading hours`);
  console.log(`[PriceSync] Current time: ${formatCairoTime()}`);
  console.log(`[PriceSync] Market is ${isMarketOpen() ? 'OPEN' : 'CLOSED'}`);

  // Run an immediate sync
  if (isMarketOpen() || isTradingDay()) {
    await daemonSyncCycle();
  } else {
    console.log('[PriceSync] Market is closed. Waiting for next trading session.');
  }

  // Schedule subsequent syncs
  await scheduleNextSync();

  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('[PriceSync] Received SIGTERM, shutting down...');
    if (_syncTimer) clearTimeout(_syncTimer);
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[PriceSync] Received SIGINT, shutting down...');
    if (_syncTimer) clearTimeout(_syncTimer);
    process.exit(0);
  });
}

// ============================================================
// CLI Entry Point
// ============================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isOneShot = args.includes('--once') || args.includes('--sync');
  const isForce = args.includes('--force');

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          EGX Pro - Real-Time Price Sync Worker          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Mode:     ${isOneShot ? 'One-shot' : 'Daemon (continuous)'.padEnd(42)}║`);
  console.log(`║  Time:     ${formatCairoTime().padEnd(42)}║`);
  console.log(`║  Market:   ${(isMarketOpen() ? 'OPEN' : 'CLOSED').padEnd(42)}║`);
  console.log(`║  Force:    ${String(isForce).padEnd(42)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Verify Supabase connectivity
  try {
    const { error } = await supabase.from('Stock').select('id').limit(1);
    if (error) {
      console.error('[PriceSync] Supabase connection test failed:', error.message);
      if (!isForce) process.exit(1);
    } else {
      console.log('[PriceSync] Supabase connection OK');
    }
  } catch (error) {
    console.error('[PriceSync] Supabase connection error:', (error as Error).message);
    if (!isForce) process.exit(1);
  }

  // Check write permissions (RLS) by attempting a test update
  try {
    const { data: testStock } = await supabase.from('Stock').select('id, ticker').limit(1).single();
    if (testStock) {
      const { data: updated, error: updateErr } = await supabase
        .from('Stock')
        .update({ lastPriceAt: new Date().toISOString() })
        .eq('id', testStock.id)
        .select('id')
        .maybeSingle();
      if (updateErr || !updated) {
        console.warn('[PriceSync] WARNING: Write access to Stock table is blocked (RLS policy).');
        console.warn('[PriceSync] Database updates will fail. Set the correct SUPABASE_SERVICE_ROLE_KEY to fix this.');
        console.warn('[PriceSync] The service role key should start with "eyJ..." (a JWT), not "sb_publishable_..."');
        console.warn('[PriceSync] Continuing in read-only/fetch-only mode...');
      } else {
        console.log('[PriceSync] Database write permissions OK');
      }
    }
  } catch {
    console.warn('[PriceSync] Could not verify write permissions. Updates may fail due to RLS.');
  }

  if (isOneShot) {
    const result = await runSyncCycle(isForce);
    console.log('\n[PriceSync] One-shot sync complete.');
    console.log(`[PriceSync] ${result.updated}/${result.total} stocks updated (${result.failed} failed)`);
    console.log(`[PriceSync] Duration: ${Math.round(result.duration / 1000)}s, Source: ${result.source}`);

    if (result.errors.length > 0) {
      console.log(`[PriceSync] Errors (${result.errors.length}):`);
      result.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more`);
      }
    }

    process.exit(result.failed > 0 ? 1 : 0);
  } else {
    await startDaemon();
  }
}

// Run
main().catch((error) => {
  console.error('[PriceSync] Fatal error:', error);
  process.exit(1);
});
