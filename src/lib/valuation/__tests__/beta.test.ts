import { describe, it, expect } from 'vitest';
import { computeBeta, computeReturns } from '../../metrics/capm';

describe('Dynamic Beta Calculation', () => {
  it('should compute beta = 1.0 for identical stock and market returns', () => {
    const returns = [0.01, -0.02, 0.03, 0.01, -0.01, 0.02, 0.00, -0.01, 0.02, 0.01];
    const beta = computeBeta(returns, returns);
    expect(beta).toBeCloseTo(1.0, 1);
  });

  it('should return 1.0 for insufficient data', () => {
    const shortReturns = [0.01, 0.02];
    expect(computeBeta(shortReturns, shortReturns)).toBe(1.0);
  });

  it('should compute beta > 1 for a stock more volatile than market', () => {
    const marketReturns = [0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01];
    const stockReturns = [0.03, -0.03, 0.03, -0.03, 0.03, -0.03, 0.03, -0.03, 0.03, -0.03];
    const beta = computeBeta(stockReturns, marketReturns);
    expect(beta).toBeGreaterThan(1.0);
  });

  it('should compute beta < 1 for a defensive stock', () => {
    const marketReturns = [0.02, -0.02, 0.02, -0.02, 0.02, -0.02, 0.02, -0.02, 0.02, -0.02];
    const stockReturns = [0.005, -0.005, 0.005, -0.005, 0.005, -0.005, 0.005, -0.005, 0.005, -0.005];
    const beta = computeBeta(stockReturns, marketReturns);
    expect(beta).toBeLessThan(1.0);
  });

  it('should compute returns from prices correctly', () => {
    const prices = [100, 105, 102, 108];
    const returns = computeReturns(prices);
    expect(returns).toHaveLength(3);
    expect(returns[0]).toBeCloseTo(0.05, 5);    // (105-100)/100
    expect(returns[1]).toBeCloseTo(-0.02857, 4); // (102-105)/105
    expect(returns[2]).toBeCloseTo(0.05882, 4);  // (108-102)/102
  });

  it('should handle zero prices gracefully', () => {
    const prices = [100, 0, 50, 75];
    const returns = computeReturns(prices);
    // Skip division by zero at index 1 (prices[i-1]=0)
    expect(returns.length).toBeLessThan(3);
  });
});
