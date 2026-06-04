// Residual Income Model
// RI = EPS - (Book Value per Share * Cost of Equity)
// Value = Book Value + PV of future residual income
// Terminal value = 0 (conservative) or continuing RI

import { FinancialDataInput, ValuationOutput } from './dcf-fcff';

export interface ResidualIncomeParams {
  financials: FinancialDataInput;
  latestFinancials: FinancialDataInput;
  currentPrice: number;
  beta: number;
  projectionYears?: number;
  terminalResidualIncome?: 'zero' | 'continuing' | 'decay';
}

/**
 * Calculate Cost of Equity using CAPM
 */
function calculateCostOfEquity(beta: number, riskFreeRate: number = 0.27, marketRiskPremium: number = 0.08): number {
  return riskFreeRate + beta * marketRiskPremium;
}

export function residualIncome(params: ResidualIncomeParams): ValuationOutput {
  const {
    financials,
    latestFinancials,
    currentPrice,
    beta,
    projectionYears = 10,
    terminalResidualIncome = 'decay',
  } = params;

  const baseKe = calculateCostOfEquity(beta);

  // Book Value per Share
  const bvps = latestFinancials.sharesOutstanding > 0
    ? latestFinancials.totalEquity / latestFinancials.sharesOutstanding
    : 0;

  // Current EPS
  const currentEPS = latestFinancials.sharesOutstanding > 0
    ? latestFinancials.netIncome / latestFinancials.sharesOutstanding
    : 0;

  // Current Residual Income
  const currentRI = currentEPS - (bvps * baseKe);

  // Estimate ROE for growth projections
  const currentROE = latestFinancials.totalEquity > 0
    ? latestFinancials.netIncome / latestFinancials.totalEquity
    : 0;

  // EPS growth rate estimate
  const retentionRatio = Math.max(0, 1 - latestFinancials.dividendsPerShare / Math.max(currentEPS, 0.01));
  const growthRate = currentROE * retentionRatio;

  // Bear, Base, Bull scenarios
  const bearKe = baseKe * 1.20;
  const bullKe = baseKe * 0.85;
  const bearGrowth = growthRate * 0.5;
  const bullGrowth = Math.min(growthRate * 1.5, 0.25);

  function computeRI(ke: number, gr: number): number {
    let value = bvps; // Start with book value
    let projectedEPS = currentEPS;
    let projectedBVPS = bvps;
    let residualIncomes: number[] = [];

    for (let year = 1; year <= projectionYears; year++) {
      projectedEPS = projectedEPS * (1 + gr);
      const ri = projectedEPS - (projectedBVPS * ke);
      residualIncomes.push(ri);
      value += ri / Math.pow(1 + ke, year);

      // Update book value: BV_new = BV_old + Earnings - Dividends
      const dps = projectedEPS * (1 - retentionRatio);
      projectedBVPS = projectedBVPS + projectedEPS - dps;
    }

    // Terminal value
    if (terminalResidualIncome === 'continuing') {
      const lastRI = residualIncomes[residualIncomes.length - 1];
      if (lastRI > 0 && ke > 0) {
        const terminalValue = lastRI / ke;
        value += terminalValue / Math.pow(1 + ke, projectionYears);
      }
    } else if (terminalResidualIncome === 'decay') {
      // RI decays to zero over additional years (conservative)
      let lastRI = residualIncomes[residualIncomes.length - 1];
      const decayRate = 0.5; // RI halves each year
      for (let year = 1; year <= 5; year++) {
        lastRI = lastRI * (1 - decayRate);
        value += lastRI / Math.pow(1 + ke, projectionYears + year);
      }
    }
    // 'zero' terminal: no additional value

    return Math.max(0, value);
  }

  const bearCase = computeRI(bearKe, bearGrowth);
  const baseCase = computeRI(baseKe, growthRate);
  const bullCase = computeRI(bullKe, bullGrowth);

  const fairValue = bearCase * 0.25 + baseCase * 0.50 + bullCase * 0.25;

  const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  const spread = bullCase > 0 && bearCase > 0 ? (bullCase - bearCase) / baseCase : 1;
  const confidence = Math.max(0.1, Math.min(0.90, 1 - spread * 0.25));

  const terminalDesc = terminalResidualIncome === 'zero' ? 'Terminal RI = 0 (conservative)' 
    : terminalResidualIncome === 'continuing' ? 'Terminal RI perpetuity'
    : 'Terminal RI decays to 0 over 5 years';

  const assumptions = `Residual Income Model: BVPS EGP ${bvps.toFixed(2)}, Current RI EGP ${currentRI.toFixed(2)}, ROE ${(currentROE * 100).toFixed(1)}%, Ke ${(baseKe * 100).toFixed(1)}%, Growth ${(growthRate * 100).toFixed(1)}%. ${terminalDesc}. Projection: ${projectionYears} years.`;

  return {
    model: 'Residual Income',
    fairValue: parseFloat(fairValue.toFixed(2)),
    bearCase: parseFloat(bearCase.toFixed(2)),
    baseCase: parseFloat(baseCase.toFixed(2)),
    bullCase: parseFloat(bullCase.toFixed(2)),
    upside: parseFloat(upside.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    assumptions,
  };
}
