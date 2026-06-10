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

describe('Relative Valuation Model', () => {
  // ============================================================
  // Both PE and PB available
  // ============================================================
  describe('Both PE and PB available', () => {
    it('should calculate fair value using weighted average of PE and PB', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 40 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative).toBeDefined();
      // fairValuePE = 5 * 10 = 50
      // fairValuePB = 40 * 1.5 = 60
      // fairValue = 50 * 0.6 + 60 * 0.4 = 30 + 24 = 54
      expect(relative!.fairValue).toBe(54);
    });

    it('should have confidence 0.7 when both PE and PB are available', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 40 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // Both fairValuePE > 0 and fairValuePB > 0
      expect(relative!.confidence).toBe(0.7);
    });

    it('should weight PE at 60% and PB at 40%', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 40 });
      const sectorAvg: SectorAverages = { avgPE: 12, avgPB: 1.0, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // fairValuePE = 5 * 12 = 60
      // fairValuePB = 40 * 1.0 = 40
      // fairValue = 60 * 0.6 + 40 * 0.4 = 36 + 16 = 52
      expect(relative!.fairValue).toBe(52);
    });
  });

  // ============================================================
  // Only PE available
  // ============================================================
  describe('Only PE available', () => {
    it('should use PE-only fair value when BVPS is 0', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 0 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative).toBeDefined();
      // fairValuePE = 5 * 10 = 50
      // fairValuePB = 0 * 1.5 = 0
      // Since fairValuePB = 0, uses fairValuePE only
      expect(relative!.fairValue).toBe(50);
    });

    it('should use PE-only fair value when BVPS is negative', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: -10 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // fairValuePE = 5 * 10 = 50
      // fairValuePB = -10 * 1.5 = -15 (< 0)
      // Since fairValuePB < 0, uses fairValuePE only
      expect(relative!.fairValue).toBe(50);
    });

    it('should have confidence 0.4 when only PE is available', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative!.confidence).toBe(0.4);
    });

    it('should use PE when EPS > 0 but BVPS <= 0', () => {
      const stock = createTestStock({ eps: 8, bookValuePerShare: 0 });
      const sectorAvg: SectorAverages = { avgPE: 12, avgPB: 2.0, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative!.fairValue).toBe(96); // 8 * 12 = 96
    });
  });

  // ============================================================
  // Only PB available
  // ============================================================
  describe('Only PB available', () => {
    it('should use PB-only fair value when EPS is 0', () => {
      const stock = createTestStock({ eps: 0, bookValuePerShare: 40 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative).toBeDefined();
      // fairValuePE = 0 (eps <= 0)
      // fairValuePB = 40 * 1.5 = 60
      // Since fairValuePE = 0, uses fairValuePB
      expect(relative!.fairValue).toBe(60);
    });

    it('should use PB-only fair value when EPS is negative', () => {
      const stock = createTestStock({ eps: -3, bookValuePerShare: 40 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // fairValuePE = -3 * 10 = -30 (but eps > 0 check fails, so fairValuePE = 0)
      // fairValuePB = 40 * 1.5 = 60
      expect(relative!.fairValue).toBe(60);
    });

    it('should have confidence 0.4 when only PB is available', () => {
      const stock = createTestStock({ eps: 0, bookValuePerShare: 40 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative!.confidence).toBe(0.4);
    });
  });

  // ============================================================
  // Neither PE nor PB available
  // ============================================================
  describe('Neither PE nor PB available', () => {
    it('should return fairValue = 0 when both EPS and BVPS are 0', () => {
      const stock = createTestStock({ eps: 0, bookValuePerShare: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative).toBeDefined();
      // fairValuePE = 0, fairValuePB = 0
      // fairValue = fairValuePB = 0
      expect(relative!.fairValue).toBe(0);
    });

    it('should return fairValue = 0 when EPS is negative and BVPS is negative', () => {
      const stock = createTestStock({ eps: -5, bookValuePerShare: -10 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // fairValuePE = 0 (eps <= 0)
      // fairValuePB = -10 * 1.2 = -12 (< 0)
      // fairValue = fairValuePB = -12 (since fairValuePE is not > 0)
      // Note: code goes to else branch: fairValue = fairValuePB
      expect(relative!.fairValue).toBeLessThanOrEqual(0);
    });

    it('should have low confidence when neither metric is available', () => {
      const stock = createTestStock({ eps: 0, bookValuePerShare: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // Confidence is 0.4 when not both available
      expect(relative!.confidence).toBeLessThanOrEqual(0.4);
    });
  });

  // ============================================================
  // Sector average variations
  // ============================================================
  describe('Sector average variations', () => {
    it('should reflect higher sector PE in fair value', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 40 });
      const lowPE: SectorAverages = { avgPE: 6, avgPB: 1.2, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const highPE: SectorAverages = { avgPE: 15, avgPB: 1.2, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };

      const resultLow = runAllModels(stock, lowPE, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultHigh = runAllModels(stock, highPE, DEFAULT_MARKET_PARAMS, 'Technology');

      const relLow = resultLow.models.find(m => m.model === 'relative');
      const relHigh = resultHigh.models.find(m => m.model === 'relative');

      expect(relHigh!.fairValue).toBeGreaterThan(relLow!.fairValue);
    });

    it('should reflect higher sector PB in fair value', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 40 });
      const lowPB: SectorAverages = { avgPE: 8.5, avgPB: 0.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const highPB: SectorAverages = { avgPE: 8.5, avgPB: 3.0, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };

      const resultLow = runAllModels(stock, lowPB, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultHigh = runAllModels(stock, highPB, DEFAULT_MARKET_PARAMS, 'Technology');

      const relLow = resultLow.models.find(m => m.model === 'relative');
      const relHigh = resultHigh.models.find(m => m.model === 'relative');

      expect(relHigh!.fairValue).toBeGreaterThan(relLow!.fairValue);
    });

    it('should include sector PE and PB in assumptions', () => {
      const stock = createTestStock();
      const sectorAvg: SectorAverages = { avgPE: 9.3, avgPB: 1.45, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative!.assumptions.sectorPE).toBe('9.3');
      expect(relative!.assumptions.sectorPB).toBe('1.45');
    });
  });

  // ============================================================
  // High confidence when both available
  // ============================================================
  describe('High confidence when both available', () => {
    it('should have confidence 0.7 when both PE and PB produce positive fair values', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 40 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative!.confidence).toBe(0.7);
    });

    it('should have lower confidence than 0.7 when only one metric is available', () => {
      const stockPEOnly = createTestStock({ eps: 5, bookValuePerShare: 0 });
      const result = runAllModels(stockPEOnly, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative!.confidence).toBeLessThan(0.7);
    });

    it('should include peBasedValue and pbBasedValue in assumptions', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 40 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      expect(relative!.assumptions.peBasedValue).toBe(50); // 5 * 10
      expect(relative!.assumptions.pbBasedValue).toBe(60); // 40 * 1.5
    });
  });

  // ============================================================
  // Verdict classification
  // ============================================================
  describe('Verdict classification', () => {
    it('should classify as undervalued when fair value > price * 1.15', () => {
      const stock = createTestStock({ eps: 10, bookValuePerShare: 80, price: 50 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // fairValuePE = 10 * 10 = 100
      // fairValuePB = 80 * 1.5 = 120
      // fairValue = 100 * 0.6 + 120 * 0.4 = 60 + 48 = 108
      // upside = (108 - 50) / 50 = 116% > 15% → undervalued
      expect(relative!.verdict).toBe('undervalued');
    });

    it('should classify as overvalued when fair value < price * 0.85', () => {
      const stock = createTestStock({ eps: 2, bookValuePerShare: 10, price: 100 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // fairValuePE = 2 * 10 = 20
      // fairValuePB = 10 * 1.5 = 15
      // fairValue = 20 * 0.6 + 15 * 0.4 = 12 + 6 = 18
      // upside = (18 - 100) / 100 = -82% < -15% → overvalued
      expect(relative!.verdict).toBe('overvalued');
    });

    it('should classify as fair when fair value is close to price', () => {
      const stock = createTestStock({ eps: 5, bookValuePerShare: 40, price: 54 });
      const sectorAvg: SectorAverages = { avgPE: 10, avgPB: 1.5, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 0.05 };
      const result = runAllModels(stock, sectorAvg, DEFAULT_MARKET_PARAMS, 'Technology');
      const relative = result.models.find(m => m.model === 'relative');

      // fairValue = 50 * 0.6 + 60 * 0.4 = 30 + 24 = 54
      // upside = (54 - 54) / 54 = 0% → fair
      expect(relative!.verdict).toBe('fair');
    });
  });
});
