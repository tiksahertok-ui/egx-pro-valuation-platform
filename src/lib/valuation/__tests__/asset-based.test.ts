import { describe, it, expect } from 'vitest';
import {
  runAllModels,
  DEFAULT_MARKET_PARAMS,
  DEFAULT_SECTOR_AVERAGES,
  type StockFundamentals,
  type MarketParams,
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

describe('Asset-Based / NAV Valuation Model', () => {
  // costOfEquity with default params and beta=1.0: 0.19 + 1.0 * 0.085 = 0.275

  // ============================================================
  // Real estate sector (uses specialized NAV)
  // ============================================================
  describe('Real estate sector (specialized NAV)', () => {
    it('should use specialized NAV model for real estate sector', () => {
      const stock = createTestStock({
        totalAssets: 100000,
        totalDebt: 30000,
        totalEquity: 70000,
        cashEquivalents: 5000,
        minorityInterests: 2000,
        sharesOutstanding: 1000,
        roe: 0.15,
        price: 65,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Real Estate');
      const navModel = result.models.find(m => m.model === 'nav');

      expect(navModel).toBeDefined();
      expect(navModel!.modelName).toBe('Real Estate NAV');
      // NAV = 100000 - (30000 - 5000) - 2000 = 73000
      // NAV/share = 73
      expect(navModel!.fairValue).toBeGreaterThan(0);
    });

    it('should use specialized NAV model for construction sector', () => {
      const stock = createTestStock({
        totalAssets: 80000,
        totalDebt: 20000,
        totalEquity: 60000,
        cashEquivalents: 3000,
        minorityInterests: 0,
        sharesOutstanding: 1000,
        roe: 0.10,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Construction & Engineering');
      const navModel = result.models.find(m => m.model === 'nav');

      expect(navModel).toBeDefined();
      expect(navModel!.modelName).toBe('Real Estate NAV');
    });

    it('should detect real estate sector case-insensitively', () => {
      const stock = createTestStock({
        totalAssets: 100000,
        totalDebt: 30000,
        totalEquity: 70000,
        cashEquivalents: 5000,
        minorityInterests: 0,
        sharesOutstanding: 1000,
        roe: 0.15,
        price: 65,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'real estate');
      const navModel = result.models.find(m => m.model === 'nav');

      expect(navModel!.modelName).toBe('Real Estate NAV');
    });
  });

  // ============================================================
  // Standard sector (uses equity-based NAV)
  // ============================================================
  describe('Standard sector (equity-based NAV)', () => {
    it('should use standard equity-based NAV for non-real-estate sectors', () => {
      const stock = createTestStock({
        totalAssets: 50000,
        totalDebt: 10000,
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.10,
        price: 50,
        beta: 1.0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      expect(navModel).toBeDefined();
      expect(navModel!.modelName).toBe('Asset-Based (NAV)');
      // navPerShare = totalEquity / sharesOutstanding = 40000 / 1000 = 40
      // costOfEquity = 0.275, roe = 0.10
      // Since roe < costOfEquity: adjustmentFactor = 1 + (0.10 - 0.275) = 0.825
      // adjustmentFactor clamped to [0.5, 2.0] → 0.825
      // fairValue = 40 * 0.825 = 33
      expect(navModel!.fairValue).toBe(33);
    });

    it('should calculate navPerShare as totalEquity / sharesOutstanding', () => {
      const stock = createTestStock({
        totalEquity: 60000,
        sharesOutstanding: 2000,
        roe: 0.05,
        beta: 1.0,
        price: 25,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // navPerShare = 60000 / 2000 = 30
      expect(navModel!.assumptions.navPerShare).toBe('30.00');
    });
  });

  // ============================================================
  // ROE > cost of equity (upward adjustment)
  // ============================================================
  describe('ROE > cost of equity (upward adjustment)', () => {
    it('should apply upward adjustment when ROE > cost of equity', () => {
      const stock = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.35, // > 0.275
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // navPerShare = 40
      // adjustmentFactor = 1 + (0.35 - 0.275) * 2 = 1 + 0.15 = 1.15
      // fairValue = 40 * 1.15 = 46
      expect(navModel!.fairValue).toBe(46);
      expect(navModel!.assumptions.adjustmentFactor).toBe('1.15');
    });

    it('should produce higher fair value with higher ROE above cost of equity', () => {
      const stockMedROE = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.30,
        beta: 1.0,
        price: 50,
      });
      const stockHighROE = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.50,
        beta: 1.0,
        price: 50,
      });

      const resultMed = runAllModels(stockMedROE, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultHigh = runAllModels(stockHighROE, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

      const navMed = resultMed.models.find(m => m.model === 'nav');
      const navHigh = resultHigh.models.find(m => m.model === 'nav');

      expect(navHigh!.fairValue).toBeGreaterThan(navMed!.fairValue);
    });
  });

  // ============================================================
  // ROE < cost of equity (downward adjustment)
  // ============================================================
  describe('ROE < cost of equity (downward adjustment)', () => {
    it('should apply downward adjustment when ROE < cost of equity', () => {
      const stock = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.10, // < 0.275
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // adjustmentFactor = 1 + (0.10 - 0.275) = 0.825
      // fairValue = 40 * 0.825 = 33
      expect(navModel!.fairValue).toBe(33);
      // 0.825.toFixed(2) = '0.82' due to floating point representation
      expect(navModel!.assumptions.adjustmentFactor).toBe('0.82');
    });

    it('should produce lower fair value with lower ROE', () => {
      const stockLowROE = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.05,
        beta: 1.0,
        price: 50,
      });
      const stockMedROE = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.15,
        beta: 1.0,
        price: 50,
      });

      const resultLow = runAllModels(stockLowROE, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultMed = runAllModels(stockMedROE, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

      const navLow = resultLow.models.find(m => m.model === 'nav');
      const navMed = resultMed.models.find(m => m.model === 'nav');

      expect(navMed!.fairValue).toBeGreaterThan(navLow!.fairValue);
    });
  });

  // ============================================================
  // Adjustment factor bounds (0.5 to 2.0)
  // ============================================================
  describe('Adjustment factor bounds', () => {
    it('should cap adjustment factor at 2.0 maximum', () => {
      // adjustmentFactor = 1 + (roe - costOfEquity) * 2
      // To hit cap: 1 + (roe - 0.275) * 2 = 2.0 → (roe - 0.275) * 2 = 1.0 → roe = 0.775
      const stock = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.90, // very high
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // adjustmentFactor before cap = 1 + (0.90 - 0.275) * 2 = 1 + 1.25 = 2.25
      // Capped to 2.0
      expect(navModel!.assumptions.adjustmentFactor).toBe('2.00');
      expect(navModel!.fairValue).toBe(80); // 40 * 2.0
    });

    it('should cap adjustment factor at 0.5 minimum', () => {
      // adjustmentFactor = 1 + (roe - costOfEquity)
      // To hit floor: 1 + (roe - 0.275) = 0.5 → roe = -0.225
      const stock = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: -0.50, // very low
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // adjustmentFactor before cap = 1 + (-0.50 - 0.275) = 1 - 0.775 = 0.225
      // Clamped to 0.5
      expect(navModel!.assumptions.adjustmentFactor).toBe('0.50');
      expect(navModel!.fairValue).toBe(20); // 40 * 0.5
    });

    it('should have adjustmentFactor = 1.0 when ROE = costOfEquity', () => {
      // costOfEquity = 0.275
      const stock = createTestStock({
        totalEquity: 40000,
        sharesOutstanding: 1000,
        roe: 0.275,
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // ROE not > costOfEquity → else branch: adjustmentFactor = 1 + (0.275 - 0.275) = 1.0
      expect(navModel!.assumptions.adjustmentFactor).toBe('1.00');
    });
  });

  // ============================================================
  // Zero total equity
  // ============================================================
  describe('Zero total equity', () => {
    it('should handle zero total equity with low confidence', () => {
      const stock = createTestStock({
        totalEquity: 0,
        sharesOutstanding: 1000,
        roe: 0,
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      expect(navModel).toBeDefined();
      // confidence = totalEquity > 0 ? 0.6 : 0.2
      expect(navModel!.confidence).toBe(0.2);
    });

    it('should produce zero navPerShare when totalEquity is 0', () => {
      const stock = createTestStock({
        totalEquity: 0,
        sharesOutstanding: 1000,
        roe: 0,
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // navPerShare = 0 / 1000 = 0
      expect(navModel!.assumptions.navPerShare).toBe('0.00');
    });

    it('should handle negative total equity', () => {
      const stock = createTestStock({
        totalEquity: -5000,
        sharesOutstanding: 1000,
        roe: -0.20,
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      expect(navModel).toBeDefined();
      expect(navModel!.confidence).toBe(0.2);
      expect(isFinite(navModel!.fairValue)).toBe(true);
    });
  });

  // ============================================================
  // Model metadata and assumptions
  // ============================================================
  describe('Model metadata', () => {
    it('should have correct model identifiers for standard sector', () => {
      const stock = createTestStock();
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      expect(navModel!.model).toBe('nav');
      expect(navModel!.modelName).toBe('Asset-Based (NAV)');
      expect(navModel!.modelNameAr).toBe('صافي قيمة الأصول');
      expect(navModel!.terminalGrowthCapped).toBe(false);
    });

    it('should include total assets and total equity in assumptions', () => {
      const stock = createTestStock({ totalAssets: 75000, totalEquity: 55000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      expect(navModel!.assumptions.totalAssets).toBe('75,000');
      expect(navModel!.assumptions.totalEquity).toBe('55,000');
    });
  });

  // ============================================================
  // ROE fallback
  // ============================================================
  describe('ROE fallback', () => {
    it('should use eps/bvps as ROE fallback when roe is 0', () => {
      const stock = createTestStock({
        roe: 0,
        eps: 5,
        bookValuePerShare: 40,
        totalEquity: 40000,
        sharesOutstanding: 1000,
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // ROE fallback: eps/bvps = 5/40 = 0.125
      expect(navModel!.assumptions.roe).toBe('12.5%');
    });
  });

  // ============================================================
  // Shares outstanding fallback
  // ============================================================
  describe('Shares outstanding fallback', () => {
    it('should use marketCap/price when sharesOutstanding is 0', () => {
      const stock = createTestStock({
        sharesOutstanding: 0,
        price: 50,
        marketCap: 50000,
        totalEquity: 40000,
        roe: 0.10,
        beta: 1.0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const navModel = result.models.find(m => m.model === 'nav');

      // shares = marketCap/price = 50000/50 = 1000
      // navPerShare = 40000/1000 = 40
      expect(navModel!.assumptions.navPerShare).toBe('40.00');
    });
  });
});
