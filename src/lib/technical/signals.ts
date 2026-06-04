export interface SignalInput {
  rsi: number | null
  macdHistogram: number | null
  macdSignalCross: 'bullish' | 'bearish' | null
  priceVsSMA50: 'above' | 'below' | null
  priceVsSMA200: 'above' | 'below' | null
  adx: number | null
  stochasticK: number | null
  bollingerPosition: 'overbought' | 'oversold' | 'neutral' | null
}

export interface ConfluentSignal {
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  strength: 1 | 2 | 3 | 4 | 5   // 1=weak, 5=strong
  confluenceCount: number          // number of agreeing indicators
  triggeringIndicators: string[]   // which indicators fired
  caveat?: string                  // e.g. "weak trend (ADX < 20)"
}

export function generateConfluentSignal(inputs: SignalInput): ConfluentSignal {
  const bullish: string[] = []
  const bearish: string[] = []

  if (inputs.rsi !== null) {
    if (inputs.rsi < 35) bullish.push(`RSI oversold (${inputs.rsi.toFixed(0)})`)
    if (inputs.rsi > 65) bearish.push(`RSI overbought (${inputs.rsi.toFixed(0)})`)
  }
  if (inputs.macdSignalCross === 'bullish') bullish.push('MACD bullish crossover')
  if (inputs.macdSignalCross === 'bearish') bearish.push('MACD bearish crossover')
  if (inputs.priceVsSMA50 === 'above') bullish.push('Price above SMA50')
  if (inputs.priceVsSMA50 === 'below') bearish.push('Price below SMA50')
  if (inputs.priceVsSMA200 === 'above') bullish.push('Price above SMA200')
  if (inputs.priceVsSMA200 === 'below') bearish.push('Price below SMA200')
  if (inputs.bollingerPosition === 'oversold') bullish.push('Bollinger lower band touch')
  if (inputs.bollingerPosition === 'overbought') bearish.push('Bollinger upper band touch')
  if (inputs.stochasticK !== null) {
    if (inputs.stochasticK < 20) bullish.push(`Stochastic oversold (${inputs.stochasticK.toFixed(0)})`)
    if (inputs.stochasticK > 80) bearish.push(`Stochastic overbought (${inputs.stochasticK.toFixed(0)})`)
  }

  const isBull = bullish.length > bearish.length && bullish.length >= 2
  const isBear = bearish.length > bullish.length && bearish.length >= 2
  const count = isBull ? bullish.length : isBear ? bearish.length : 0
  const strength = Math.min(5, count) as 1 | 2 | 3 | 4 | 5

  const weakTrend = inputs.adx !== null && inputs.adx < 20
  const caveat = weakTrend ? 'Weak trend detected (ADX < 20) — signal reliability reduced' : undefined

  return {
    direction: isBull ? 'BUY' : isBear ? 'SELL' : 'NEUTRAL',
    strength,
    confluenceCount: count,
    triggeringIndicators: isBull ? bullish : isBear ? bearish : [],
    caveat,
  }
}
