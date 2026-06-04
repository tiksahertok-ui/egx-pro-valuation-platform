import { describe, it, expect } from 'vitest'
import { generateConfluentSignal } from '../signals'

describe('Confluent Signal Generation', () => {
  it('returns NEUTRAL when no signals fire', () => {
    const result = generateConfluentSignal({
      rsi: 50,
      macdHistogram: 0,
      macdSignalCross: null,
      priceVsSMA50: null,
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    expect(result.direction).toBe('NEUTRAL')
    expect(result.confluenceCount).toBe(0)
  })

  it('returns BUY with bullish inputs', () => {
    const result = generateConfluentSignal({
      rsi: 25,
      macdHistogram: 0.5,
      macdSignalCross: 'bullish',
      priceVsSMA50: 'above',
      priceVsSMA200: 'above',
      adx: 30,
      stochasticK: 15,
      bollingerPosition: 'oversold',
    })
    expect(result.direction).toBe('BUY')
    expect(result.strength).toBeGreaterThanOrEqual(3)
    expect(result.confluenceCount).toBeGreaterThanOrEqual(3)
    expect(result.triggeringIndicators.length).toBeGreaterThan(0)
  })

  it('returns SELL with bearish inputs', () => {
    const result = generateConfluentSignal({
      rsi: 75,
      macdHistogram: -0.5,
      macdSignalCross: 'bearish',
      priceVsSMA50: 'below',
      priceVsSMA200: 'below',
      adx: 28,
      stochasticK: 85,
      bollingerPosition: 'overbought',
    })
    expect(result.direction).toBe('SELL')
    expect(result.strength).toBeGreaterThanOrEqual(3)
    expect(result.confluenceCount).toBeGreaterThanOrEqual(3)
  })

  it('returns NEUTRAL with neutral inputs', () => {
    const result = generateConfluentSignal({
      rsi: 50,
      macdHistogram: 0,
      macdSignalCross: null,
      priceVsSMA50: null,
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    expect(result.direction).toBe('NEUTRAL')
    expect(result.confluenceCount).toBe(0)
    expect(result.triggeringIndicators).toHaveLength(0)
  })

  it('returns NEUTRAL when bullish and bearish signals are mixed equally', () => {
    const result = generateConfluentSignal({
      rsi: 50,  // neutral
      macdHistogram: 0,
      macdSignalCross: null,
      priceVsSMA50: 'above',  // 1 bullish
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    // Only 1 bullish signal, not enough for BUY (need >= 2)
    expect(result.direction).toBe('NEUTRAL')
  })

  it('returns NEUTRAL when equal bullish and bearish counts (1 each)', () => {
    const result = generateConfluentSignal({
      rsi: 50,
      macdHistogram: 0,
      macdSignalCross: null,
      priceVsSMA50: 'above',   // 1 bullish
      priceVsSMA200: 'below',  // 1 bearish
      adx: 25,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    expect(result.direction).toBe('NEUTRAL')
  })

  it('strength is capped at 5', () => {
    const result = generateConfluentSignal({
      rsi: 25,
      macdHistogram: 0.5,
      macdSignalCross: 'bullish',
      priceVsSMA50: 'above',
      priceVsSMA200: 'above',
      adx: 30,
      stochasticK: 15,
      bollingerPosition: 'oversold',
    })
    // All 7 indicators are bullish, but strength is capped at 5
    expect(result.strength).toBeLessThanOrEqual(5)
    expect(result.strength).toBe(5)
  })

  it('adds caveat when ADX < 20', () => {
    const result = generateConfluentSignal({
      rsi: 25,
      macdHistogram: 0.3,
      macdSignalCross: 'bullish',
      priceVsSMA50: 'above',
      priceVsSMA200: null,
      adx: 15,
      stochasticK: 15,
      bollingerPosition: 'oversold',
    })
    expect(result.caveat).toContain('Weak trend')
    expect(result.caveat).toContain('ADX')
  })

  it('no caveat when ADX >= 20', () => {
    const result = generateConfluentSignal({
      rsi: 50,
      macdHistogram: 0,
      macdSignalCross: null,
      priceVsSMA50: null,
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    expect(result.caveat).toBeUndefined()
  })

  it('adds caveat for bearish signal with weak trend', () => {
    const result = generateConfluentSignal({
      rsi: 75,
      macdHistogram: -0.5,
      macdSignalCross: 'bearish',
      priceVsSMA50: 'below',
      priceVsSMA200: null,
      adx: 18,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    expect(result.caveat).toContain('Weak trend')
  })

  it('triggering indicators list is correct for bullish', () => {
    const result = generateConfluentSignal({
      rsi: 25,
      macdHistogram: 0,
      macdSignalCross: 'bullish',
      priceVsSMA50: 'above',
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 15,
      bollingerPosition: 'oversold',
    })
    expect(result.triggeringIndicators).toContain('MACD bullish crossover')
    expect(result.triggeringIndicators).toContain('Price above SMA50')
    expect(result.triggeringIndicators.some(t => t.includes('RSI'))).toBe(true)
  })

  it('triggering indicators list is correct for bearish', () => {
    const result = generateConfluentSignal({
      rsi: 75,
      macdHistogram: 0,
      macdSignalCross: 'bearish',
      priceVsSMA50: 'below',
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 85,
      bollingerPosition: 'overbought',
    })
    expect(result.triggeringIndicators).toContain('MACD bearish crossover')
    expect(result.triggeringIndicators).toContain('Price below SMA50')
    expect(result.triggeringIndicators.some(t => t.includes('RSI'))).toBe(true)
  })

  it('BUY requires at least 2 bullish signals', () => {
    const result = generateConfluentSignal({
      rsi: 50,
      macdHistogram: 0,
      macdSignalCross: 'bullish',
      priceVsSMA50: null,
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    // Only 1 bullish signal (MACD crossover), need 2+
    expect(result.direction).toBe('NEUTRAL')
    expect(result.confluenceCount).toBe(0)
  })

  it('SELL requires at least 2 bearish signals', () => {
    const result = generateConfluentSignal({
      rsi: 50,
      macdHistogram: 0,
      macdSignalCross: 'bearish',
      priceVsSMA50: null,
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    // Only 1 bearish signal (MACD crossover), need 2+
    expect(result.direction).toBe('NEUTRAL')
  })
})
