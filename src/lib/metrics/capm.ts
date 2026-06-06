/**
 * Dynamic Beta Calculation Module
 * Computes rolling beta from stock and market returns using covariance/variance.
 * Falls back to a default beta of 1.0 if insufficient data.
 */

export function computeBeta(stockReturns: number[], marketReturns: number[]): number {
  if (stockReturns.length < 10 || marketReturns.length < 10) return 1.0;
  
  const n = Math.min(stockReturns.length, marketReturns.length);
  const sr = stockReturns.slice(0, n);
  const mr = marketReturns.slice(0, n);

  const meanS = sr.reduce((a, b) => a + b, 0) / n;
  const meanM = mr.reduce((a, b) => a + b, 0) / n;

  let cov = 0;
  let varMkt = 0;
  for (let i = 0; i < n; i++) {
    cov += (sr[i] - meanS) * (mr[i] - meanM);
    varMkt += (mr[i] - meanM) * (mr[i] - meanM);
  }
  cov /= (n - 1);
  varMkt /= (n - 1);

  if (varMkt === 0) return 1.0;
  const beta = cov / varMkt;
  // Clamp beta to reasonable range for EGX
  return Math.max(0.2, Math.min(beta, 2.5));
}

export function computeReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  return returns;
}
