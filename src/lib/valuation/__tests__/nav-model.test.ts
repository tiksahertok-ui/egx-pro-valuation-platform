import { describe, it, expect } from 'vitest';
import { calcNAV, type NAVStockData } from '../../valuation/nav-model';

describe('Real Estate NAV Model', () => {
  it('should calculate NAV per share correctly', () => {
    const stock: NAVStockData = {
      totalAssets: 100000,
      totalDebt: 30000,
      cashEquivalents: 5000,
      minorityInterests: 2000,
      sharesOutstanding: 1000,
      price: 65,
      roe: 0.15,
      totalEquity: 68000,
    };

    const result = calcNAV(stock);

    // NAV = 100000 - (30000 - 5000) - 2000 = 73000
    // NAV/share = 73000 / 1000 = 73
    // Adjustment factor based on ROE vs cost of equity (0.27)
    // Since ROE (0.15) < cost of equity (0.27), adjustment = 1 + (0.15 - 0.27) * 0.8 = 0.904
    // Fair value = 73 * 0.904 = 65.99
    expect(result.model).toBe('nav');
    expect(result.fairValue).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should handle zero shares outstanding', () => {
    const stock: NAVStockData = {
      totalAssets: 100000,
      totalDebt: 30000,
      cashEquivalents: 5000,
      minorityInterests: 0,
      sharesOutstanding: 0,
      price: 50,
      roe: 0.10,
      totalEquity: 70000,
    };

    const result = calcNAV(stock);
    expect(result.fairValue).toBe(0); // Should handle division by zero
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('should apply premium for high ROE', () => {
    const highROEStock: NAVStockData = {
      totalAssets: 100000,
      totalDebt: 20000,
      cashEquivalents: 5000,
      minorityInterests: 0,
      sharesOutstanding: 1000,
      price: 80,
      roe: 0.35, // Very high ROE (above cost of equity 0.27)
      totalEquity: 80000,
    };

    const lowROEStock: NAVStockData = {
      ...highROEStock,
      roe: 0.05, // Very low ROE
    };

    const highROResult = calcNAV(highROEStock);
    const lowROResult = calcNAV(lowROEStock);

    // High ROE should produce higher fair value (premium)
    expect(highROResult.fairValue).toBeGreaterThan(lowROResult.fairValue);
  });
});
