/**
 * EGX Data Service - Comprehensive real-time data fetching and updating system
 * Fetches from Yahoo Finance API (.CA = Cairo exchange), falls back to web search,
 * stores results in Supabase database.
 *
 * Key functions:
 * - fetchStockPrice(yahooSymbol)       → StockPrice | null
 * - batchFetchPrices(tickers[])        → Map<string, StockPrice>
 * - fetchFinancialData(yahooSymbol)    → FinancialData | null
 * - refreshAllStockPrices()            → RefreshResult
 * - refreshFinancialData(ticker)       → RefreshResult
 * - computeTechnicalIndicators(ticker) → void
 * - recomputeSectorStats()             → void
 * - seedAllStocks()                    → SeedResult
 */

import { supabase } from '@/lib/supabase';
import { EGX_STOCKS, type EGXStockMaster } from './egx-stocks-master';
import { needsPriceRefresh, needsFinancialsRefresh } from '@/lib/market-hours';

// ============================================================
// Rate Limiting
// ============================================================

const MIN_DELAY_BETWEEN_REQUESTS_MS = 200; // 200ms between Yahoo requests
let _lastRequestTime = 0;

async function rateLimitedDelay(): Promise<void> {
  const now = Date.now();
  const elapsed = now - _lastRequestTime;
  if (elapsed < MIN_DELAY_BETWEEN_REQUESTS_MS) {
    await sleep(MIN_DELAY_BETWEEN_REQUESTS_MS - elapsed);
  }
  _lastRequestTime = Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Exported Data Types
// ============================================================

export interface StockPrice {
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

export interface FinancialData {
  price: number;
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  bookValuePerShare: number;
  sharesOutstanding: number;
  beta: number;
  dividendYield: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  evToEbitda: number;
  grossMargin: number;
  operatingMargin: number;
  profitMargin: number;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
  operatingCashflow: number;
  freeCashflow: number;
}

export interface PriceHistoryPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface RefreshResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ ticker: string; error: string }>;
  duration: number;
}

export interface SeedResult {
  created: number;
  updated: number;
  skipped: number;
}

// ============================================================
// Yahoo Finance API Response Types
// ============================================================

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        regularMarketVolume?: number;
        regularMarketOpen?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        currency?: string;
      };
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

interface YahooQuoteSummary {
  quoteSummary?: {
    result?: Array<{
      financialData?: {
        currentPrice?: { raw?: number };
        totalRevenue?: { raw?: number };
        totalDebt?: { raw?: number };
        totalCash?: { raw?: number };
        revenueGrowth?: { raw?: number };
        earningsGrowth?: { raw?: number };
        grossMargins?: { raw?: number };
        operatingMargins?: { raw?: number };
        profitMargins?: { raw?: number };
        returnOnAssets?: { raw?: number };
        returnOnEquity?: { raw?: number };
        debtToEquity?: { raw?: number };
      };
      defaultKeyStatistics?: {
        marketCap?: { raw?: number };
        enterpriseValue?: { raw?: number };
        forwardPE?: { raw?: number };
        trailingPE?: { raw?: number };
        priceToBook?: { raw?: number };
        enterpriseToEbitda?: { raw?: number };
        beta?: { raw?: number };
        sharesOutstanding?: { raw?: number };
        bookValue?: { raw?: number };
        trailingEps?: { raw?: number };
        dividendYield?: { raw?: number };
      };
      incomeStatementHistory?: {
        incomeStatementHistory?: Array<{
          endDate?: { fmt?: string };
          totalRevenue?: { raw?: number };
          netIncome?: { raw?: number };
        }>;
      };
      balanceSheetHistory?: {
        balanceSheetStatements?: Array<{
          endDate?: { fmt?: string };
          totalAssets?: { raw?: number };
          totalLiabilities?: { raw?: number };
          totalStockholderEquity?: { raw?: number };
          longTermDebt?: { raw?: number };
          cash?: { raw?: number };
        }>;
      };
      cashflowStatementHistory?: {
        cashflowStatements?: Array<{
          endDate?: { fmt?: string };
          operatingCashflow?: { raw?: number };
          capitalExpenditures?: { raw?: number };
          freeCashflow?: { raw?: number };
        }>;
      };
    }>;
    error?: unknown;
  };
}

// ============================================================
// In-Memory Cache
// ============================================================

const _priceCache = new Map<string, { data: StockPrice; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedPrice(yahooSymbol: string): StockPrice | null {
  const cached = _priceCache.get(yahooSymbol);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    _priceCache.delete(yahooSymbol);
    return null;
  }
  return cached.data;
}

function setCachedPrice(yahooSymbol: string, data: StockPrice): void {
  _priceCache.set(yahooSymbol, { data, timestamp: Date.now() });
}

// ============================================================
// Yahoo Finance Fetch Functions
// ============================================================

/**
 * Fetch current price and basic quote data from Yahoo Finance chart API
 * Yahoo Finance uses .CA suffix for Cairo exchange (e.g. COMI.CA, ETEL.CA)
 */
async function fetchPriceFromYahoo(yahooSymbol: string): Promise<StockPrice | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;

  try {
    await rateLimitedDelay();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
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

    return {
      price: meta.regularMarketPrice ?? 0,
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

/**
 * Fetch price history from Yahoo Finance
 */
async function fetchPriceHistoryFromYahoo(
  yahooSymbol: string,
  range: string = '1y',
  interval: string = '1d',
): Promise<PriceHistoryPoint[] | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=${interval}`;

  try {
    await rateLimitedDelay();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[YahooHistory] ${yahooSymbol}: HTTP ${response.status}`);
      return null;
    }

    const json: YahooChartResponse = await response.json();
    const result = json?.chart?.result?.[0];
    if (!result?.timestamp || !result.indicators?.quote?.[0]) return null;

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const adjCloses = result.indicators?.adjclose?.[0]?.adjclose;

    const history: PriceHistoryPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quotes.close?.[i];
      if (close == null) continue;

      history.push({
        date: new Date((timestamps[i] ?? 0) * 1000),
        open: quotes.open?.[i] ?? close,
        high: quotes.high?.[i] ?? close,
        low: quotes.low?.[i] ?? close,
        close,
        volume: quotes.volume?.[i] ?? 0,
        adjClose: adjCloses?.[i] ?? close,
      });
    }

    return history;
  } catch (error) {
    console.warn(`[YahooHistory] ${yahooSymbol}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Fetch detailed financial data from Yahoo Finance quote summary API
 */
async function fetchFinancialsFromYahoo(yahooSymbol: string): Promise<FinancialData | null> {
  const modules = 'financialData,defaultKeyStatistics,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory';
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}?modules=${modules}`;

  try {
    await rateLimitedDelay();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[YahooQuote] ${yahooSymbol}: HTTP ${response.status}`);
      return null;
    }

    const json: YahooQuoteSummary = await response.json();
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return null;

    const fd = result.financialData;
    const ks = result.defaultKeyStatistics;
    const bs = result.balanceSheetHistory?.balanceSheetStatements?.[0];
    const is = result.incomeStatementHistory?.incomeStatementHistory?.[0];
    const cf = result.cashflowStatementHistory?.cashflowStatements?.[0];

    return {
      price: fd?.currentPrice?.raw ?? 0,
      marketCap: ks?.marketCap?.raw ?? 0,
      peRatio: ks?.trailingPE?.raw ?? 0,
      pbRatio: ks?.priceToBook?.raw ?? 0,
      eps: ks?.trailingEps?.raw ?? 0,
      bookValuePerShare: ks?.bookValue?.raw ?? 0,
      sharesOutstanding: ks?.sharesOutstanding?.raw ?? 0,
      beta: ks?.beta?.raw ?? 1.0,
      dividendYield: ks?.dividendYield?.raw ?? 0,
      roe: fd?.returnOnEquity?.raw ?? 0,
      roa: fd?.returnOnAssets?.raw ?? 0,
      debtToEquity: fd?.debtToEquity?.raw ?? 0,
      evToEbitda: ks?.enterpriseToEbitda?.raw ?? 0,
      grossMargin: fd?.grossMargins?.raw ?? 0,
      operatingMargin: fd?.operatingMargins?.raw ?? 0,
      profitMargin: fd?.profitMargins?.raw ?? 0,
      revenue: fd?.totalRevenue?.raw ?? 0,
      netIncome: is?.netIncome?.raw ?? 0,
      totalAssets: bs?.totalAssets?.raw ?? 0,
      totalEquity: bs?.totalStockholderEquity?.raw ?? 0,
      totalDebt: fd?.totalDebt?.raw ?? 0,
      operatingCashflow: cf?.operatingCashflow?.raw ?? 0,
      freeCashflow: cf?.freeCashflow?.raw ?? 0,
    };
  } catch (error) {
    console.warn(`[YahooQuote] ${yahooSymbol}: ${(error as Error).message}`);
    return null;
  }
}

// ============================================================
// Web Search Fallback (using z-ai-web-dev-sdk)
// ============================================================

async function fetchPriceFromWebSearch(ticker: string): Promise<StockPrice | null> {
  try {
    // Dynamic import - z-ai-web-dev-sdk may not be available in all environments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ZAI: any;
    try {
      ZAI = (await import('z-ai-web-dev-sdk' as string)).default;
    } catch {
      return null; // SDK not available
    }
    const zai = await ZAI.create();
    const results = await zai.functions.invoke('web_search', {
      query: `EGX ${ticker} stock price today Egyptian Exchange`,
      num: 5,
    });

    if (!results || results.length === 0) return null;

    for (const result of results) {
      const text = `${result.name} ${result.snippet}`;
      const priceMatch = text.match(/EGP\s*([\d,.]+)/i) || text.match(/price[:\s]*EGP\s*([\d,.]+)/i);
      if (priceMatch) {
        const price = parseFloat((priceMatch[1] ?? '').replace(/,/g, ''));
        if (!isNaN(price) && price > 0) {
          return {
            price,
            open: 0,
            high: 0,
            low: 0,
            close: price,
            volume: 0,
            previousClose: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(`[WebSearch] ${ticker}: ${(error as Error).message}`);
    return null;
  }
}

// ============================================================
// Supabase Helper Operations
// ============================================================

async function ensureStockExists(stock: EGXStockMaster): Promise<string> {
  const { data: existing } = await supabase
    .from('Stock')
    .select('id')
    .eq('ticker', stock.ticker)
    .single();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('Stock')
    .insert({
      ticker: stock.ticker,
      name: stock.name,
      nameAr: stock.nameAr,
      sector: stock.sector,
      industry: stock.industry,
      exchange: 'EGX',
      currency: 'EGP',
      description: stock.description,
      descriptionAr: stock.descriptionAr,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[DataService] Error creating stock ${stock.ticker}:`, error.message);
    // Try to get existing again (race condition)
    const { data: retry } = await supabase
      .from('Stock')
      .select('id')
      .eq('ticker', stock.ticker)
      .single();
    return retry?.id || stock.ticker;
  }

  return data?.id || stock.ticker;
}

async function updateStockPriceInDb(stockId: string, price: StockPrice, financials?: FinancialData): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (price.price > 0) updateData.price = price.price;
  if (price.fiftyTwoWeekHigh > 0) updateData.fiftyTwoWeekHigh = price.fiftyTwoWeekHigh;
  if (price.fiftyTwoWeekLow > 0) updateData.fiftyTwoWeekLow = price.fiftyTwoWeekLow;
  if (price.volume > 0) updateData.avgVolume = price.volume;

  // Merge financial data if provided
  if (financials) {
    if (financials.marketCap > 0) updateData.marketCap = financials.marketCap;
    if (financials.sharesOutstanding > 0) updateData.sharesOutstanding = financials.sharesOutstanding;
    if (financials.beta > 0) updateData.beta = financials.beta;
    if (financials.dividendYield > 0) updateData.dividendYield = financials.dividendYield * 100;
    if (financials.peRatio > 0) updateData.peRatio = financials.peRatio;
    if (financials.pbRatio > 0) updateData.pbRatio = financials.pbRatio;
    if (financials.eps > 0) updateData.eps = financials.eps;
    if (financials.bookValuePerShare > 0) updateData.bookValuePerShare = financials.bookValuePerShare;
  }

  // Derived metrics
  if (price.price && financials?.bookValuePerShare && financials.bookValuePerShare > 0) {
    updateData.pbRatio = price.price / financials.bookValuePerShare;
  }
  if (price.price && financials?.eps && financials.eps > 0) {
    updateData.peRatio = price.price / financials.eps;
  }

  updateData.lastPriceAt = new Date().toISOString();

  if (Object.keys(updateData).length > 1) {
    const { error } = await supabase
      .from('Stock')
      .update(updateData)
      .eq('id', stockId);

    if (error) {
      console.error(`[DataService] Error updating stock ${stockId}:`, error.message);
    }
  }
}

async function updateStockFinancialsInDb(stockId: string, data: FinancialData): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (data.marketCap > 0) updateData.marketCap = data.marketCap;
  if (data.sharesOutstanding > 0) updateData.sharesOutstanding = data.sharesOutstanding;
  if (data.beta > 0) updateData.beta = data.beta;
  if (data.peRatio > 0) updateData.peRatio = data.peRatio;
  if (data.pbRatio > 0) updateData.pbRatio = data.pbRatio;
  if (data.eps > 0) updateData.eps = data.eps;
  if (data.bookValuePerShare > 0) updateData.bookValuePerShare = data.bookValuePerShare;
  if (data.dividendYield > 0) updateData.dividendYield = data.dividendYield * 100;
  if (data.price > 0) updateData.price = data.price;

  updateData.lastFinancialsAt = new Date().toISOString();

  if (Object.keys(updateData).length > 1) {
    const { error } = await supabase
      .from('Stock')
      .update(updateData)
      .eq('id', stockId);

    if (error) {
      console.error(`[DataService] Error updating financials for ${stockId}:`, error.message);
    }
  }
}

async function storePriceHistory(stockId: string, history: PriceHistoryPoint[]): Promise<number> {
  let stored = 0;

  for (const point of history) {
    try {
      const dateOnly = new Date(point.date);
      dateOnly.setHours(0, 0, 0, 0);
      const dateStr = dateOnly.toISOString().split('T')[0];

      // Check if entry exists
      const { data: existing } = await supabase
        .from('PriceHistory')
        .select('id')
        .eq('stockId', stockId)
        .eq('date', dateStr)
        .single();

      if (existing) {
        // Update
        await supabase
          .from('PriceHistory')
          .update({
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
            volume: point.volume,
            adjClose: point.adjClose,
          })
          .eq('id', existing.id);
      } else {
        // Insert
        await supabase
          .from('PriceHistory')
          .insert({
            stockId,
            date: dateStr,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
            volume: point.volume,
            adjClose: point.adjClose,
          });
      }
      stored++;
    } catch {
      // Skip duplicates / invalid entries
    }
  }

  return stored;
}

// ============================================================
// Public API - Single Stock Operations
// ============================================================

/**
 * Fetch real-time prices from Yahoo Finance (.CA = Cairo exchange)
 * Falls back to web search if Yahoo is rate-limited
 */
export async function fetchStockPrice(yahooSymbol: string): Promise<StockPrice | null> {
  // Check cache first
  const cached = getCachedPrice(yahooSymbol);
  if (cached) return cached;

  // Extract ticker from yahooSymbol (remove .CA suffix)
  const ticker = yahooSymbol.replace('.CA', '');

  // Try Yahoo Finance first
  let data = await fetchPriceFromYahoo(yahooSymbol);

  // Fallback to web search if Yahoo is rate-limited
  if (!data) {
    console.log(`[DataService] Yahoo failed for ${ticker}, trying web search...`);
    data = await fetchPriceFromWebSearch(ticker);
  }

  if (!data) return null;

  // Cache the result
  setCachedPrice(yahooSymbol, data);

  // Store in Supabase
  try {
    const stock = EGX_STOCKS.find(s => s.ticker === ticker);
    if (stock) {
      const stockId = await ensureStockExists(stock);
      await updateStockPriceInDb(stockId, data);
    }
  } catch (error) {
    console.error(`[DataService] DB error for ${ticker}: ${(error as Error).message}`);
  }

  return data;
}

/**
 * Batch fetch prices (with rate limiting)
 * Returns a Map of ticker → StockPrice
 */
export async function batchFetchPrices(tickers: string[]): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();

  for (const ticker of tickers) {
    const yahooSymbol = ticker.endsWith('.CA') ? ticker : `${ticker}.CA`;
    const cleanTicker = ticker.replace('.CA', '');

    const price = await fetchStockPrice(yahooSymbol);
    if (price) {
      results.set(cleanTicker, price);
    }
  }

  return results;
}

/**
 * Fetch financial data from Yahoo Finance
 */
export async function fetchFinancialData(yahooSymbol: string): Promise<FinancialData | null> {
  const ticker = yahooSymbol.replace('.CA', '');

  // Try Yahoo Finance
  let data = await fetchFinancialsFromYahoo(yahooSymbol);

  // If Yahoo failed, try to get price at least
  if (!data) {
    console.log(`[DataService] Yahoo financials failed for ${ticker}, trying web search...`);
    const priceData = await fetchPriceFromWebSearch(ticker);
    if (priceData) {
      data = {
        price: priceData.price,
        marketCap: 0,
        peRatio: 0,
        pbRatio: 0,
        eps: 0,
        bookValuePerShare: 0,
        sharesOutstanding: 0,
        beta: 1.0,
        dividendYield: 0,
        roe: 0,
        roa: 0,
        debtToEquity: 0,
        evToEbitda: 0,
        grossMargin: 0,
        operatingMargin: 0,
        profitMargin: 0,
        revenue: 0,
        netIncome: 0,
        totalAssets: 0,
        totalEquity: 0,
        totalDebt: 0,
        operatingCashflow: 0,
        freeCashflow: 0,
      };
    }
  }

  if (!data) return null;

  // Store in Supabase
  try {
    const stock = EGX_STOCKS.find(s => s.ticker === ticker);
    if (stock) {
      const stockId = await ensureStockExists(stock);
      await updateStockFinancialsInDb(stockId, data);
    }
  } catch (error) {
    console.error(`[DataService] DB error for ${ticker}: ${(error as Error).message}`);
  }

  return data;
}

/**
 * Full data refresh - update all stock prices
 */
export async function refreshAllStockPrices(
  stocks: EGXStockMaster[] = EGX_STOCKS,
  onProgress?: (completed: number, total: number) => void,
): Promise<RefreshResult> {
  const startTime = Date.now();
  const errors: Array<{ ticker: string; error: string }> = [];
  let succeeded = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    if (!stock) continue;
    try {
      const price = await fetchStockPrice(stock.yahooSymbol);
      if (price) {
        succeeded++;
      } else {
        errors.push({ ticker: stock.ticker, error: 'Failed to fetch price from all sources' });
      }
    } catch (error) {
      errors.push({ ticker: stock.ticker, error: (error as Error).message });
    }

    onProgress?.(i + 1, stocks.length);
  }

  return {
    total: stocks.length,
    succeeded,
    failed: errors.length,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Refresh financial data for a specific stock
 */
export async function refreshFinancialData(ticker: string): Promise<RefreshResult> {
  const startTime = Date.now();
  const stock = EGX_STOCKS.find(s => s.ticker === ticker);

  if (!stock) {
    return {
      total: 1,
      succeeded: 0,
      failed: 1,
      errors: [{ ticker, error: 'Stock not found in master list' }],
      duration: Date.now() - startTime,
    };
  }

  try {
    const data = await fetchFinancialData(stock.yahooSymbol);
    if (data) {
      return {
        total: 1,
        succeeded: 1,
        failed: 0,
        errors: [],
        duration: Date.now() - startTime,
      };
    } else {
      return {
        total: 1,
        succeeded: 0,
        failed: 1,
        errors: [{ ticker, error: 'Failed to fetch financials from all sources' }],
        duration: Date.now() - startTime,
      };
    }
  } catch (error) {
    return {
      total: 1,
      succeeded: 0,
      failed: 1,
      errors: [{ ticker, error: (error as Error).message }],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Refresh financials for all stocks with stale data
 */
export async function refreshAllFinancials(
  stocks: EGXStockMaster[] = EGX_STOCKS,
  onProgress?: (completed: number, total: number) => void,
): Promise<RefreshResult> {
  const startTime = Date.now();
  const errors: Array<{ ticker: string; error: string }> = [];
  let succeeded = 0;

  const staleStocks: EGXStockMaster[] = [];
  for (const stock of stocks) {
    try {
      const { data: existing } = await supabase
        .from('Stock')
        .select('lastFinancialsAt')
        .eq('ticker', stock.ticker)
        .single();

      if (needsFinancialsRefresh(existing?.lastFinancialsAt ? new Date(existing.lastFinancialsAt) : null)) {
        staleStocks.push(stock);
      }
    } catch {
      staleStocks.push(stock);
    }
  }

  console.log(`[DataService] Refreshing financials for ${staleStocks.length} stale stocks`);

  for (let i = 0; i < staleStocks.length; i++) {
    const stock = staleStocks[i];
    if (!stock) continue;
    try {
      const data = await fetchFinancialData(stock.yahooSymbol);
      if (data) {
        succeeded++;
      } else {
        errors.push({ ticker: stock.ticker, error: 'Failed to fetch financials' });
      }
    } catch (error) {
      errors.push({ ticker: stock.ticker, error: (error as Error).message });
    }
    onProgress?.(i + 1, staleStocks.length);
  }

  return {
    total: staleStocks.length,
    succeeded,
    failed: errors.length,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Refresh prices only for stocks with stale data
 */
export async function refreshStalePrices(
  onProgress?: (completed: number, total: number) => void,
): Promise<RefreshResult> {
  const startTime = Date.now();
  const errors: Array<{ ticker: string; error: string }> = [];
  let succeeded = 0;

  const staleStocks: EGXStockMaster[] = [];
  for (const stock of EGX_STOCKS) {
    try {
      const { data: existing } = await supabase
        .from('Stock')
        .select('lastPriceAt')
        .eq('ticker', stock.ticker)
        .single();

      if (needsPriceRefresh(existing?.lastPriceAt ? new Date(existing.lastPriceAt) : null)) {
        staleStocks.push(stock);
      }
    } catch {
      staleStocks.push(stock);
    }
  }

  console.log(`[DataService] Refreshing prices for ${staleStocks.length} stale stocks`);

  for (let i = 0; i < staleStocks.length; i++) {
    const stock = staleStocks[i];
    if (!stock) continue;
    try {
      const price = await fetchStockPrice(stock.yahooSymbol);
      if (price) {
        succeeded++;
      } else {
        errors.push({ ticker: stock.ticker, error: 'Failed to fetch price' });
      }
    } catch (error) {
      errors.push({ ticker: stock.ticker, error: (error as Error).message });
    }
    onProgress?.(i + 1, staleStocks.length);
  }

  return {
    total: staleStocks.length,
    succeeded,
    failed: errors.length,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Fetch and store price history for a single stock
 */
export async function fetchStockPriceHistory(
  stock: EGXStockMaster,
  range: string = '1y',
): Promise<{ success: boolean; stored: number; error?: string }> {
  const history = await fetchPriceHistoryFromYahoo(stock.yahooSymbol, range, '1d');

  if (!history || history.length === 0) {
    return { success: false, stored: 0, error: 'Failed to fetch price history' };
  }

  let storedCount = 0;
  try {
    const stockId = await ensureStockExists(stock);
    storedCount = await storePriceHistory(stockId, history);
  } catch (error) {
    console.error(`[DataService] DB error for ${stock.ticker}: ${(error as Error).message}`);
  }

  return { success: true, stored: storedCount };
}

/**
 * Fetch price history for all stocks (batch operation)
 */
export async function fetchAllPriceHistory(
  stocks: EGXStockMaster[] = EGX_STOCKS,
  range: string = '1y',
  onProgress?: (completed: number, total: number) => void,
): Promise<RefreshResult> {
  const startTime = Date.now();
  const errors: Array<{ ticker: string; error: string }> = [];
  let succeeded = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    if (!stock) continue;
    try {
      const result = await fetchStockPriceHistory(stock, range);
      if (result.success) {
        succeeded++;
      } else {
        errors.push({ ticker: stock.ticker, error: result.error ?? 'Unknown error' });
      }
    } catch (error) {
      errors.push({ ticker: stock.ticker, error: (error as Error).message });
    }
    onProgress?.(i + 1, stocks.length);
  }

  return {
    total: stocks.length,
    succeeded,
    failed: errors.length,
    errors,
    duration: Date.now() - startTime,
  };
}

// ============================================================
// Technical Indicators
// ============================================================

/**
 * Compute technical indicators from price history
 */
export async function computeTechnicalIndicators(ticker: string): Promise<void> {
  const { computeAndStoreIndicators } = await import('./technical-computer');

  const { data: stock } = await supabase
    .from('Stock')
    .select('id')
    .eq('ticker', ticker)
    .single();

  if (!stock) {
    console.warn(`[DataService] Stock ${ticker} not found in DB for technical computation`);
    return;
  }

  const { count } = await supabase
    .from('PriceHistory')
    .select('*', { count: 'exact', head: true })
    .eq('stockId', stock.id);

  if (!count || count < 20) {
    console.warn(`[DataService] ${ticker}: Only ${count || 0} price history points, need at least 20`);
    return;
  }

  const stored = await computeAndStoreIndicators(stock.id);
  console.log(`[DataService] ${ticker}: Computed and stored ${stored} technical indicator points`);
}

// ============================================================
// Sector Statistics
// ============================================================

/**
 * Recompute all sector statistics
 */
export async function recomputeSectorStats(): Promise<void> {
  const { getAllSectors } = await import('./egx-stocks-master');
  const sectors = getAllSectors();

  for (const sector of sectors) {
    const { data: stocks } = await supabase
      .from('Stock')
      .select('ticker, marketCap, peRatio, pbRatio, eps, bookValuePerShare, dividendYield')
      .eq('sector', sector)
      .gt('price', 0);

    if (!stocks || stocks.length === 0) {
      // Upsert empty sector stats
      const { data: existing } = await supabase
        .from('SectorStats')
        .select('id')
        .eq('sector', sector)
        .single();

      if (existing) {
        await supabase
          .from('SectorStats')
          .update({ stockCount: 0, totalMarketCap: 0 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('SectorStats')
          .insert({ sector, stockCount: 0, totalMarketCap: 0 });
      }
      continue;
    }

    const totalMarketCap = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
    const stocksWitPE = stocks.filter(s => s.peRatio > 0);
    const stocksWitPB = stocks.filter(s => s.pbRatio > 0);
    const stocksWitDY = stocks.filter(s => s.dividendYield > 0);

    const avgPE = stocksWitPE.length > 0
      ? stocksWitPE.reduce((sum, s) => sum + s.peRatio, 0) / stocksWitPE.length
      : 0;
    const avgPB = stocksWitPB.length > 0
      ? stocksWitPB.reduce((sum, s) => sum + s.pbRatio, 0) / stocksWitPB.length
      : 0;
    const avgDividendYield = stocksWitDY.length > 0
      ? stocksWitDY.reduce((sum, s) => sum + s.dividendYield, 0) / stocksWitDY.length
      : 0;

    // Market-cap weighted
    let weightedPE = 0;
    let weightedPB = 0;
    if (totalMarketCap > 0) {
      const peWeightSum = stocksWitPE.reduce((sum, s) => sum + (s.marketCap || 0), 0);
      weightedPE = peWeightSum > 0
        ? stocksWitPE.reduce((sum, s) => sum + s.peRatio * (s.marketCap || 0), 0) / peWeightSum
        : 0;

      const pbWeightSum = stocksWitPB.reduce((sum, s) => sum + (s.marketCap || 0), 0);
      weightedPB = pbWeightSum > 0
        ? stocksWitPB.reduce((sum, s) => sum + s.pbRatio * (s.marketCap || 0), 0) / pbWeightSum
        : 0;
    }

    // ROE approximation from EPS/BVPS
    const stocksWitROE = stocks.filter(s => s.eps > 0 && s.bookValuePerShare > 0);
    const avgROE = stocksWitROE.length > 0
      ? stocksWitROE.reduce((sum, s) => sum + (s.eps / s.bookValuePerShare) * 100, 0) / stocksWitROE.length
      : 0;

    // Upsert sector stats
    const { data: existing } = await supabase
      .from('SectorStats')
      .select('id')
      .eq('sector', sector)
      .single();

    const statsData = {
      stockCount: stocks.length,
      totalMarketCap,
      avgPE,
      avgPB,
      avgROE,
      avgROA: avgROE * 0.4,
      weightedPE,
      weightedPB,
      avgDividendYield,
    };

    if (existing) {
      await supabase
        .from('SectorStats')
        .update(statsData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('SectorStats')
        .insert({ sector, ...statsData });
    }
  }
}

// ============================================================
// Seed Database
// ============================================================

/**
 * Seed all stocks to Supabase from the master list
 */
export async function seedAllStocks(): Promise<SeedResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const stock of EGX_STOCKS) {
    try {
      const { data: existing } = await supabase
        .from('Stock')
        .select('id, name, sector, industry')
        .eq('ticker', stock.ticker)
        .single();

      if (existing) {
        if (existing.name !== stock.name || existing.sector !== stock.sector || existing.industry !== stock.industry) {
          await supabase
            .from('Stock')
            .update({
              name: stock.name,
              nameAr: stock.nameAr,
              sector: stock.sector,
              industry: stock.industry,
              description: stock.description,
              descriptionAr: stock.descriptionAr,
            })
            .eq('id', existing.id);
          updated++;
        } else {
          skipped++;
        }
      } else {
        await supabase
          .from('Stock')
          .insert({
            ticker: stock.ticker,
            name: stock.name,
            nameAr: stock.nameAr,
            sector: stock.sector,
            industry: stock.industry,
            exchange: 'EGX',
            currency: 'EGP',
            description: stock.description,
            descriptionAr: stock.descriptionAr,
          });
        created++;
      }
    } catch (error) {
      console.error(`[Seed] Error seeding ${stock.ticker}: ${(error as Error).message}`);
    }
  }

  console.log(`[Seed] Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  return { created, updated, skipped };
}

/** Legacy alias for backward compatibility */
export const seedStocksFromMaster = seedAllStocks;
