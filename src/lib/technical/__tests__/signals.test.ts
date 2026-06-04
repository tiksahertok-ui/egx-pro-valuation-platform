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

  it('returns BUY when multiple bullish signals fire', () => {
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

  it('returns SELL when multiple bearish signals fire', () => {
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
  })

  it('adds caveat for weak trend (ADX < 20)', () => {
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

  it('returns NEUTRAL when bullish and bearish signals are equal', () => {
    const result = generateConfluentSignal({
      rsi: 50,  // neutral
      macdHistogram: 0,
      macdSignalCross: null,
      priceVsSMA50: 'above',  // bullish
      priceVsSMA200: null,
      adx: 25,
      stochasticK: 50,
      bollingerPosition: 'neutral',
    })
    // Only 1 bullish signal, not enough for BUY (need >= 2)
    expect(result.direction).toBe('NEUTRAL')
  })
})
