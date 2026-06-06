/**
 * Supabase Client for Server-Side Use
 * Used in all API routes instead of Prisma
 * Service role key bypasses RLS for server-side operations
 *
 * Note: If SUPABASE_SERVICE_ROLE_KEY is not a real service role key
 * (e.g., same as the anon/publishable key), queries may fail due to RLS.
 * All API routes must handle Supabase failures gracefully with fallbacks.
 *
 * Vercel Deployment: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * must be set as environment variables in Vercel project settings.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client only if both URL and key are available
// Otherwise create a dummy client that will gracefully fail on queries
let supabaseClient: SupabaseClient

if (supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '') {
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
} else {
  // Create a placeholder client that won't crash the app
  // All queries will fail gracefully and fallback to hardcoded data
  supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabase = supabaseClient

/**
 * Check if Supabase is properly configured with real credentials
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'))
}

/**
 * Check if Supabase is reachable and queries can succeed.
 * Returns true if a simple query works, false otherwise.
 */
export async function isSupabaseReachable(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const { error } = await supabase
      .from('Stock')
      .select('id')
      .limit(1)
    return !error
  } catch {
    return false
  }
}

// Type helpers for Supabase tables
export interface SupabaseStock {
  id: string;
  ticker: string;
  name: string;
  nameAr: string;
  sector: string;
  industry: string;
  marketCap: number;
  price: number;
  sharesOutstanding: number;
  beta: number;
  egx30Beta: number;
  dividendYield: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  bookValuePerShare: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: number;
  exchange: string;
  currency: string;
  listedDate: string | null;
  description: string;
  descriptionAr: string;
  logo: string | null;
  lastPriceAt: string | null;
  lastFinancialsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseFinancialData {
  id: string;
  stockId: string;
  year: number;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
  operatingCashflow: number;
  freeCashflow: number;
  grossMargin: number;
  operatingMargin: number;
  profitMargin: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  evToEbitda: number;
  eps: number;
  bookValuePerShare: number;
  revenueGrowth: number;
  earningsGrowth: number;
  createdAt: string;
}

export interface SupabasePriceHistory {
  id: string;
  stockId: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface SupabaseTechnicalIndicator {
  id: string;
  stockId: string;
  date: string;
  rsi14: number;
  macdLine: number;
  macdSignal: number;
  macdHist: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  atr14: number;
  adx14: number;
  stochasticK: number;
  stochasticD: number;
  williamsR: number;
  cci14: number;
  obv: number;
}

export interface SupabaseSectorStats {
  id: string;
  sector: string;
  sectorAr: string;
  stockCount: number;
  totalMarketCap: number;
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgROA: number;
  avgDebtEquity: number;
  avgEVEbitda: number;
  weightedPE: number;
  weightedPB: number;
  avgDividendYield: number;
  updatedAt: string;
}

export interface SupabaseValuationResult {
  id: string;
  stockId: string;
  model: string;
  fairValue: number;
  upsideDownside: number;
  confidence: number;
  assumptions: Record<string, number | string>;
  createdAt: string;
}

export interface SupabaseMarketParams {
  id: string;
  riskFreeRate: number;
  equityRiskPremium: number;
  inflationRate: number;
  gdpGrowthRate: number;
  updatedAt: string;
}
