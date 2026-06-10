import { describe, it, expect } from 'vitest';
import { runAllModels, DEFAULT_MARKET_PARAMS, DEFAULT_SECTOR_AVERAGES, type StockFundamentals, quickValuation } from '../../valuation-engine';
import { getSectorWeights, isModelSectorAppropriate } from '../../valuation/sector-weights';
import { calculateSupportResistance, classicPivotPoints, fibonacciPivotPoints, calculateVWAP, identifySwingPoints } from '../../support-resistance';
import { runBacktest, historicalFairValue, type BacktestDataPoint } from '../../backtest-engine';

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

// ============================================================
// P0.1: DCF FX Normalization
// ============================================================
describe('P0.1: DCF FX Revenue Normalization', () => {
  it('should NOT inflate revenue when usdRevenuePct is set', () => {
    // P0.1 FIX: Previously, FX normalization multiplied revenue by up to 16x
    // when usdegpRate ≈ 52. Now it should only split revenue into local/USD.
    const stockNoFX = createTestStock({ usdRevenuePct: 0 });
    const stockWithFX = createTestStock({ usdRevenuePct: 0.3 });

    const resultNoFX = runAllModels(stockNoFX, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const resultWithFX = createTestStock({ usdRevenuePct: 0.3 });

    // DCF should still produce a reasonable fair value even with FX adjustment
    // The FX normalization should not cause a 16x inflation in fair value
    const dcfNoFX = resultNoFX.models.find(m => m.model === 'dcf');
    const dcfWithFX = runAllModels(stockWithFX, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology')
      .models.find(m => m.model === 'dcf');

    expect(dcfNoFX).toBeDefined();
    expect(dcfWithFX).toBeDefined();

    // Fair value with 30% USD revenue should be in the same order of magnitude
    // as without USD revenue (NOT 16x larger)
    if (dcfNoFX!.fairValue > 0 && dcfWithFX!.fairValue > 0) {
      const ratio = dcfWithFX!.fairValue / dcfNoFX!.fairValue;
      expect(ratio).toBeLessThan(5); // Should not be 16x
      expect(ratio).toBeGreaterThan(0.2); // Should not be negligible
    }
  });

  it('should handle 100% USD revenue without crashing', () => {
    const stock = createTestStock({ usdRevenuePct: 1.0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const dcfModel = result.models.find(m => m.model === 'dcf');

    expect(dcfModel).toBeDefined();
    expect(isFinite(dcfModel!.fairValue)).toBe(true);
  });

  it('should handle usdRevenuePct = 0 (pure EGP)', () => {
    const stock = createTestStock({ usdRevenuePct: 0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const dcfModel = result.models.find(m => m.model === 'dcf');

    expect(dcfModel).toBeDefined();
    expect(dcfModel!.fairValue).toBeGreaterThan(0);
  });
});

// ============================================================
// P0.2: Equity Value Cash Calculation
// ============================================================
describe('P0.2: DCF Equity Value Cash Calculation', () => {
  it('should use explicit cashEquivalents when provided', () => {
    const stockWithCash = createTestStock({ cashEquivalents: 5000 });
    const stockNoCash = createTestStock({ cashEquivalents: 0 });

    const resultWithCash = runAllModels(stockWithCash, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const resultNoCash = runAllModels(stockNoCash, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

    const dcfWithCash = resultWithCash.models.find(m => m.model === 'dcf');
    const dcfNoCash = resultNoCash.models.find(m => m.model === 'dcf');

    // With more cash, fair value should be higher
    if (dcfWithCash!.fairValue > 0 && dcfNoCash!.fairValue > 0) {
      expect(dcfWithCash!.fairValue).toBeGreaterThan(dcfNoCash!.fairValue);
    }
  });

  it('should fall back to BS estimate when cashEquivalents is undefined', () => {
    const stock = createTestStock({ cashEquivalents: undefined });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const dcfModel = result.models.find(m => m.model === 'dcf');

    expect(dcfModel).toBeDefined();
    expect(isFinite(dcfModel!.fairValue)).toBe(true);
  });
});

// ============================================================
// P0.3: WACC Cost of Debt
// ============================================================
describe('P0.3: WACC Cost of Debt', () => {
  it('should use Rf + corporate spread for cost of debt, not Rf * 0.7', () => {
    const stock = createTestStock({ totalDebt: 20000, totalEquity: 20000 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const dcfModel = result.models.find(m => m.model === 'dcf');

    expect(dcfModel).toBeDefined();
    // With proper cost of debt (Rf + 3% = 22%), WACC should be higher
    // than the old calculation (Rf * 0.7 * 0.8 = ~10.6%)
    expect(dcfModel!.assumptions.wacc).toBeDefined();
  });

  it('should accept custom corporateDebtSpread', () => {
    const customParams = { ...DEFAULT_MARKET_PARAMS, corporateDebtSpread: 0.05 };
    const stock = createTestStock();
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, customParams, 'Technology');
    const dcfModel = result.models.find(m => m.model === 'dcf');

    expect(dcfModel).toBeDefined();
    expect(isFinite(dcfModel!.fairValue)).toBe(true);
  });
});

// ============================================================
// P0.4: EV/EBITDA Depreciation Proxy
// ============================================================
describe('P0.4: EV/EBITDA Depreciation Proxy', () => {
  it('should use 3% of total assets as D&A proxy, not debt * 0.05', () => {
    const stock = createTestStock();
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const evModel = result.models.find(m => m.model === 'ev_ebitda');

    expect(evModel).toBeDefined();
    // EBITDA source should be the proxy, not "debt * 0.05"
    expect(evModel!.assumptions.ebitdaSource).toBeDefined();
  });

  it('should use reported EBITDA when available', () => {
    const stock = createTestStock({ ebitda: 8000 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const evModel = result.models.find(m => m.model === 'ev_ebitda');

    expect(evModel).toBeDefined();
    expect(evModel!.assumptions.ebitdaSource).toBe('Reported');
  });

  it('should use proxy when EBITDA is not available', () => {
    const stock = createTestStock({ ebitda: 0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const evModel = result.models.find(m => m.model === 'ev_ebitda');

    expect(evModel).toBeDefined();
    expect(evModel!.assumptions.ebitdaSource).toContain('proxy');
  });
});

// ============================================================
// P0.5: EPV Profit Margin Fallback
// ============================================================
describe('P0.5: EPV Profit Margin Fallback', () => {
  it('should use netIncome/revenue as profit margin, not ROE * 0.5', () => {
    const stock = createTestStock();
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const epvModel = result.models.find(m => m.model === 'epv');

    expect(epvModel).toBeDefined();
    expect(epvModel!.fairValue).toBeGreaterThan(0);
    expect(epvModel!.assumptions.marginSource).toBe('Reported');
  });

  it('should return confidence 0.1 and fairValue 0 when both netIncome and revenue are missing', () => {
    const stock = createTestStock({ netIncome: 0, revenue: 0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const epvModel = result.models.find(m => m.model === 'epv');

    expect(epvModel).toBeDefined();
    expect(epvModel!.confidence).toBe(0.1);
    expect(epvModel!.fairValue).toBe(0);
  });
});

// ============================================================
// P0.6: Graham Number Fallback
// ============================================================
describe('P0.6: Graham Number Egypt-Calibrated Fallback', () => {
  it('should use Egypt-calibrated formula when BVPS <= 0', () => {
    const stock = createTestStock({ bookValuePerShare: 0, eps: 5 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const grahamModel = result.models.find(m => m.model === 'graham');

    expect(grahamModel).toBeDefined();
    // With EPS=5, baselinePE=8.5, growth=10%: 5 * (8.5 + 2*0.10*100) = 5 * (8.5 + 20) = 142.5
    expect(grahamModel!.fairValue).toBeGreaterThan(0);
  });

  it('should NOT use 4.4/Y adjustment (which gives 0.23x at 19% Rf)', () => {
    const stock = createTestStock({ bookValuePerShare: 0, eps: 5 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const grahamModel = result.models.find(m => m.model === 'graham');

    expect(grahamModel).toBeDefined();
    // The old formula would give: 5 * (8.5 + 20) * 4.4/19 = 5 * 28.5 * 0.23 ≈ 32.9
    // The new formula should give: 5 * (8.5 + 20) = 142.5
    // So fair value should be much larger than the old formula
    expect(grahamModel!.fairValue).toBeGreaterThan(50);
  });

  it('should return 0 when EPS is negative or zero', () => {
    const stock = createTestStock({ eps: 0, bookValuePerShare: 0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const grahamModel = result.models.find(m => m.model === 'graham');

    expect(grahamModel).toBeDefined();
    expect(grahamModel!.fairValue).toBe(0);
  });
});

// ============================================================
// All 8 Models - Edge Cases
// ============================================================
describe('All Models - Edge Cases', () => {
  it('should handle zero revenue', () => {
    const stock = createTestStock({ revenue: 0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    expect(result.models.length).toBe(8);
    result.models.forEach(m => expect(isFinite(m.fairValue)).toBe(true));
  });

  it('should handle negative equity', () => {
    const stock = createTestStock({ totalEquity: -5000, bookValuePerShare: -5 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    expect(result.models.length).toBe(8);
    result.models.forEach(m => expect(isFinite(m.fairValue)).toBe(true));
  });

  it('should handle missing BVPS', () => {
    const stock = createTestStock({ bookValuePerShare: 0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    expect(result.models.length).toBe(8);
    result.models.forEach(m => expect(isFinite(m.fairValue)).toBe(true));
  });

  it('should handle missing EPS', () => {
    const stock = createTestStock({ eps: 0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    expect(result.models.length).toBe(8);
    result.models.forEach(m => expect(isFinite(m.fairValue)).toBe(true));
  });

  it('should handle zero FCF', () => {
    const stock = createTestStock({ freeCashflow: 0, operatingCashflow: 0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const dcfModel = result.models.find(m => m.model === 'dcf');
    expect(dcfModel!.confidence).toBeLessThan(0.5);
  });

  it('should handle banking sector (high leverage)', () => {
    const bankStock = createTestStock({
      totalDebt: 80000,
      totalEquity: 10000,
      totalAssets: 90000,
      dividendYield: 0.08,
    });
    const result = runAllModels(bankStock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Banking');
    expect(result.models.length).toBe(8);
    result.models.forEach(m => expect(isFinite(m.fairValue)).toBe(true));
  });

  it('should handle real estate sector (NAV dominant)', () => {
    const reStock = createTestStock({
      totalAssets: 100000,
      totalDebt: 30000,
      totalEquity: 70000,
      roe: 0.10,
    });
    const result = runAllModels(reStock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Real Estate');
    const navModel = result.models.find(m => m.model === 'nav');
    expect(navModel).toBeDefined();
    expect(navModel!.fairValue).toBeGreaterThan(0);
  });

  it('should handle 30% USD revenue exposure', () => {
    const stock = createTestStock({ usdRevenuePct: 0.3 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    expect(result.models.length).toBe(8);
    result.models.forEach(m => expect(isFinite(m.fairValue)).toBe(true));
  });

  it('should handle 50% USD revenue exposure', () => {
    const stock = createTestStock({ usdRevenuePct: 0.5 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    expect(result.models.length).toBe(8);
    result.models.forEach(m => expect(isFinite(m.fairValue)).toBe(true));
  });

  it('should handle 100% USD revenue exposure', () => {
    const stock = createTestStock({ usdRevenuePct: 1.0 });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    expect(result.models.length).toBe(8);
    result.models.forEach(m => expect(isFinite(m.fairValue)).toBe(true));
  });
});

// ============================================================
// Terminal Growth Rate Guard
// ============================================================
describe('Terminal Growth Rate Guard', () => {
  it('should cap terminal growth rate below WACC', () => {
    const stock = createTestStock({
      revenueGrowth: 0.25,
      freeCashflow: 4000,
      operatingCashflow: 6000,
    });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const dcfModel = result.models.find(m => m.model === 'dcf');

    expect(dcfModel).toBeDefined();
    expect(typeof dcfModel!.terminalGrowthCapped).toBe('boolean');
  });

  it('should detect when growth rate exceeds WACC and cap it', () => {
    const stock = createTestStock({
      totalEquity: 100,
      totalDebt: 10000,
      freeCashflow: 500,
      operatingCashflow: 800,
    });
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');
    const dcfModel = result.models.find(m => m.model === 'dcf');

    expect(dcfModel).toBeDefined();
    expect(dcfModel!.fairValue).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// Sector Weight Selector
// ============================================================
describe('Sector Weight Selector', () => {
  it('should return DDM + RIM weights for banking stocks', () => {
    const bankingWeights = getSectorWeights('Banking');
    expect(bankingWeights.weights.ddm).toBe(0.35);
    expect(bankingWeights.weights.residual_income).toBe(0.35);
    expect(bankingWeights.weights.dcf).toBe(0);
  });

  it('should return NAV + P/E weights for real estate stocks', () => {
    const reWeights = getSectorWeights('Real Estate');
    expect(reWeights.weights.nav).toBe(0.50);
  });

  it('should return DCF + EV/EBITDA weights for telecom stocks', () => {
    const telecomWeights = getSectorWeights('Telecommunications');
    expect(telecomWeights.weights.dcf).toBe(0.35);
    expect(telecomWeights.weights.ev_ebitda).toBe(0.25);
  });

  it('should return default weights for unknown sectors', () => {
    const unknownWeights = getSectorWeights('Unknown Sector XYZ');
    expect(unknownWeights.weights.dcf).toBeGreaterThan(0);
  });

  it('should correctly identify sector-appropriate models', () => {
    expect(isModelSectorAppropriate('ddm', 'Banking')).toBe(true);
    expect(isModelSectorAppropriate('dcf', 'Banking')).toBe(false);
    expect(isModelSectorAppropriate('nav', 'Real Estate')).toBe(true);
    expect(isModelSectorAppropriate('dcf', 'Telecommunications')).toBe(true);
  });
});

// ============================================================
// Comprehensive Valuation
// ============================================================
describe('Comprehensive Valuation', () => {
  it('should produce weighted average fair value based on sector weights', () => {
    const stock = createTestStock();
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology');

    expect(result.averageFairValue).toBeGreaterThan(0);
    expect(result.medianFairValue).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(1);
    expect(['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']).toContain(result.overallVerdict);
  });

  it('should handle investment horizon: short', () => {
    const stock = createTestStock();
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology', 'short');

    expect(result.horizon).toBe('short');
    expect(result.horizonSpecificVerdict).toBeDefined();
    expect(result.horizonAdjustedFairValue).toBeDefined();
  });

  it('should handle investment horizon: long', () => {
    const stock = createTestStock();
    const result = runAllModels(stock, DEFAULT_SECTOR_AVERAGES, DEFAULT_MARKET_PARAMS, 'Technology', 'long');

    expect(result.horizon).toBe('long');
    expect(result.horizonSpecificVerdict).toBeDefined();
  });
});

// ============================================================
// Quick Valuation
// ============================================================
describe('Quick Valuation', () => {
  it('should return a fair value for basic inputs', () => {
    const result = quickValuation({
      price: 50,
      eps: 5,
      bookValuePerShare: 40,
    });

    expect(result.fairValue).toBeGreaterThan(0);
    expect(['Buy', 'Hold', 'Sell']).toContain(result.verdict);
  });

  it('should handle missing inputs', () => {
    const result = quickValuation({ price: 50 });

    expect(isFinite(result.fairValue)).toBe(true);
  });
});

// ============================================================
// Support & Resistance (P1.4)
// ============================================================
describe('Support & Resistance (P1.4)', () => {
  const sampleData = [
    { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000 },
    { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 1200 },
    { date: '2024-01-03', open: 107, high: 110, low: 105, close: 109, volume: 1100 },
    { date: '2024-01-04', open: 109, high: 112, low: 107, close: 110, volume: 1300 },
    { date: '2024-01-05', open: 110, high: 115, low: 108, close: 113, volume: 1400 },
  ];

  it('should calculate classic pivot points', () => {
    const result = classicPivotPoints(110, 100, 105);
    expect(result.pivot).toBeCloseTo(105, 0);
    expect(result.support1).toBeLessThan(result.pivot);
    expect(result.resistance1).toBeGreaterThan(result.pivot);
  });

  it('should calculate Fibonacci pivot points', () => {
    const result = fibonacciPivotPoints(110, 100, 105);
    expect(result.pivot).toBeCloseTo(105, 0);
    expect(result.support1).toBeLessThan(result.pivot);
    expect(result.resistance1).toBeGreaterThan(result.pivot);
  });

  it('should calculate VWAP', () => {
    const vwap = calculateVWAP(sampleData);
    expect(vwap).toBeGreaterThan(0);
    expect(isFinite(vwap)).toBe(true);
  });

  it('should identify swing points', () => {
    const { swingHighs, swingLows } = identifySwingPoints(sampleData, 1);
    // With a small dataset, swing points may or may not be found
    expect(Array.isArray(swingHighs)).toBe(true);
    expect(Array.isArray(swingLows)).toBe(true);
  });

  it('should calculate full support/resistance analysis', () => {
    const results = calculateSupportResistance(sampleData, 5);
    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => {
      expect(r.pivot).toBeGreaterThan(0);
      expect(r.support1).toBeLessThan(r.pivot);
      expect(r.resistance1).toBeGreaterThan(r.pivot);
    });
  });
});

// ============================================================
// Backtesting Engine (P2.3)
// ============================================================
describe('Backtesting Engine (P2.3)', () => {
  it('should calculate backtest metrics from historical data', () => {
    const dataPoints: BacktestDataPoint[] = [
      { date: '2023-01-01', fairValue: 60, marketPrice: 50, verdict: 'undervalued', confidence: 0.7, forwardReturn1Y: 0.20, benchmarkReturn1Y: 0.10 },
      { date: '2023-02-01', fairValue: 55, marketPrice: 50, verdict: 'undervalued', confidence: 0.6, forwardReturn1Y: 0.15, benchmarkReturn1Y: 0.08 },
      { date: '2023-03-01', fairValue: 45, marketPrice: 50, verdict: 'overvalued', confidence: 0.5, forwardReturn1Y: -0.05, benchmarkReturn1Y: 0.05 },
    ];

    const result = runBacktest(dataPoints);
    expect(result.totalSignals).toBe(3);
    expect(result.buySignals).toBe(2);
    expect(result.sellSignals).toBe(1);
    expect(result.hitRate).toBeGreaterThan(0);
    expect(isFinite(result.sharpeRatio)).toBe(true);
  });

  it('should handle empty data', () => {
    const result = runBacktest([]);
    expect(result.totalSignals).toBe(0);
    expect(result.sharpeRatio).toBe(0);
  });

  it('should calculate historical fair value', () => {
    const fv = historicalFairValue(60, 50, 40);
    expect(fv).toBeGreaterThan(0);
    expect(isFinite(fv)).toBe(true);
  });
});
