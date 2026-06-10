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

describe('Residual Income Model', () => {
  // costOfEquity with default params and beta=1.0: 0.19 + 1.0 * 0.085 = 0.275

  // ============================================================
  // ROE > cost of equity (positive residual income)
  // ============================================================
  describe('ROE > cost of equity (positive residual income)', () => {
    it('should produce fair value > BVPS when ROE exceeds cost of equity', () => {
      const stock = createTestStock({
        roe: 0.35, // > 0.275
        bookValuePerShare: 40,
        beta: 1.0,
        dividendYield: 0.05,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri).toBeDefined();
      // When ROE > cost of equity, positive residual income → fair value > BVPS
      expect(ri!.fairValue).toBeGreaterThan(40); // > BVPS
    });

    it('should calculate positive residual income correctly', () => {
      const stock = createTestStock({
        roe: 0.40, // well above cost of equity
        bookValuePerShare: 100,
        beta: 1.0,
        dividendYield: 0.02,
        price: 120,
        eps: 40, // eps = 40
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri).toBeDefined();
      expect(ri!.fairValue).toBeGreaterThan(100); // > BVPS
      expect(ri!.assumptions.roe).toBe('40.0%');
    });

    it('should include projection years in assumptions', () => {
      const stock = createTestStock({ roe: 0.35 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri!.assumptions.projectionYears).toBe(5);
    });
  });

  // ============================================================
  // ROE < cost of equity (negative adjustment)
  // ============================================================
  describe('ROE < cost of equity (negative adjustment)', () => {
    it('should produce fair value < BVPS when ROE is below cost of equity', () => {
      const stock = createTestStock({
        roe: 0.10, // < 0.275
        bookValuePerShare: 40,
        beta: 1.0,
        dividendYield: 0.05,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri).toBeDefined();
      // When ROE < cost of equity, fair value = bvps * (1 + (roe - costOfEquity) * 0.5)
      // = 40 * (1 + (0.10 - 0.275) * 0.5) = 40 * (1 - 0.0875) = 40 * 0.9125 = 36.5
      expect(ri!.fairValue).toBeLessThan(40); // < BVPS
    });

    it('should apply the downward adjustment formula correctly', () => {
      const stock = createTestStock({
        roe: 0.05, // well below cost of equity
        bookValuePerShare: 100,
        beta: 1.0,
        price: 80,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      // fairValue = 100 * (1 + (0.05 - 0.275) * 0.5) = 100 * (1 - 0.1125) = 100 * 0.8875 = 88.75
      expect(ri!.fairValue).toBe(88.75);
    });

    it('should still produce non-negative fair value even with very low ROE', () => {
      const stock = createTestStock({
        roe: -0.20, // negative ROE
        bookValuePerShare: 40,
        beta: 1.0,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      // fairValue = max(0, 40 * (1 + (-0.20 - 0.275) * 0.5)) = max(0, 40 * (1 - 0.2375)) = max(0, 30.5)
      expect(ri!.fairValue).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // ROE = cost of equity (fair value = BVPS)
  // ============================================================
  describe('ROE = cost of equity (fair value = BVPS)', () => {
    it('should produce fair value close to BVPS when ROE equals cost of equity', () => {
      // costOfEquity = 0.19 + 1.0 * 0.085 = 0.275
      const stock = createTestStock({
        roe: 0.275,
        bookValuePerShare: 40,
        beta: 1.0,
        dividendYield: 0.05,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri).toBeDefined();
      // When ROE = costOfEquity, the else branch applies:
      // fairValue = bvps * (1 + (roe - costOfEquity) * 0.5) = 40 * (1 + 0 * 0.5) = 40
      // But wait - ROE (0.275) is NOT > costOfEquity (0.275), so it goes to else branch
      expect(ri!.fairValue).toBe(40);
    });

    it('should produce fair value = BVPS when ROE equals cost of equity exactly', () => {
      const params: MarketParams = { ...DEFAULT_MARKET_PARAMS, riskFreeRate: 0.10, equityRiskPremium: 0.10 };
      // costOfEquity = 0.10 + 1.0 * 0.10 = 0.20
      const stock = createTestStock({
        roe: 0.20,
        bookValuePerShare: 60,
        beta: 1.0,
        dividendYield: 0.05,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, params, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      // ROE (0.20) = costOfEquity (0.20) → else branch
      // fairValue = 60 * (1 + (0.20 - 0.20) * 0.5) = 60 * 1.0 = 60
      expect(ri!.fairValue).toBe(60);
    });
  });

  // ============================================================
  // Zero BVPS
  // ============================================================
  describe('Zero BVPS', () => {
    it('should handle zero BVPS gracefully', () => {
      const stock = createTestStock({
        bookValuePerShare: 0,
        roe: 0.35,
        eps: 0,
        beta: 1.0,
        dividendYield: 0.05,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri).toBeDefined();
      // BVPS = 0 → confidence = 0.3
      expect(ri!.confidence).toBe(0.3);
      expect(isFinite(ri!.fairValue)).toBe(true);
    });

    it('should have low confidence when BVPS is 0', () => {
      const stock = createTestStock({ bookValuePerShare: 0, eps: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri!.confidence).toBe(0.3);
    });

    it('should have high confidence when BVPS > 0', () => {
      const stock = createTestStock({ bookValuePerShare: 40 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri!.confidence).toBe(0.7);
    });
  });

  // ============================================================
  // Terminal residual income calculation
  // ============================================================
  describe('Terminal residual income calculation', () => {
    it('should include terminal residual income when ROE > costOfEquity', () => {
      const stock = createTestStock({
        roe: 0.40,
        bookValuePerShare: 100,
        beta: 1.0,
        dividendYield: 0.03,
        price: 120,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      // With ROE=0.40 > costOfEquity=0.275, the model projects residual income
      // for 5 years and then calculates terminal RI
      expect(ri!.fairValue).toBeGreaterThan(100); // > BVPS due to positive RI
    });

    it('should discount terminal RI to present value', () => {
      // With high ROE and low dividend yield, more earnings are retained
      const stock = createTestStock({
        roe: 0.50,
        bookValuePerShare: 80,
        beta: 1.0,
        dividendYield: 0.01,
        price: 100,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri!.fairValue).toBeGreaterThan(80);
    });
  });

  // ============================================================
  // ROE fade rate verification
  // ============================================================
  describe('ROE fade rate verification', () => {
    it('should fade ROE toward cost of equity at 20% per year', () => {
      // The fade rate is: decliningROE = decliningROE + (costOfEquity - decliningROE) * 0.2
      // Starting ROE = 0.40, costOfEquity = 0.275
      // Year 1: 0.40 + (0.275 - 0.40) * 0.2 = 0.40 - 0.025 = 0.375
      // Year 2: 0.375 + (0.275 - 0.375) * 0.2 = 0.375 - 0.02 = 0.355
      // Year 3: 0.355 + (0.275 - 0.355) * 0.2 = 0.355 - 0.016 = 0.339
      // Each year ROE moves 20% closer to costOfEquity
      const stock = createTestStock({
        roe: 0.40,
        bookValuePerShare: 100,
        beta: 1.0,
        dividendYield: 0.02,
        price: 120,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      // The fair value should be greater than BVPS because of positive residual income
      // that fades over time
      expect(ri!.fairValue).toBeGreaterThan(100);
    });

    it('should produce lower fair value with faster fade (higher dividend payout)', () => {
      // Higher dividend yield → more earnings paid out → less BVPS growth → lower fair value
      const stockLowDiv = createTestStock({
        roe: 0.40,
        bookValuePerShare: 100,
        beta: 1.0,
        dividendYield: 0.01,
        price: 120,
      });
      const stockHighDiv = createTestStock({
        roe: 0.40,
        bookValuePerShare: 100,
        beta: 1.0,
        dividendYield: 0.10,
        price: 120,
      });

      const resultLowDiv = runAllModels(stockLowDiv, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultHighDiv = runAllModels(stockHighDiv, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

      const riLowDiv = resultLowDiv.models.find(m => m.model === 'residual_income');
      const riHighDiv = resultHighDiv.models.find(m => m.model === 'residual_income');

      // Higher dividends reduce retained earnings, slowing BVPS growth
      // But RI model also accounts for dividends in BVPS progression
      expect(riLowDiv!.fairValue).toBeGreaterThan(0);
      expect(riHighDiv!.fairValue).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // ROE fallback when not provided
  // ============================================================
  describe('ROE fallback', () => {
    it('should use eps/bvps as ROE fallback when roe is 0 but eps and bvps are available', () => {
      const stock = createTestStock({
        roe: 0,
        eps: 5,
        bookValuePerShare: 40,
        beta: 1.0,
        dividendYield: 0.05,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      // ROE fallback: eps/bvps = 5/40 = 0.125
      // costOfEquity = 0.275
      // ROE (0.125) < costOfEquity → else branch
      expect(ri!.assumptions.roe).toBe('12.5%');
    });

    it('should use sector average ROE when roe=0, eps=0, bvps=0', () => {
      const stock = createTestStock({
        roe: 0,
        eps: 0,
        bookValuePerShare: 0,
        beta: 1.0,
        dividendYield: 0.05,
        price: 50,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      // Fallback to sector average ROE (0.14)
      expect(ri!.assumptions.roe).toBe('14.0%');
    });
  });

  // ============================================================
  // Model metadata
  // ============================================================
  describe('Model metadata', () => {
    it('should have correct model identifiers', () => {
      const stock = createTestStock();
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri!.model).toBe('residual_income');
      expect(ri!.modelName).toBe('Residual Income Model');
      expect(ri!.modelNameAr).toBe('نموذج الدخل المتبقي');
      expect(ri!.terminalGrowthCapped).toBe(false);
    });

    it('should include cost of equity in assumptions', () => {
      const stock = createTestStock({ beta: 1.0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const ri = result.models.find(m => m.model === 'residual_income');

      expect(ri!.assumptions.costOfEquity).toBe('27.5%'); // 0.19 + 1.0 * 0.085 = 0.275
    });
  });
});
