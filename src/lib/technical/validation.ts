export const INDICATOR_MINIMUM_PERIODS: Record<string, number> = {
  RSI: 15,        // 14 + 1 for initial calculation
  MACD: 27,       // 26 EMA + 1
  SMA20: 20,
  SMA50: 50,
  SMA200: 200,
  EMA12: 13,
  EMA26: 27,
  ATR: 15,
  ADX: 29,        // 14 × 2 + 1 for smoothing
  STOCHASTIC: 15,
  WILLIAMS_R: 15,
  CCI: 15,
  BOLLINGER: 21,
  OBV: 2,
}

export function validateDataSufficiency(
  indicator: string,
  availablePeriods: number
): { sufficient: boolean; minimumRequired: number } {
  const minimum = INDICATOR_MINIMUM_PERIODS[indicator] ?? 14
  return {
    sufficient: availablePeriods >= minimum,
    minimumRequired: minimum,
  }
}
