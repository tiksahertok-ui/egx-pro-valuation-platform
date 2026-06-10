import { describe, it, expect } from 'vitest';
import {
  classicPivotPoints,
  fibonacciPivotPoints,
  calculateVWAP,
  identifySwingPoints,
  calculateSupportResistance,
  type OHLCV,
} from '../support-resistance';

// Helper to generate OHLCV data
function generateOHLCV(count: number, basePrice: number = 100, trend: number = 0): OHLCV[] {
  const data: OHLCV[] = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 4 + trend;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    price = close;
    data.push({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(1000 + Math.random() * 2000),
    });
  }
  return data;
}

describe('Support & Resistance', () => {
  // ============================================================
  // Classic Pivot Points Formula Verification
  // ============================================================
  describe('Classic Pivot Points', () => {
    it('should calculate pivot = (H + L + C) / 3', () => {
      const result = classicPivotPoints(110, 100, 105);
      // Pivot = (110 + 100 + 105) / 3 = 315 / 3 = 105
      expect(result.pivot).toBeCloseTo(105, 10);
    });

    it('should calculate S1 = 2 * Pivot - H', () => {
      const result = classicPivotPoints(110, 100, 105);
      // S1 = 2 * 105 - 110 = 210 - 110 = 100
      expect(result.support1).toBeCloseTo(100, 10);
    });

    it('should calculate R1 = 2 * Pivot - L', () => {
      const result = classicPivotPoints(110, 100, 105);
      // R1 = 2 * 105 - 100 = 210 - 100 = 110
      expect(result.resistance1).toBeCloseTo(110, 10);
    });

    it('should calculate S2 = Pivot - (H - L)', () => {
      const result = classicPivotPoints(110, 100, 105);
      // S2 = 105 - (110 - 100) = 105 - 10 = 95
      expect(result.support2).toBeCloseTo(95, 10);
    });

    it('should calculate R2 = Pivot + (H - L)', () => {
      const result = classicPivotPoints(110, 100, 105);
      // R2 = 105 + (110 - 100) = 105 + 10 = 115
      expect(result.resistance2).toBeCloseTo(115, 10);
    });

    it('should maintain proper ordering: S2 < S1 < Pivot < R1 < R2', () => {
      const result = classicPivotPoints(110, 100, 105);
      expect(result.support2).toBeLessThan(result.support1);
      expect(result.support1).toBeLessThan(result.pivot);
      expect(result.pivot).toBeLessThan(result.resistance1);
      expect(result.resistance1).toBeLessThan(result.resistance2);
    });

    it('should handle equal high and low (no range)', () => {
      const result = classicPivotPoints(100, 100, 100);
      expect(result.pivot).toBeCloseTo(100, 10);
      expect(result.support1).toBeCloseTo(100, 10);
      expect(result.resistance1).toBeCloseTo(100, 10);
      expect(result.support2).toBeCloseTo(100, 10);
      expect(result.resistance2).toBeCloseTo(100, 10);
    });

    it('should handle very large price values', () => {
      const result = classicPivotPoints(10000, 9000, 9500);
      expect(result.pivot).toBeCloseTo(9500, -1);
      expect(isFinite(result.pivot)).toBe(true);
    });

    it('should handle decimal price values', () => {
      const result = classicPivotPoints(10.50, 9.75, 10.25);
      expect(result.pivot).toBeCloseTo(10.1667, 3);
      expect(isFinite(result.pivot)).toBe(true);
    });
  });

  // ============================================================
  // Fibonacci Pivot Points Formula Verification
  // ============================================================
  describe('Fibonacci Pivot Points', () => {
    it('should calculate pivot = (H + L + C) / 3 (same as classic)', () => {
      const result = fibonacciPivotPoints(110, 100, 105);
      expect(result.pivot).toBeCloseTo(105, 10);
    });

    it('should calculate R1 = Pivot + 0.382 * (H - L)', () => {
      const result = fibonacciPivotPoints(110, 100, 105);
      // R1 = 105 + 0.382 * 10 = 105 + 3.82 = 108.82
      expect(result.resistance1).toBeCloseTo(108.82, 2);
    });

    it('should calculate R2 = Pivot + 0.618 * (H - L)', () => {
      const result = fibonacciPivotPoints(110, 100, 105);
      // R2 = 105 + 0.618 * 10 = 105 + 6.18 = 111.18
      expect(result.resistance2).toBeCloseTo(111.18, 2);
    });

    it('should calculate S1 = Pivot - 0.382 * (H - L)', () => {
      const result = fibonacciPivotPoints(110, 100, 105);
      // S1 = 105 - 0.382 * 10 = 105 - 3.82 = 101.18
      expect(result.support1).toBeCloseTo(101.18, 2);
    });

    it('should calculate S2 = Pivot - 0.618 * (H - L)', () => {
      const result = fibonacciPivotPoints(110, 100, 105);
      // S2 = 105 - 0.618 * 10 = 105 - 6.18 = 98.82
      expect(result.support2).toBeCloseTo(98.82, 2);
    });

    it('should maintain proper ordering: S2 < S1 < Pivot < R1 < R2', () => {
      const result = fibonacciPivotPoints(110, 100, 105);
      expect(result.support2).toBeLessThan(result.support1);
      expect(result.support1).toBeLessThan(result.pivot);
      expect(result.pivot).toBeLessThan(result.resistance1);
      expect(result.resistance1).toBeLessThan(result.resistance2);
    });

    it('should have Fibonacci levels closer to pivot than classic levels', () => {
      const classic = classicPivotPoints(110, 100, 105);
      const fib = fibonacciPivotPoints(110, 100, 105);

      // Fibonacci S1 should be closer to pivot than classic S1
      const classicS1Dist = Math.abs(classic.support1 - classic.pivot);
      const fibS1Dist = Math.abs(fib.support1 - fib.pivot);
      expect(fibS1Dist).toBeLessThan(classicS1Dist);

      // Fibonacci R1 should be closer to pivot than classic R1
      const classicR1Dist = Math.abs(classic.resistance1 - classic.pivot);
      const fibR1Dist = Math.abs(fib.resistance1 - fib.pivot);
      expect(fibR1Dist).toBeLessThan(classicR1Dist);
    });

    it('should handle equal high and low (no range)', () => {
      const result = fibonacciPivotPoints(100, 100, 100);
      expect(result.pivot).toBeCloseTo(100, 10);
      expect(result.support1).toBeCloseTo(100, 10);
      expect(result.resistance1).toBeCloseTo(100, 10);
      expect(result.support2).toBeCloseTo(100, 10);
      expect(result.resistance2).toBeCloseTo(100, 10);
    });
  });

  // ============================================================
  // VWAP Calculation with Known Data
  // ============================================================
  describe('VWAP Calculation', () => {
    it('should calculate VWAP = Sum(typicalPrice * volume) / Sum(volume)', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000 },
        { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 2000 },
      ];

      const vwap = calculateVWAP(data);

      // typicalPrice1 = (105 + 98 + 103) / 3 = 102
      // typicalPrice2 = (108 + 102 + 107) / 3 = 105.667
      // VWAP = (102 * 1000 + 105.667 * 2000) / (1000 + 2000)
      //       = (102000 + 211333.33) / 3000
      //       = 313333.33 / 3000
      //       = 104.44
      expect(vwap).toBeCloseTo(104.44, 1);
    });

    it('should return 0 for empty data', () => {
      expect(calculateVWAP([])).toBe(0);
    });

    it('should handle single data point', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 110, low: 90, close: 105, volume: 1000 },
      ];
      const vwap = calculateVWAP(data);
      // typicalPrice = (110 + 90 + 105) / 3 = 101.667
      expect(vwap).toBeCloseTo(101.667, 2);
    });

    it('should weight higher-volume bars more heavily', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 100, low: 100, close: 100, volume: 1000 },
        { date: '2024-01-02', open: 200, high: 200, low: 200, close: 200, volume: 9000 },
      ];
      const vwap = calculateVWAP(data);
      // VWAP should be much closer to 200 due to 9x volume weight
      expect(vwap).toBeGreaterThan(150);
      expect(vwap).toBeLessThan(200);
    });

    it('should handle zero volume gracefully', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 0 },
      ];
      const vwap = calculateVWAP(data);
      expect(vwap).toBe(0);
    });

    it('should calculate VWAP correctly with mixed volumes', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 50, high: 52, low: 49, close: 51, volume: 500 },
        { date: '2024-01-02', open: 51, high: 53, low: 50, close: 52, volume: 500 },
      ];
      const vwap = calculateVWAP(data);
      // Both have equal volume, so VWAP should be average of typical prices
      // tp1 = (52+49+51)/3 = 50.667, tp2 = (53+50+52)/3 = 51.667
      // VWAP = (50.667*500 + 51.667*500) / 1000 = (25333.33 + 25833.33) / 1000 = 51.167
      expect(vwap).toBeCloseTo(51.167, 1);
    });
  });

  // ============================================================
  // Swing Point Detection with Various Window Sizes
  // ============================================================
  describe('Swing Point Detection', () => {
    it('should detect a swing high when a bar is higher than all surrounding bars', () => {
      // Create data with a clear peak in the middle
      const data: OHLCV[] = [];
      for (let i = 0; i < 25; i++) {
        let high: number;
        if (i < 12) high = 100 + i * 2; // rising
        else if (i === 12) high = 130; // peak
        else high = 130 - (i - 12) * 2; // falling

        data.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: high - 1,
          high,
          low: high - 5,
          close: high - 2,
          volume: 1000,
        });
      }

      const { swingHighs } = identifySwingPoints(data, 5);
      expect(swingHighs.length).toBeGreaterThan(0);
      // The peak should be detected
      const peakSwing = swingHighs.find(sh => sh.value === 130);
      expect(peakSwing).toBeDefined();
    });

    it('should detect a swing low when a bar is lower than all surrounding bars', () => {
      // Create data with a clear trough in the middle
      const data: OHLCV[] = [];
      for (let i = 0; i < 25; i++) {
        let low: number;
        if (i < 12) low = 100 - i * 2; // falling
        else if (i === 12) low = 70; // trough
        else low = 70 + (i - 12) * 2; // rising

        data.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: low + 1,
          high: low + 5,
          low,
          close: low + 2,
          volume: 1000,
        });
      }

      const { swingLows } = identifySwingPoints(data, 5);
      expect(swingLows.length).toBeGreaterThan(0);
      const troughSwing = swingLows.find(sl => sl.value === 70);
      expect(troughSwing).toBeDefined();
    });

    it('should use default window size of 10', () => {
      // Need at least 21 bars (10 + 1 + 10) for any swing detection
      const data = generateOHLCV(25);
      const { swingHighs, swingLows } = identifySwingPoints(data);
      // May or may not find swing points, but should not error
      expect(Array.isArray(swingHighs)).toBe(true);
      expect(Array.isArray(swingLows)).toBe(true);
    });

    it('should find more swing points with smaller window size', () => {
      const data = generateOHLCV(50);
      const smallWindow = identifySwingPoints(data, 3);
      const largeWindow = identifySwingPoints(data, 10);

      // Smaller window → more sensitive → more swing points
      expect(smallWindow.swingHighs.length + smallWindow.swingLows.length)
        .toBeGreaterThanOrEqual(largeWindow.swingHighs.length + largeWindow.swingLows.length);
    });

    it('should not detect swing points where another bar has equal high/low', () => {
      // Create flat data where no bar is strictly higher/lower than all neighbors
      const data: OHLCV[] = [];
      for (let i = 0; i < 25; i++) {
        data.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: 100,
          high: 105,
          low: 95,
          close: 100,
          volume: 1000,
        });
      }

      const { swingHighs, swingLows } = identifySwingPoints(data, 5);
      // No bar is strictly higher than all neighbors (all equal)
      expect(swingHighs.length).toBe(0);
      expect(swingLows.length).toBe(0);
    });
  });

  // ============================================================
  // Edge Cases: Empty data, single data point, too-short data
  // ============================================================
  describe('Edge cases', () => {
    it('should return empty results for empty data in calculateSupportResistance', () => {
      const results = calculateSupportResistance([]);
      expect(results).toEqual([]);
    });

    it('should return empty results for single data point', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000 },
      ];

      const results = calculateSupportResistance(data);
      expect(results).toEqual([]);
    });

    it('should return empty swing points when data is too short for window', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000 },
        { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 1200 },
        { date: '2024-01-03', open: 107, high: 110, low: 105, close: 109, volume: 1100 },
      ];

      // Window size 10 requires at least 21 data points
      const { swingHighs, swingLows } = identifySwingPoints(data, 10);
      expect(swingHighs).toEqual([]);
      expect(swingLows).toEqual([]);
    });

    it('should handle two data points for calculateSupportResistance', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000 },
        { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 1200 },
      ];

      const results = calculateSupportResistance(data);
      expect(results.length).toBe(2);
    });

    it('should handle VWAP with empty data returning 0', () => {
      expect(calculateVWAP([])).toBe(0);
    });

    it('should handle VWAP with all zero volumes', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 0 },
        { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 0 },
      ];
      expect(calculateVWAP(data)).toBe(0);
    });
  });

  // ============================================================
  // calculateSupportResistance Full Integration
  // ============================================================
  describe('calculateSupportResistance full integration', () => {
    const sampleData: OHLCV[] = [
      { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000 },
      { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 1200 },
      { date: '2024-01-03', open: 107, high: 110, low: 105, close: 109, volume: 1100 },
      { date: '2024-01-04', open: 109, high: 112, low: 107, close: 110, volume: 1300 },
      { date: '2024-01-05', open: 110, high: 115, low: 108, close: 113, volume: 1400 },
    ];

    it('should return results for each analysis day', () => {
      const results = calculateSupportResistance(sampleData, 5);
      expect(results.length).toBe(5);
    });

    it('should include all required fields in each result', () => {
      const results = calculateSupportResistance(sampleData, 5);
      for (const r of results) {
        expect(r).toHaveProperty('date');
        expect(r).toHaveProperty('pivot');
        expect(r).toHaveProperty('support1');
        expect(r).toHaveProperty('resistance1');
        expect(r).toHaveProperty('support2');
        expect(r).toHaveProperty('resistance2');
        expect(r).toHaveProperty('vwap');
        expect(r).toHaveProperty('swingHigh');
        expect(r).toHaveProperty('swingLow');
      }
    });

    it('should calculate pivot from previous bar data', () => {
      const results = calculateSupportResistance(sampleData, 5);
      // First result uses data[0] as previous (index 0)
      // pivot = (data[0].high + data[0].low + data[0].close) / 3
      // = (105 + 98 + 103) / 3 = 102
      expect(results[0]!.pivot).toBeCloseTo(102, 0);
    });

    it('should round all values to 2 decimal places', () => {
      const results = calculateSupportResistance(sampleData, 5);
      for (const r of results) {
        // Check that values are rounded (no more than 2 decimal places)
        expect(r.pivot).toBe(Math.round(r.pivot * 100) / 100);
        expect(r.vwap).toBe(Math.round(r.vwap * 100) / 100);
      }
    });

    it('should use VWAP from the analysis period', () => {
      const results = calculateSupportResistance(sampleData, 5);
      // All results should have the same VWAP (calculated from the analysis period)
      const vwap = results[0]!.vwap;
      for (const r of results) {
        expect(r.vwap).toBe(vwap);
      }
    });

    it('should default swing high/low to current high/low when no swing points found', () => {
      // With only 5 data points, swing points may not be detected (need 2*window+1)
      const results = calculateSupportResistance(sampleData, 5);
      for (const r of results) {
        expect(r.swingHigh).toBeGreaterThan(0);
        expect(r.swingLow).toBeGreaterThan(0);
      }
    });

    it('should limit analysis to the specified number of days', () => {
      const data = generateOHLCV(30);
      const results5 = calculateSupportResistance(data, 5);
      const results20 = calculateSupportResistance(data, 20);

      expect(results5.length).toBe(5);
      expect(results20.length).toBe(20);
    });

    it('should default to 20 days when days parameter is not provided', () => {
      const data = generateOHLCV(30);
      const results = calculateSupportResistance(data);
      expect(results.length).toBe(20);
    });

    it('should handle days > data.length by analyzing all available data', () => {
      const data = generateOHLCV(5);
      const results = calculateSupportResistance(data, 20);
      expect(results.length).toBe(5);
    });

    it('should maintain S1 < Pivot < R1 ordering in all results', () => {
      const data = generateOHLCV(30);
      const results = calculateSupportResistance(data, 20);
      for (const r of results) {
        expect(r.support1).toBeLessThan(r.pivot);
        expect(r.resistance1).toBeGreaterThan(r.pivot);
      }
    });
  });

  // ============================================================
  // Boundary Values
  // ============================================================
  describe('Boundary values', () => {
    it('should handle very small price ranges', () => {
      const result = classicPivotPoints(100.01, 99.99, 100.00);
      expect(result.pivot).toBeCloseTo(100, 2);
      expect(isFinite(result.support1)).toBe(true);
      expect(isFinite(result.resistance1)).toBe(true);
    });

    it('should handle very large price ranges', () => {
      const result = classicPivotPoints(1000000, 100, 500000);
      expect(isFinite(result.pivot)).toBe(true);
      expect(isFinite(result.support1)).toBe(true);
      expect(isFinite(result.resistance1)).toBe(true);
    });

    it('should handle zero prices in pivot calculation', () => {
      const result = classicPivotPoints(0, 0, 0);
      expect(result.pivot).toBe(0);
      expect(result.support1).toBe(0);
      expect(result.resistance1).toBe(0);
    });

    it('should handle negative prices (edge case)', () => {
      // While negative prices are unusual, the functions should handle them
      const result = classicPivotPoints(-10, -20, -15);
      expect(isFinite(result.pivot)).toBe(true);
      expect(result.pivot).toBeCloseTo(-15, 10);
    });

    it('should handle OHLCV data with zero volume', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 0 },
        { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 0 },
        { date: '2024-01-03', open: 107, high: 110, low: 105, close: 109, volume: 0 },
      ];

      // VWAP with zero volume = 0
      const vwap = calculateVWAP(data);
      expect(vwap).toBe(0);
    });

    it('should handle OHLCV data with very large volumes', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1e12 },
        { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 1e12 },
      ];

      const vwap = calculateVWAP(data);
      expect(isFinite(vwap)).toBe(true);
      expect(vwap).toBeGreaterThan(0);
    });
  });
});
