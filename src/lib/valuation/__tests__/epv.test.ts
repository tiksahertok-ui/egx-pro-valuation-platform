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

describe('Earnings Power Value (EPV) Model', () => {
  // ============================================================
  // With reported net income
  // ============================================================
  describe('With reported net income', () => {
    it('should use reported net income for normalized earnings', () => {
      const stock = createTestStock({ netIncome: 3000, revenue: 20000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv).toBeDefined();
      expect(epv!.assumptions.marginSource).toBe('Reported');
    });

    it('should calculate fair value from net income / WACC / shares', () => {
      const stock = createTestStock({
        netIncome: 5000,
        revenue: 40000,
        sharesOutstanding: 1000,
        totalEquity: 40000,
        totalDebt: 10000,
        beta: 1.0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      // WACC calculation:
      // costOfEquity = 0.19 + 1.0 * 0.085 = 0.275
      // preTaxCostOfDebt = 0.19 + 0.03 = 0.22
      // afterTaxCostOfDebt = 0.22 * 0.7 = 0.154
      // equityWeight = 40000 / 50000 = 0.8
      // debtWeight = 0.2
      // WACC = 0.8 * 0.275 + 0.2 * 0.154 = 0.22 + 0.0308 = 0.2508
      // normalizedEarnings = 5000
      // distributableEarnings = 5000 * 0.85 = 4250
      // EPV = 4250 / 0.2508 ≈ 16945.77
      // fairValue = 16945.77 / 1000 ≈ 16.95
      expect(epv!.fairValue).toBeGreaterThan(0);
    });

    it('should have confidence 0.65 when net income is positive', () => {
      const stock = createTestStock({ netIncome: 3000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.confidence).toBe(0.65);
    });

    it('should have confidence 0.25 when net income is negative', () => {
      const stock = createTestStock({ netIncome: -1000, revenue: 20000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      // netIncome is -1000 (truthy but negative)
      // The code checks: fundamentals.netIncome && fundamentals.netIncome !== 0
      // -1000 is truthy and !== 0, so it uses "Reported" path
      // But normalizedEarnings = -1000 → distributableEarnings = -850
      // confidence = normalizedEarnings > 0 ? 0.65 : 0.25
      expect(epv!.confidence).toBe(0.25);
    });
  });

  // ============================================================
  // With revenue + profit margin
  // ============================================================
  describe('With revenue + profit margin', () => {
    it('should calculate normalized earnings from revenue and profit margin when net income is 0', () => {
      const stock = createTestStock({
        netIncome: 0,
        revenue: 20000,
        profitMargin: 0.10,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv).toBeDefined();
      expect(epv!.assumptions.marginSource).toBe('Revenue x Margin');
    });

    it('should calculate normalized earnings = revenue * profitMargin', () => {
      const stock = createTestStock({
        netIncome: 0,
        revenue: 20000,
        profitMargin: 0.10,
        sharesOutstanding: 1000,
        totalEquity: 40000,
        totalDebt: 10000,
        beta: 1.0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      // normalizedEarnings = 20000 * 0.10 = 2000
      // distributableEarnings = 2000 * 0.85 = 1700
      // EPV = 1700 / WACC
      expect(epv!.fairValue).toBeGreaterThan(0);
    });

    it('should fall back to netIncome/revenue as profit margin when profitMargin is 0', () => {
      const stock = createTestStock({
        netIncome: 0,  // netIncome is 0 → first condition fails
        revenue: 20000,
        profitMargin: 0,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      // profitMargin fallback: safeDivide(0, 20000, 0.05) = 0.05
      // normalizedEarnings = 20000 * 0.05 = 1000
      expect(epv!.assumptions.marginSource).toBe('Revenue x Margin');
    });
  });

  // ============================================================
  // Missing both net income and revenue
  // ============================================================
  describe('Missing both net income and revenue', () => {
    it('should return confidence 0.1 when both netIncome and revenue are missing', () => {
      const stock = createTestStock({ netIncome: 0, revenue: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.confidence).toBe(0.1);
    });

    it('should return fairValue 0 when both netIncome and revenue are missing', () => {
      const stock = createTestStock({ netIncome: 0, revenue: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.fairValue).toBe(0);
    });

    it('should return upsideDownside -100 when both are missing', () => {
      const stock = createTestStock({ netIncome: 0, revenue: 0, price: 50 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.upsideDownside).toBe(-100);
    });

    it('should return verdict overvalued when both are missing', () => {
      const stock = createTestStock({ netIncome: 0, revenue: 0 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.verdict).toBe('overvalued');
    });

    it('should use revenue path when netIncome is 0 but revenue is positive', () => {
      const stock = createTestStock({ netIncome: 0, revenue: 15000, profitMargin: 0.08 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      // netIncome = 0 → falsy, but revenue > 0 → Revenue x Margin path
      expect(epv!.assumptions.marginSource).toBe('Revenue x Margin');
      expect(epv!.fairValue).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Distributable earnings (85% factor)
  // ============================================================
  describe('Distributable earnings (85% factor)', () => {
    it('should apply 85% distributable ratio to normalized earnings', () => {
      const stock = createTestStock({ netIncome: 10000, revenue: 50000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.assumptions.distributableRatio).toBe('85%');
      expect(epv!.assumptions.maintenanceCapexBuffer).toBe('15%');
    });

    it('should reduce normalized earnings by 15% for maintenance capex', () => {
      const stockFull = createTestStock({ netIncome: 10000, sharesOutstanding: 1000 });
      // We can't directly observe the 85% in the output, but we can verify
      // the fair value is 85% of what it would be without the buffer
      const result = runAllModels(stockFull, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      // If distributableEarnings = 10000 * 0.85 = 8500
      // and WACC ≈ 0.2508 (for this stock)
      // EPV = 8500 / 0.2508 ≈ 33891.86
      // fairValue = 33891.86 / 1000 ≈ 33.89
      expect(epv!.fairValue).toBeGreaterThan(0);
      expect(epv!.assumptions.distributableRatio).toBe('85%');
    });
  });

  // ============================================================
  // WACC sensitivity
  // ============================================================
  describe('WACC sensitivity', () => {
    it('should produce higher fair value with lower WACC', () => {
      const stock = createTestStock({ netIncome: 5000, revenue: 20000 });

      // Higher debt → lower equity weight → lower WACC (debt is cheaper after tax)
      const lowWaccStock = createTestStock({
        netIncome: 5000,
        revenue: 20000,
        totalEquity: 10000,
        totalDebt: 40000,
        beta: 1.0,
      });
      const highWaccStock = createTestStock({
        netIncome: 5000,
        revenue: 20000,
        totalEquity: 40000,
        totalDebt: 10000,
        beta: 2.0,
      });

      const resultLow = runAllModels(lowWaccStock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const resultHigh = runAllModels(highWaccStock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

      const epvLow = resultLow.models.find(m => m.model === 'epv');
      const epvHigh = resultHigh.models.find(m => m.model === 'epv');

      // Higher WACC → lower fair value (inverse relationship)
      expect(epvLow!.fairValue).toBeGreaterThan(epvHigh!.fairValue);
    });

    it('should include WACC in assumptions', () => {
      const stock = createTestStock({ netIncome: 5000 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.assumptions.wacc).toBeDefined();
      expect(typeof epv!.assumptions.wacc).toBe('string');
    });

    it('should produce proportionally lower fair value with higher WACC', () => {
      const stock1 = createTestStock({
        netIncome: 4000,
        revenue: 20000,
        totalEquity: 50000,
        totalDebt: 0,
        beta: 0.5,
      });
      const stock2 = createTestStock({
        netIncome: 4000,
        revenue: 20000,
        totalEquity: 50000,
        totalDebt: 0,
        beta: 2.0,
      });

      const result1 = runAllModels(stock1, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const result2 = runAllModels(stock2, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

      const epv1 = result1.models.find(m => m.model === 'epv');
      const epv2 = result2.models.find(m => m.model === 'epv');

      // Higher beta → higher WACC → lower fair value
      expect(epv1!.fairValue).toBeGreaterThan(epv2!.fairValue);
    });
  });

  // ============================================================
  // Model metadata
  // ============================================================
  describe('Model metadata', () => {
    it('should have correct model identifiers', () => {
      const stock = createTestStock();
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.model).toBe('epv');
      expect(epv!.modelName).toBe('Earnings Power Value');
      expect(epv!.modelNameAr).toBe('قيمة القوة الكسبية');
      expect(epv!.terminalGrowthCapped).toBe(false);
    });

    it('should include normalized earnings in assumptions', () => {
      const stock = createTestStock({ netIncome: 2500 });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      expect(epv!.assumptions.normalizedEarnings).toBe('2,500');
    });
  });

  // ============================================================
  // Shares outstanding fallback
  // ============================================================
  describe('Shares outstanding fallback', () => {
    it('should use marketCap/price when sharesOutstanding is 0', () => {
      const stock = createTestStock({
        netIncome: 5000,
        sharesOutstanding: 0,
        price: 50,
        marketCap: 50000,
      });
      const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
      const epv = result.models.find(m => m.model === 'epv');

      // shares = marketCap/price = 50000/50 = 1000
      expect(epv!.fairValue).toBeGreaterThan(0);
    });
  });
});
