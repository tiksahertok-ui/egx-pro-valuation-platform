import { EGYPT_MARKET_PARAMS, EgyptMarketParams } from './egyptMarketParams'

/**
 * Calculate Cost of Equity using CAPM for Egypt market
 * Ke = Rf + β × (ERP_mature + CRP)
 * Rf = CBE T-bill rate (EGP risk-free rate)
 * β measured against EGX30, not S&P 500
 */
export function calculateCostOfEquityEgypt(
  betaVsEGX30: number,
  params: EgyptMarketParams = EGYPT_MARKET_PARAMS
): number {
  return (
    params.riskFreeRate +
    betaVsEGX30 * params.totalEquityRiskPremium
  )
}

/**
 * Calculate WACC with Egypt-specific parameters
 */
export function calculateWACC(
  costOfEquity: number,
  costOfDebtPreTax: number,
  equityWeight: number,
  debtWeight: number,
  params: EgyptMarketParams = EGYPT_MARKET_PARAMS
): number {
  const costOfDebtAfterTax = costOfDebtPreTax * (1 - params.corporateTaxRate)
  return equityWeight * costOfEquity + debtWeight * costOfDebtAfterTax
}

/**
 * Validate terminal growth rate against WACC and currency convention
 */
export type CurrencyConvention = 'EGP_NOMINAL' | 'EGP_REAL' | 'USD_REAL'

export interface TerminalGrowthValidation {
  valid: boolean
  warning?: string
}

export function validateTerminalGrowthRate(
  terminalGrowthRate: number,
  wacc: number,
  convention: CurrencyConvention,
  params: EgyptMarketParams = EGYPT_MARKET_PARAMS
): TerminalGrowthValidation {
  // Gordon Growth Model requires: g < WACC
  if (terminalGrowthRate >= wacc) {
    return {
      valid: false,
      warning: `Terminal growth rate (${(terminalGrowthRate * 100).toFixed(1)}%) must be less than WACC (${(wacc * 100).toFixed(1)}%). The Gordon Growth Model produces invalid output when g ≥ WACC.`,
    }
  }

  // Convention-specific sanity checks
  if (convention === 'EGP_NOMINAL' && terminalGrowthRate < 0.05) {
    return {
      valid: true,
      warning: `For EGP nominal cash flows, terminal growth below 5% is unusually low given Egypt's inflation environment. Consider using ${(params.inflationRateEGP * 0.4 * 100).toFixed(0)}–${(params.inflationRateEGP * 0.6 * 100).toFixed(0)}% as a long-term nominal anchor.`,
    }
  }

  if (convention === 'USD_REAL' && terminalGrowthRate > 0.05) {
    return {
      valid: true,
      warning: `For USD real cash flows, terminal growth above 5% is unusually high. Standard perpetuity growth for mature USD real models is 2–3%.`,
    }
  }

  return { valid: true }
}
