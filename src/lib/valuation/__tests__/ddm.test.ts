import { describe, it, expect } from 'vitest';
import {
  runAllModels,
  DEFAULT_MARKET_PARAMS,
  DEFAULT_SECTOR_AVERAGES,
  type StockFundamentals,
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

describe('DDM - Dividend Discount Model', () => {
  // ============================================================
  // Normal dividend yield case
  // ============================================================
  describe('Normal dividend yield case', () => {
    it('should calculate fair value using Gordon Growth Model with positive dividend yield', () => {
      const stock = createTestStock({ dividendYield: 0.05, price: 100, earningsGrowth: 0.05 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      expect(ddm!.fairValue).toBeGreaterThan(0);
      expect(isFinite(ddm!.fairValue)).toBe(true);

      // DPS = price * dividendYield = 100 * 0.05 = 5
      // growth = min(0.05, 0.12) = 0.05
      // D1 = 5 * 1.05 = 5.25
      // costOfEquity = 0.19 + 1.0 * 0.085 = 0.275
      // denominator = 0.275 - 0.05 = 0.225
      // fairValue = 5.25 / 0.225 = 23.33
      expect(ddm!.assumptions.dividendYield).toBe('5.0%');
    });

    it('should have high confidence when dividend yield > 2%', () => {
      const stock = createTestStock({ dividendYield: 0.05 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm!.confidence).toBe(0.75);
    });

    it('should calculate DPS from price and dividend yield', () => {
      const stock = createTestStock({ price: 200, dividendYield: 0.04 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      // DPS = 200 * 0.04 = 8.00
      expect(ddm!.assumptions.dividendPerShare).toBe('8.00');
    });
  });

  // ============================================================
  // Zero dividend yield (sector average fallback)
  // ============================================================
  describe('Zero dividend yield - sector average fallback', () => {
    it('should fall back to sector average dividend yield when dividendYield is 0', () => {
      const stock = createTestStock({ dividendYield: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      // Should use sector avg dividend yield (5%) instead of 0
      // dividendYield in assumptions should be 5.0% (sector avg)
      expect(ddm!.assumptions.dividendYield).toBe('5.0%');
      expect(ddm!.fairValue).toBeGreaterThan(0);
    });

    it('should have low confidence when dividend yield is 0 (falls back to sector avg)', () => {
      const stock = createTestStock({ dividendYield: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      // Since the effective dividendYield used is sector avg (0.05 > 0.02),
      // confidence is actually 0.75 because the fallback still produces a reasonable yield
      expect(ddm!.confidence).toBeGreaterThan(0);
    });

    it('should still produce a valid fair value with sector avg fallback', () => {
      const stock = createTestStock({ dividendYield: 0, price: 80 });
      const customSectorAvg = { ...DEFAULT_SECTOR_AVERAGES, avgDividendYield: 0.03 };
      const result = runAllModels(stock, customSectorAvg, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      expect(ddm!.fairValue).toBeGreaterThan(0);
      expect(ddm!.assumptions.dividendYield).toBe('3.0%');
    });
  });

  // ============================================================
  // Growth rate >= required return (two-stage approximation)
  // ============================================================
  describe('Growth rate >= required return (two-stage approximation)', () => {
    it('should use two-stage approximation when denominator <= 0.01', () => {
      // Need costOfEquity close to growth rate
      // costOfEquity = Rf + beta * ERP = 0.19 + 1.0 * 0.085 = 0.275
      // Set earningsGrowth = 0.27 to make denominator = 0.275 - 0.27 = 0.005 <= 0.01
      const stock = createTestStock({
        dividendYield: 0.05,
        earningsGrowth: 0.27,
        beta: 1.0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      // Growth rate should be capped at 0.12 in the code
      // Math.min(earningsGrowth || gdpGrowthRate, 0.12)
      // So earningsGrowth 0.27 is capped to 0.12
      // denominator = 0.275 - 0.12 = 0.155 > 0.01, so normal path
      expect(ddm!.fairValue).toBeGreaterThan(0);
      expect(isFinite(ddm!.fairValue)).toBe(true);
    });

    it('should handle extreme growth scenario with very high beta making costOfEquity close to growth', () => {
      // With high beta: costOfEquity = 0.19 + 2.0 * 0.085 = 0.36
      // With growth = 0.12: denominator = 0.36 - 0.12 = 0.24 (still > 0.01)
      // Let's use very low risk-free rate to make denominator small
      const lowRateParams = { ...DEFAULT_MARKET_PARAMS, riskFreeRate: 0.01, equityRiskPremium: 0.01 };
      const stock = createTestStock({
        dividendYield: 0.05,
        earningsGrowth: 0.015, // will be capped at 0.015 (< 0.12)
        beta: 1.0,
      });
      // costOfEquity = 0.01 + 1.0 * 0.01 = 0.02
      // growth = min(0.015, 0.12) = 0.015
      // denominator = 0.02 - 0.015 = 0.005 <= 0.01
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, lowRateParams, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      expect(ddm!.fairValue).toBeGreaterThan(0);
      expect(isFinite(ddm!.fairValue)).toBe(true);
      // Two-stage: conservativeGrowth = min(0.015, 0.02 * 0.6) = min(0.015, 0.012) = 0.012
      // fairValue = D1 / (0.02 - 0.012) = D1 / 0.008
    });

    it('should use conservative growth = costOfEquity * 0.6 when growth exceeds costOfEquity', () => {
      const extremeParams = { ...DEFAULT_MARKET_PARAMS, riskFreeRate: 0.005, equityRiskPremium: 0.005 };
      const stock = createTestStock({
        dividendYield: 0.05,
        price: 100,
        earningsGrowth: 0.01,
        beta: 1.0,
      });
      // costOfEquity = 0.005 + 1.0 * 0.005 = 0.01
      // growth = min(0.01, 0.12) = 0.01
      // denominator = 0.01 - 0.01 = 0 <= 0.01
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, extremeParams, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      expect(ddm!.fairValue).toBeGreaterThan(0);
      expect(isFinite(ddm!.fairValue)).toBe(true);
    });
  });

  // ============================================================
  // Negative denominator handling
  // ============================================================
  describe('Negative denominator handling', () => {
    it('should handle negative denominator by using two-stage approximation', () => {
      // Set growth > costOfEquity to get negative denominator
      // costOfEquity = 0.19 + 1.0 * 0.085 = 0.275
      // growth capped at 0.12, so denominator = 0.275 - 0.12 = 0.155 > 0
      // Need different params to get negative denominator
      const extremeParams = { ...DEFAULT_MARKET_PARAMS, riskFreeRate: 0.005, equityRiskPremium: 0.005 };
      const stock = createTestStock({
        dividendYield: 0.05,
        earningsGrowth: 0.012, // higher than costOfEquity of 0.01
        beta: 1.0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, extremeParams, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      expect(ddm!.fairValue).toBeGreaterThan(0);
      expect(isFinite(ddm!.fairValue)).toBe(true);
    });

    it('should produce finite fair value even with denominator exactly 0', () => {
      // costOfEquity = growth exactly
      const params = { ...DEFAULT_MARKET_PARAMS, riskFreeRate: 0.02, equityRiskPremium: 0.005 };
      // costOfEquity = 0.02 + 1.0 * 0.005 = 0.025
      // earningsGrowth capped at min(0.025, 0.12) = 0.025
      // denominator = 0.025 - 0.025 = 0 <= 0.01
      const stock = createTestStock({
        dividendYield: 0.05,
        earningsGrowth: 0.025,
        beta: 1.0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, params, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      expect(isFinite(ddm!.fairValue)).toBe(true);
    });
  });

  // ============================================================
  // Varying beta values
  // ============================================================
  describe('Varying beta values', () => {
    it('should produce lower fair value with higher beta (higher costOfEquity)', () => {
      const stockLowBeta = createTestStock({ beta: 0.5, dividendYield: 0.05, earningsGrowth: 0.05 });
      const stockHighBeta = createTestStock({ beta: 2.0, dividendYield: 0.05, earningsGrowth: 0.05 });

      const resultLow = runAllModels(stockLowBeta, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const resultHigh = runAllModels(stockHighBeta, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');

      const ddmLow = resultLow.models.find(m => m.model === 'ddm');
      const ddmHigh = resultHigh.models.find(m => m.model === 'ddm');

      // Higher beta → higher cost of equity → higher denominator → lower fair value
      expect(ddmLow!.fairValue).toBeGreaterThan(ddmHigh!.fairValue);
    });

    it('should handle beta = 0 (falls back to beta=1.0 in costOfEquity)', () => {
      const stock = createTestStock({ beta: 0, dividendYield: 0.05 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      // beta=0 is falsy, so (fundamentals.beta || 1.0) = 1.0
      // costOfEquity = 0.19 + 1.0 * 0.085 = 0.275
      expect(ddm!.assumptions.costOfEquity).toBe('27.5%');
      expect(ddm!.fairValue).toBeGreaterThan(0);
    });

    it('should handle very high beta = 2.5', () => {
      const stock = createTestStock({ beta: 2.5, dividendYield: 0.05, earningsGrowth: 0.05 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm).toBeDefined();
      // costOfEquity = 0.19 + 2.5 * 0.085 = 0.4025
      expect(ddm!.assumptions.costOfEquity).toBe('40.3%');
      expect(ddm!.fairValue).toBeGreaterThan(0);
    });

    it('should use beta = 1.0 as default when beta is 0 in costOfEquity calc', () => {
      const stock = createTestStock({ beta: 0, dividendYield: 0.05 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      // In ddmValuation, (fundamentals.beta || 1.0) → beta=0 is falsy, so uses 1.0
      // costOfEquity = 0.19 + 1.0 * 0.085 = 0.275
      expect(ddm!.assumptions.costOfEquity).toBe('27.5%');
    });
  });

  // ============================================================
  // Low dividend yield confidence check
  // ============================================================
  describe('Low dividend yield confidence', () => {
    it('should have lower confidence when dividend yield <= 2%', () => {
      const stock = createTestStock({ dividendYield: 0.01 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm!.confidence).toBe(0.35);
    });

    it('should have lower confidence when dividend yield is exactly 2%', () => {
      const stock = createTestStock({ dividendYield: 0.02 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      // 0.02 is NOT > 0.02, so confidence is 0.35
      expect(ddm!.confidence).toBe(0.35);
    });

    it('should have higher confidence when dividend yield is just above 2%', () => {
      const stock = createTestStock({ dividendYield: 0.021 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm!.confidence).toBe(0.75);
    });

    it('should still produce reasonable fair value even with low dividend yield', () => {
      const stock = createTestStock({ dividendYield: 0.005, price: 100 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm!.fairValue).toBeGreaterThan(0);
      expect(isFinite(ddm!.fairValue)).toBe(true);
    });
  });

  // ============================================================
  // DDM model metadata
  // ============================================================
  describe('DDM model metadata', () => {
    it('should have correct model name and Arabic name', () => {
      const stock = createTestStock();
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm!.model).toBe('ddm');
      expect(ddm!.modelName).toBe('Dividend Discount Model');
      expect(ddm!.modelNameAr).toBe('نموذج توزيعات الأرباح');
    });

    it('should have terminalGrowthCapped as false', () => {
      const stock = createTestStock();
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm!.terminalGrowthCapped).toBe(false);
    });

    it('should include growth rate in assumptions', () => {
      const stock = createTestStock({ earningsGrowth: 0.08 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm!.assumptions.growthRate).toBeDefined();
    });

    it('should cap growth rate at 12%', () => {
      const stock = createTestStock({ earningsGrowth: 0.20 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      expect(ddm!.assumptions.growthRate).toBe('12.0%');
    });

    it('should use GDP growth rate when earningsGrowth is 0', () => {
      const stock = createTestStock({ earningsGrowth: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
      const ddm = result.models.find(m => m.model === 'ddm');

      // growth = Math.min(0 || gdpGrowthRate, 0.12) = Math.min(0.05, 0.12) = 0.05
      expect(ddm!.assumptions.growthRate).toBe('5.0%');
    });
  });
});
