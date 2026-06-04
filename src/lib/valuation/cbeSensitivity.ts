import { calculateCostOfEquityEgypt, calculateWACC } from './wacc'
import { EGYPT_MARKET_PARAMS, EgyptMarketParams } from './egyptMarketParams'

export interface SensitivityPoint {
  rateChangeBps: number   // basis points change in CBE rate
  newRiskFreeRate: number
  newWACC: number
  waccChangeBps: number
  fairValueMultiplier: number  // 1.0 = no change, >1 = fair value increases
}

export interface CBESensitivityResult {
  baseWACC: number
  baseFairValue: number
  points: SensitivityPoint[]
  summary: {
    plus100bps: { waccImpact: number; fairValueImpact: number }
    minus100bps: { waccImpact: number; fairValueImpact: number }
    plus200bps: { waccImpact: number; fairValueImpact: number }
    minus200bps: { waccImpact: number; fairValueImpact: number }
    plus300bps: { waccImpact: number; fairValueImpact: number }
    minus300bps: { waccImpact: number; fairValueImpact: number }
  }
}

/**
 * Calculate CBE interest rate sensitivity analysis
 * Shows how changes in the CBE overnight rate affect WACC and DCF fair value
 */
export function calculateCBESensitivity(
  beta: number,
  costOfDebtPreTax: number,
  equityWeight: number,
  debtWeight: number,
  baseFairValue: number,
  params: EgyptMarketParams = EGYPT_MARKET_PARAMS
): CBESensitivityResult {
  // Base WACC
  const baseCostOfEquity = calculateCostOfEquityEgypt(beta, params)
  const baseWACC = calculateWACC(baseCostOfEquity, costOfDebtPreTax, equityWeight, debtWeight, params)

  const bpsChanges = [-300, -200, -100, 0, 100, 200, 300]

  const points: SensitivityPoint[] = bpsChanges.map(bpsChange => {
    const newRiskFreeRate = params.riskFreeRate + bpsChange / 10000
    const adjustedParams: EgyptMarketParams = {
      ...params,
      riskFreeRate: Math.max(0, newRiskFreeRate),
    }
    
    const newCostOfEquity = calculateCostOfEquityEgypt(beta, adjustedParams)
    const newWACC = calculateWACC(newCostOfEquity, costOfDebtPreTax, equityWeight, debtWeight, adjustedParams)
    
    const waccChange = (newWACC - baseWACC) * 10000 // in bps
    
    // Fair value impact: using simplified DCF sensitivity
    // If WACC changes, terminal value changes inversely
    // FV_new ≈ FV_base × (baseWACC / newWACC) for a rough approximation
    const fairValueMultiplier = newWACC > 0 ? baseWACC / newWACC : 1.0
    
    return {
      rateChangeBps: bpsChange,
      newRiskFreeRate: Math.max(0, newRiskFreeRate),
      newWACC,
      waccChangeBps: parseFloat(waccChange.toFixed(1)),
      fairValueMultiplier: parseFloat(fairValueMultiplier.toFixed(4)),
    }
  })

  const getPoint = (bps: number) => {
    const p = points.find(pt => pt.rateChangeBps === bps)!
    return {
      waccImpact: p.waccChangeBps,
      fairValueImpact: parseFloat(((p.fairValueMultiplier - 1) * 100).toFixed(2)),
    }
  }

  return {
    baseWACC,
    baseFairValue,
    points,
    summary: {
      plus100bps: getPoint(100),
      minus100bps: getPoint(-100),
      plus200bps: getPoint(200),
      minus200bps: getPoint(-200),
      plus300bps: getPoint(300),
      minus300bps: getPoint(-300),
    },
  }
}
