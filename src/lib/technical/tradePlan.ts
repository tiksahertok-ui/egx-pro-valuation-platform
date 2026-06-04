import { PivotLevels } from './supportResistance'

export type InvestmentHorizon = 'short' | 'medium' | 'long'

export interface TradePlan {
  horizon: InvestmentHorizon
  horizonLabel: string
  entryZoneLow: number
  entryZoneHigh: number
  primaryTarget: number
  secondaryTarget: number
  stopLoss: number
  riskRewardRatio: number
  basisOfEntry: string
  basisOfTarget: string
}

export function generateTradePlan(
  currentPrice: number,
  atr14: number,
  pivots: PivotLevels,
  fairValue: number,
  horizon: InvestmentHorizon
): TradePlan {
  const atrMultiplierMap = { short: 1.0, medium: 1.5, long: 2.0 }
  const atrMult = atrMultiplierMap[horizon]

  const entryZoneLow = pivots.s1
  const entryZoneHigh = Math.min(pivots.pivot, currentPrice * 1.005)
  const stopLoss = entryZoneLow - atrMult * atr14
  const primaryTarget = pivots.r1
  const secondaryTarget = horizon === 'long' ? fairValue : pivots.r2

  const risk = entryZoneHigh - stopLoss
  const reward = primaryTarget - entryZoneHigh
  const riskRewardRatio = risk > 0 ? reward / risk : 0

  const horizonLabels = {
    short: 'Short-term (1–5 days)',
    medium: 'Medium-term (1–3 months)',
    long: 'Long-term (6+ months)',
  }

  return {
    horizon,
    horizonLabel: horizonLabels[horizon],
    entryZoneLow,
    entryZoneHigh,
    primaryTarget,
    secondaryTarget,
    stopLoss,
    riskRewardRatio,
    basisOfEntry: `S1 pivot support zone (${entryZoneLow.toFixed(2)}–${entryZoneHigh.toFixed(2)} EGP)`,
    basisOfTarget: `R1 pivot resistance (primary), ${horizon === 'long' ? 'DCF fair value (secondary)' : 'R2 pivot (secondary)'}`,
  }
}
