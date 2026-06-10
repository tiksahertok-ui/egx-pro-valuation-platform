/**
 * Backtesting Engine (P2.3)
 *
 * Validates model accuracy by comparing historical fair value estimates
 * against actual forward returns.
 *
 * Metrics:
 * - Sharpe Ratio: risk-adjusted return of following model recommendations
 * - Hit Rate: % of "Buy" ratings that outperformed EGX30
 * - Average Realized Alpha: average excess return vs benchmark
 */

export interface BacktestDataPoint {
  date: string;
  fairValue: number;
  marketPrice: number;
  verdict: 'undervalued' | 'fair' | 'overvalued';
  confidence: number;
  forwardReturn1Y?: number; // Actual 1-year forward return
  benchmarkReturn1Y?: number; // EGX30 1-year forward return
}

export interface BacktestResult {
  sharpeRatio: number;
  hitRate: number; // % of "Buy" that outperformed
  averageAlpha: number; // Average excess return vs benchmark
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  correctBuys: number; // Buy signals where forward return > benchmark
  correctSells: number; // Sell signals where forward return < benchmark
  averageForwardReturn: number;
  averageBenchmarkReturn: number;
  maxDrawdown: number;
}

/**
 * Run backtest analysis on historical valuation signals.
 *
 * @param dataPoints - Array of historical backtest data points
 * @returns BacktestResult with performance metrics
 */
export function runBacktest(dataPoints: BacktestDataPoint[]): BacktestResult {
  if (dataPoints.length === 0) {
    return {
      sharpeRatio: 0,
      hitRate: 0,
      averageAlpha: 0,
      totalSignals: 0,
      buySignals: 0,
      sellSignals: 0,
      correctBuys: 0,
      correctSells: 0,
      averageForwardReturn: 0,
      averageBenchmarkReturn: 0,
      maxDrawdown: 0,
    };
  }

  // Filter to points with forward returns available
  const validPoints = dataPoints.filter(
    p => p.forwardReturn1Y !== undefined && p.benchmarkReturn1Y !== undefined
  );

  if (validPoints.length === 0) {
    return {
      sharpeRatio: 0,
      hitRate: 0,
      averageAlpha: 0,
      totalSignals: dataPoints.length,
      buySignals: dataPoints.filter(p => p.verdict === 'undervalued').length,
      sellSignals: dataPoints.filter(p => p.verdict === 'overvalued').length,
      correctBuys: 0,
      correctSells: 0,
      averageForwardReturn: 0,
      averageBenchmarkReturn: 0,
      maxDrawdown: 0,
    };
  }

  const buyPoints = validPoints.filter(p => p.verdict === 'undervalued');
  const sellPoints = validPoints.filter(p => p.verdict === 'overvalued');

  // Hit rate: % of buy signals that outperformed benchmark
  const correctBuys = buyPoints.filter(
    p => (p.forwardReturn1Y ?? 0) > (p.benchmarkReturn1Y ?? 0)
  ).length;
  const correctSells = sellPoints.filter(
    p => (p.forwardReturn1Y ?? 0) < (p.benchmarkReturn1Y ?? 0)
  ).length;

  const hitRate = buyPoints.length > 0 ? correctBuys / buyPoints.length : 0;

  // Average alpha
  const alphas = validPoints.map(p => (p.forwardReturn1Y ?? 0) - (p.benchmarkReturn1Y ?? 0));
  const averageAlpha = alphas.reduce((a, b) => a + b, 0) / alphas.length;

  // Average returns
  const avgForwardReturn = validPoints.reduce((s, p) => s + (p.forwardReturn1Y ?? 0), 0) / validPoints.length;
  const avgBenchmarkReturn = validPoints.reduce((s, p) => s + (p.benchmarkReturn1Y ?? 0), 0) / validPoints.length;

  // Sharpe ratio (simplified: mean alpha / std of alpha)
  const meanAlpha = averageAlpha;
  const alphaVariance = alphas.reduce((s, a) => s + Math.pow(a - meanAlpha, 2), 0) / alphas.length;
  const alphaStd = Math.sqrt(alphaVariance);
  const sharpeRatio = alphaStd > 0 ? meanAlpha / alphaStd : 0;

  // Max drawdown from following buy signals
  let cumulativeReturn = 1;
  let peak = 1;
  let maxDrawdown = 0;
  const sortedBuys = [...buyPoints].sort((a, b) => a.date.localeCompare(b.date));
  for (const bp of sortedBuys) {
    cumulativeReturn *= (1 + (bp.forwardReturn1Y ?? 0));
    if (cumulativeReturn > peak) peak = cumulativeReturn;
    const drawdown = (peak - cumulativeReturn) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return {
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    hitRate: Math.round(hitRate * 10000) / 100, // as percentage
    averageAlpha: Math.round(averageAlpha * 10000) / 100, // as percentage
    totalSignals: dataPoints.length,
    buySignals: buyPoints.length,
    sellSignals: sellPoints.length,
    correctBuys,
    correctSells,
    averageForwardReturn: Math.round(avgForwardReturn * 10000) / 100,
    averageBenchmarkReturn: Math.round(avgBenchmarkReturn * 10000) / 100,
    maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
  };
}

/**
 * Calculate fair value at a historical date using available data.
 *
 * This is a simplified version that adjusts the current fair value
 * based on the historical price ratio. In a production system,
 * you would recompute valuations using actual historical financials.
 *
 * @param currentFairValue - Current composite fair value
 * @param currentPrice - Current market price
 * @param historicalPrice - Price at the historical date
 */
export function historicalFairValue(
  currentFairValue: number,
  currentPrice: number,
  historicalPrice: number,
): number {
  if (currentPrice <= 0 || historicalPrice <= 0) return 0;
  // Simple proportional scaling: assume FV/price ratio stays approximately constant
  const ratio = currentFairValue / currentPrice;
  return Math.round(historicalPrice * ratio * 100) / 100;
}
