// ============================================================
// EGX Pro - Shared Types
// ============================================================

export interface StockData {
  id: string;
  ticker: string;
  name: string;
  nameAr: string;
  sector: string;
  industry: string;
  price: number;
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  bookValuePerShare: number;
  dividendYield: number;
  beta: number;
  sharesOutstanding: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: number;
  lastPriceAt: string | null;
  description: string;
  descriptionAr: string;
}

export interface ValuationModelResult {
  model: string;
  modelName: string;
  fairValue: number;
  upsideDownside: number;
  confidence: number;
  assumptions: Record<string, number | string>;
  verdict: 'undervalued' | 'fair' | 'overvalued';
}

export interface StockDetail {
  stock: StockData & {
    financialData: Array<{
      year: number;
      revenue: number;
      netIncome: number;
      totalAssets: number;
      totalEquity: number;
      totalDebt: number;
      roe: number;
      roa: number;
      debtToEquity: number;
      grossMargin: number;
      operatingMargin: number;
      profitMargin: number;
      eps: number;
      bookValuePerShare: number;
      operatingCashflow?: number;
      freeCashflow?: number;
      revenueGrowth?: number;
      earningsGrowth?: number;
      evToEbitda?: number;
    }>;
    priceHistory: Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    technicalIndicators: Array<{
      date: string;
      rsi14?: number;
      macdLine?: number;
      macdSignal?: number;
      macdHist?: number;
      macdHistogram?: number;
      bbUpper?: number;
      bbMiddle?: number;
      bbLower?: number;
      sma20?: number;
      sma50?: number;
      sma200?: number;
    }>;
  };
  valuation: {
    ticker: string;
    currentPrice: number;
    models: ValuationModelResult[];
    averageFairValue: number;
    medianFairValue: number;
    averageUpside: number;
    overallVerdict: string;
    confidenceScore: number;
    horizonAdjustedFairValue?: number;
    horizonSpecificVerdict?: string;
    horizon?: 'short' | 'medium' | 'long';
  } | null;
  sectorAvg: {
    avgPE: number;
    avgPB: number;
    avgROE: number;
    avgEVEbitda: number;
  };
}

export interface SectorData {
  sector: string;
  sectorAr: string;
  stockCount: number;
  totalMarketCap: number;
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgDividendYield: number;
}

export type PageView = 'dashboard' | 'stocks' | 'sectors' | 'watchlist' | 'stock-detail';
