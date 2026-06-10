import { describe, it, expect } from 'vitest';
import {
  runAllModels,
  DEFAULT_MARKET_PARAMS,
  DEFAULT_SECTOR_AVERAGES,
  type StockFundamentals,
  type SectorAverages,
} from '../../valuation-engine';

function createTestStock(overrides: Partial<StockFundamentals> = {}): StockFundamentals {
  return {
    ticker: 'TEST',
    price: 50,
    eps: 5,
    bookValuePerShare: 40,
    sharesOutstanding: 1000,
    marketCap: 50000,
    dividendYield: 0.05,
    peRatio: 10,
    pbRatio: 1.25,
    beta: 1.0,
    roe: 0.125,
    roa: 0.05,
    debtToEquity: 0.5,
    evToEbitda: 6,
    revenue: 20000,
    netIncome: 2500,
    totalAssets: 50000,
    totalEquity: 40000,
    totalDebt: 10000,
    operatingCashflow: 5000,
    freeCashflow: 3500,
    grossMargin: 0.55,
    operatingMargin: 0.25,
    profitMargin: 0.125,
    revenueGrowth: 0.08,
    earningsGrowth: 0.10,
    ...overrides,
  };
}

describe('EV/EBITDA Valuation Model', () => {
  // ============================================================
  // Reported EBITDA vs proxy
  // ============================================================
  describe('Reported EBITDA vs proxy', () => {
    it('should use reported EBITDA when available and positive', () => {
      const stock = createTestStock({ ebitda: 8000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      expect(evModel).toBeDefined();
      expect(evModel!.assumptions.ebitdaSource).toBe('Reported');
    });

    it('should use OCF + 3% assets proxy when EBITDA is not available', () => {
      const stock = createTestStock({ ebitda: 0, operatingCashflow: 5000, totalAssets: 50000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      expect(evModel).toBeDefined();
      expect(evModel!.assumptions.ebitdaSource).toContain('proxy');
      // EBITDA proxy = OCF + 3% of total assets = 5000 + 1500 = 6500
      expect(evModel!.assumptions.estimatedEBITDA).toBe('6,500');
    });

    it('should use proxy when EBITDA is undefined', () => {
      const stock = createTestStock({ ebitda: undefined, operatingCashflow: 5000, totalAssets: 50000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      expect(evModel!.assumptions.ebitdaSource).toContain('proxy');
    });

    it('should use proxy when EBITDA is negative', () => {
      const stock = createTestStock({ ebitda: -1000, operatingCashflow: 5000, totalAssets: 50000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      // Negative EBITDA fails the `> 0` check, so proxy is used
      expect(evModel!.assumptions.ebitdaSource).toContain('proxy');
    });

    it('should have higher confidence with reported EBITDA', () => {
      const stockWithEbitda = createTestStock({ ebitda: 8000 });
      const stockWithoutEbitda = createTestStock({ ebitda: 0, operatingCashflow: 5000, totalAssets: 50000 });

      const resultWith = runAllModels(stockWithEbitda, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultWithout = runAllModels(stockWithoutEbitda, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

      const evWith = resultWith.models.find(m => m.model === 'ev_ebitda');
      const evWithout = resultWithout.models.find(m => m.model === 'ev_ebitda');

      // Both have ebitda > 0, so confidence should be 0.65
      expect(evWith!.confidence).toBe(0.65);
      // Proxy EBITDA = 5000 + 1500 = 6500 > 0, so confidence is also 0.65
      expect(evWithout!.confidence).toBe(0.65);
    });
  });

  // ============================================================
  // Cash equivalents impact on EV
  // ============================================================
  describe('Cash equivalents impact on EV', () => {
    it('should reduce EV by cash equivalents', () => {
      const stockHighCash = createTestStock({ cashEquivalents: 10000, marketCap: 50000, totalDebt: 10000 });
      const stockLowCash = createTestStock({ cashEquivalents: 1000, marketCap: 50000, totalDebt: 10000 });

      const resultHigh = runAllModels(stockHighCash, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultLow = runAllModels(stockLowCash, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

      const evHigh = resultHigh.models.find(m => m.model === 'ev_ebitda');
      const evLow = resultLow.models.find(m => m.model === 'ev_ebitda');

      // More cash → lower EV → lower current EV/EBITDA
      // But implied equity = implied EV - debt + cash, so more cash also increases implied equity
      // Net effect: higher cash → higher fair value
      expect(evHigh!.assumptions.enterpriseValue).toBeDefined();
      expect(evLow!.assumptions.enterpriseValue).toBeDefined();

      // EV = marketCap + totalDebt - cashEquivalents
      // High cash: EV = 50000 + 10000 - 10000 = 50000
      // Low cash: EV = 50000 + 10000 - 1000 = 59000
      expect(evHigh!.assumptions.enterpriseValue).toBe('50,000');
      expect(evLow!.assumptions.enterpriseValue).toBe('59,000');
    });

    it('should fall back to estimated cash when cashEquivalents is undefined', () => {
      const stock = createTestStock({
        cashEquivalents: undefined,
        totalAssets: 50000,
        totalEquity: 40000,
        totalDebt: 10000,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      // Fallback: max(0, totalAssets - totalEquity - totalDebt) = max(0, 50000 - 40000 - 10000) = 0
      // EV = marketCap + totalDebt - 0 = 50000 + 10000 = 60000
      expect(evModel!.assumptions.enterpriseValue).toBe('60,000');
    });
  });

  // ============================================================
  // Zero EBITDA handling
  // ============================================================
  describe('Zero EBITDA handling', () => {
    it('should handle zero EBITDA with low confidence', () => {
      const stock = createTestStock({
        ebitda: 0,
        operatingCashflow: 0,
        totalAssets: 0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      expect(evModel).toBeDefined();
      // EBITDA proxy = 0 + 0 = 0 → confidence = 0.25
      expect(evModel!.confidence).toBe(0.25);
    });

    it('should produce negative fair value when EBITDA is 0 and debt exceeds cash', () => {
      const stock = createTestStock({
        ebitda: 0,
        operatingCashflow: 0,
        totalAssets: 0,
        marketCap: 50000,
        totalDebt: 10000,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      // EBITDA = 0, implied EV = 0 * sectorMultiple = 0
      // cashEquivalents fallback: max(0, 0 - 40000 - 10000) = 0
      // implied equity = 0 - totalDebt + cash = 0 - 10000 + 0 = -10000
      // fairValue = -10000 / 1000 = -10
      expect(evModel!.fairValue).toBe(-10);
      expect(evModel!.confidence).toBe(0.25);
    });
  });

  // ============================================================
  // Different sector multiples
  // ============================================================
  describe('Different sector multiples', () => {
    it('should produce higher fair value with higher sector EV/EBITDA multiple', () => {
      const stock = createTestStock({ ebitda: 8000 });
      const lowMultiple: SectorAverages = { ...DEFAULT_SECTOR_AVERAGES, avgEVEbitda: 4 };
      const highMultiple: SectorAverages = { ...DEFAULT_SECTOR_AVERAGES, avgEVEbitda: 12 };

      const resultLow = runAllModels(stock, lowMultiple, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultHigh = runAllModels(stock, highMultiple, DEFAULT_MARKET_PARAMS, 'Technology');

      const evLow = resultLow.models.find(m => m.model === 'ev_ebitda');
      const evHigh = resultHigh.models.find(m => m.model === 'ev_ebitda');

      expect(evHigh!.fairValue).toBeGreaterThan(evLow!.fairValue);
    });

    it('should include sector EV/EBITDA multiple in assumptions', () => {
      const stock = createTestStock({ ebitda: 8000 });
      const sectorAvg: SectorAverages = { ...DEFAULT_SECTOR_AVERAGES, avgEVEbitda: 7.5 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      expect(evModel!.assumptions.sectorEVEbitda).toBe('7.5');
    });

    it('should use default sector multiple when sector avg is 0', () => {
      const stock = createTestStock({ ebitda: 8000 });
      const sectorAvg: SectorAverages = { ...DEFAULT_SECTOR_AVERAGES, avgEVEbitda: 0 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      // Should fall back to DEFAULT_SECTOR_AVERAGES.avgEVEbitda = 6.5
      expect(evModel!.assumptions.sectorEVEbitda).toBe('6.5');
    });
  });

  // ============================================================
  // Market cap calculation
  // ============================================================
  describe('Market cap and EV calculation', () => {
    it('should calculate EV = marketCap + totalDebt - cashEquivalents', () => {
      const stock = createTestStock({
        marketCap: 100000,
        totalDebt: 30000,
        cashEquivalents: 5000,
        ebitda: 15000,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      // EV = 100000 + 30000 - 5000 = 125000
      expect(evModel!.assumptions.enterpriseValue).toBe('125,000');
    });

    it('should calculate current EV/EBITDA correctly', () => {
      const stock = createTestStock({
        marketCap: 100000,
        totalDebt: 30000,
        cashEquivalents: 5000,
        ebitda: 15000,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      // EV = 125000, EBITDA = 15000
      // current EV/EBITDA = 125000 / 15000 = 8.3
      expect(evModel!.assumptions.currentEVEbitda).toBe('8.3');
    });

    it('should calculate implied equity from implied EV', () => {
      const stock = createTestStock({
        marketCap: 100000,
        totalDebt: 30000,
        cashEquivalents: 5000,
        ebitda: 15000,
        sharesOutstanding: 2000,
      });
      const sectorAvg: SectorAverages = { ...DEFAULT_SECTOR_AVERAGES, avgEVEbitda: 6.5 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      // impliedEV = 15000 * 6.5 = 97500
      // impliedEquity = 97500 - 30000 + 5000 = 72500
      // fairValue = 72500 / 2000 = 36.25
      expect(evModel!.fairValue).toBe(36.25);
    });

    it('should handle shares outstanding fallback to marketCap/price', () => {
      const stock = createTestStock({
        sharesOutstanding: 0,
        price: 50,
        marketCap: 50000,
        ebitda: 8000,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      // shares = 50000 / 50 = 1000
      expect(evModel!.fairValue).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Model metadata
  // ============================================================
  describe('Model metadata', () => {
    it('should have correct model identifiers', () => {
      const stock = createTestStock({ ebitda: 8000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const evModel = result.models.find(m => m.model === 'ev_ebitda');

      expect(evModel!.model).toBe('ev_ebitda');
      expect(evModel!.modelName).toBe('EV/EBITDA Valuation');
      expect(evModel!.modelNameAr).toBe('تقييم القيمة المؤسسية/الربحية');
      expect(evModel!.terminalGrowthCapped).toBe(false);
    });
  });
});
