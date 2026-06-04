// Technical Analysis Library
// Calculate technical indicators from price history and generate buy/sell signals

export { calculateFloorPivots, calculateFibonacciPivots, findSwingHighsLows } from './supportResistance'
export type { PivotLevels } from './supportResistance'
export { generateConfluentSignal } from './signals'
export type { SignalInput, ConfluentSignal } from './signals'
export { generateTradePlan } from './tradePlan'
export type { InvestmentHorizon, TradePlan } from './tradePlan'
export { validateDataSufficiency, INDICATOR_MINIMUM_PERIODS } from './validation'
import { validateDataSufficiency } from './validation'

export interface PriceDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalAnalysisResult {
  date: string;
  // Trend Indicators
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  adx14: number;

  // Momentum Indicators
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  stochK: number;
  stochD: number;
  williamsR: number;
  cci14: number;

  // Volatility Indicators
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  atr14: number;

  // Volume Indicators
  obv: number;

  // Signals
  overallSignal: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  signalScore: number; // -100 to +100
  signals: TechnicalSignal[];

  // Data Sufficiency
  dataSufficiency?: DataSufficiencyInfo;
}

export interface DataSufficiencyInfo {
  availablePeriods: number;
  insufficientIndicators: string[];
}

export interface TechnicalSignal {
  indicator: string;
  signal: 'Buy' | 'Sell' | 'Neutral';
  description: string;
  strength: number; // 1-5
}

/**
 * Calculate Simple Moving Average
 */
function sma(data: number[], period: number, endIdx: number): number {
  if (endIdx < period - 1 || endIdx >= data.length) return 0;
  let sum = 0;
  for (let i = endIdx - period + 1; i <= endIdx; i++) sum += data[i];
  return sum / period;
}

/**
 * Calculate Exponential Moving Average
 */
function ema(data: number[], period: number, endIdx: number): number {
  if (endIdx < period - 1 || endIdx >= data.length) return 0;
  const k = 2 / (period + 1);
  let prevEma = sma(data, period, period - 1);
  for (let i = period; i <= endIdx; i++) {
    prevEma = data[i] * k + prevEma * (1 - k);
  }
  return prevEma;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calcRSI(closes: number[], endIdx: number, period: number = 14): number {
  if (endIdx < period) return 50;
  let gains = 0, losses = 0;
  for (let i = endIdx - period + 1; i <= endIdx; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD
 */
function calcMACD(closes: number[], endIdx: number): { macd: number; signal: number; histogram: number } {
  const ema12 = ema(closes, 12, endIdx);
  const ema26 = ema(closes, 26, endIdx);
  const macdLine = ema12 - ema26;

  // Calculate MACD signal line (9-period EMA of MACD)
  if (endIdx < 26) return { macd: 0, signal: 0, histogram: 0 };

  const macdValues: number[] = [];
  for (let i = 26; i <= endIdx; i++) {
    const e12 = ema(closes, 12, i);
    const e26 = ema(closes, 26, i);
    macdValues.push(e12 - e26);
  }

  const signal = macdValues.length >= 9 ? ema(macdValues, 9, macdValues.length - 1) : macdLine;
  const histogram = macdLine - signal;

  return { macd: macdLine, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
function calcBollingerBands(closes: number[], endIdx: number, period: number = 20, stdMultiplier: number = 2): {
  upper: number; middle: number; lower: number;
} {
  if (endIdx < period - 1) return { upper: 0, middle: 0, lower: 0 };
  
  const middle = sma(closes, period, endIdx);
  let variance = 0;
  for (let i = endIdx - period + 1; i <= endIdx; i++) {
    variance += Math.pow(closes[i] - middle, 2);
  }
  const stdDev = Math.sqrt(variance / period);
  
  return {
    upper: middle + stdMultiplier * stdDev,
    middle,
    lower: middle - stdMultiplier * stdDev,
  };
}

/**
 * Calculate ATR (Average True Range)
 */
function calcATR(highs: number[], lows: number[], closes: number[], endIdx: number, period: number = 14): number {
  if (endIdx < period) return 0;
  let sum = 0;
  for (let i = endIdx - period + 1; i <= endIdx; i++) {
    if (i < 1) continue;
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    sum += tr;
  }
  return sum / period;
}

/**
 * Calculate ADX (Average Directional Index)
 */
function calcADX(highs: number[], lows: number[], closes: number[], endIdx: number, period: number = 14): number {
  if (endIdx < period * 2) return 25;
  
  let sumDX = 0;
  let count = 0;
  
  for (let i = endIdx - period + 1; i <= endIdx; i++) {
    let plusDM = 0, minusDM = 0, sumTR = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (j < 1) continue;
      const upMove = highs[j] - highs[j - 1];
      const downMove = lows[j - 1] - lows[j];
      if (upMove > downMove && upMove > 0) plusDM += upMove;
      if (downMove > upMove && downMove > 0) minusDM += downMove;
      sumTR += Math.max(
        highs[j] - lows[j],
        Math.abs(highs[j] - closes[j - 1]),
        Math.abs(lows[j] - closes[j - 1])
      );
    }
    if (sumTR === 0) continue;
    const plusDI = (plusDM / sumTR) * 100;
    const minusDI = (minusDM / sumTR) * 100;
    const diSum = plusDI + minusDI;
    if (diSum === 0) continue;
    sumDX += Math.abs(plusDI - minusDI) / diSum * 100;
    count++;
  }
  
  return count > 0 ? sumDX / count : 25;
}

/**
 * Calculate Stochastic Oscillator
 */
function calcStochastic(highs: number[], lows: number[], closes: number[], endIdx: number, period: number = 14): { k: number; d: number } {
  if (endIdx < period - 1) return { k: 50, d: 50 };
  
  const kValues: number[] = [];
  for (let i = Math.max(period - 1, endIdx - 2); i <= endIdx; i++) {
    let highestHigh = -Infinity, lowestLow = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      highestHigh = Math.max(highestHigh, highs[j]);
      lowestLow = Math.min(lowestLow, lows[j]);
    }
    kValues.push(highestHigh === lowestLow ? 50 : ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100);
  }
  
  const k = kValues[kValues.length - 1];
  const d = kValues.length >= 3 ? kValues.slice(-3).reduce((a, b) => a + b, 0) / 3 : k;
  
  return { k, d };
}

/**
 * Calculate Williams %R
 */
function calcWilliamsR(highs: number[], lows: number[], closes: number[], endIdx: number, period: number = 14): number {
  if (endIdx < period - 1) return -50;
  let highestHigh = -Infinity, lowestLow = Infinity;
  for (let i = endIdx - period + 1; i <= endIdx; i++) {
    highestHigh = Math.max(highestHigh, highs[i]);
    lowestLow = Math.min(lowestLow, lows[i]);
  }
  if (highestHigh === lowestLow) return -50;
  return ((highestHigh - closes[endIdx]) / (highestHigh - lowestLow)) * -100;
}

/**
 * Calculate CCI (Commodity Channel Index)
 */
function calcCCI(highs: number[], lows: number[], closes: number[], endIdx: number, period: number = 14): number {
  if (endIdx < period - 1) return 0;
  
  const tps: number[] = [];
  for (let i = endIdx - period + 1; i <= endIdx; i++) {
    tps.push((highs[i] + lows[i] + closes[i]) / 3);
  }
  
  const mean = tps.reduce((a, b) => a + b, 0) / period;
  const md = tps.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
  if (md === 0) return 0;
  
  const currentTP = (highs[endIdx] + lows[endIdx] + closes[endIdx]) / 3;
  return (currentTP - mean) / (0.015 * md);
}

/**
 * Calculate OBV (On Balance Volume)
 */
function calcOBV(closes: number[], volumes: number[], endIdx: number): number {
  let obv = 0;
  for (let i = 1; i <= endIdx; i++) {
    if (closes[i] > closes[i - 1]) obv += volumes[i];
    else if (closes[i] < closes[i - 1]) obv -= volumes[i];
  }
  return obv;
}

/**
 * Generate buy/sell signals based on indicator combinations
 */
function generateSignals(
  rsi: number, macd: number, macdSignal: number, macdHistogram: number,
  stochK: number, stochD: number, williamsR: number, cci: number,
  sma20: number, sma50: number, sma200: number, close: number,
  bbUpper: number, bbLower: number, adx: number, atr: number,
  prevMACD: number, prevMACDSignal: number
): { signals: TechnicalSignal[]; score: number; overall: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell' } {
  const signals: TechnicalSignal[] = [];
  let score = 0;

  // RSI Signal
  if (rsi < 30) {
    signals.push({ indicator: 'RSI(14)', signal: 'Buy', description: `RSI at ${rsi.toFixed(1)} indicates oversold conditions`, strength: rsi < 20 ? 5 : 4 });
    score += rsi < 20 ? 25 : 18;
  } else if (rsi > 70) {
    signals.push({ indicator: 'RSI(14)', signal: 'Sell', description: `RSI at ${rsi.toFixed(1)} indicates overbought conditions`, strength: rsi > 80 ? 5 : 4 });
    score -= rsi > 80 ? 25 : 18;
  } else {
    signals.push({ indicator: 'RSI(14)', signal: 'Neutral', description: `RSI at ${rsi.toFixed(1)} is in neutral territory`, strength: 1 });
  }

  // MACD Signal
  if (macdHistogram > 0 && prevMACD <= prevMACDSignal) {
    signals.push({ indicator: 'MACD', signal: 'Buy', description: 'MACD crossed above signal line (bullish crossover)', strength: 4 });
    score += 20;
  } else if (macdHistogram < 0 && prevMACD >= prevMACDSignal) {
    signals.push({ indicator: 'MACD', signal: 'Sell', description: 'MACD crossed below signal line (bearish crossover)', strength: 4 });
    score -= 20;
  } else if (macdHistogram > 0) {
    signals.push({ indicator: 'MACD', signal: 'Buy', description: 'MACD above signal line (bullish momentum)', strength: 2 });
    score += 8;
  } else {
    signals.push({ indicator: 'MACD', signal: 'Sell', description: 'MACD below signal line (bearish momentum)', strength: 2 });
    score -= 8;
  }

  // Bollinger Bands Signal
  if (close <= bbLower) {
    signals.push({ indicator: 'Bollinger Bands', signal: 'Buy', description: 'Price at or below lower Bollinger Band (potential reversal)', strength: 3 });
    score += 12;
  } else if (close >= bbUpper) {
    signals.push({ indicator: 'Bollinger Bands', signal: 'Sell', description: 'Price at or above upper Bollinger Band (potential reversal)', strength: 3 });
    score -= 12;
  } else {
    signals.push({ indicator: 'Bollinger Bands', signal: 'Neutral', description: 'Price within Bollinger Bands', strength: 1 });
  }

  // Moving Average Signal
  if (sma20 > 0 && sma50 > 0) {
    if (close > sma20 && close > sma50 && sma20 > sma50) {
      signals.push({ indicator: 'Moving Averages', signal: 'Buy', description: 'Price above SMA20 & SMA50 with golden cross formation', strength: 4 });
      score += 18;
    } else if (close < sma20 && close < sma50 && sma20 < sma50) {
      signals.push({ indicator: 'Moving Averages', signal: 'Sell', description: 'Price below SMA20 & SMA50 with death cross formation', strength: 4 });
      score -= 18;
    } else if (close > sma20) {
      signals.push({ indicator: 'Moving Averages', signal: 'Buy', description: 'Price above SMA20 (short-term bullish)', strength: 2 });
      score += 8;
    } else {
      signals.push({ indicator: 'Moving Averages', signal: 'Sell', description: 'Price below SMA20 (short-term bearish)', strength: 2 });
      score -= 8;
    }
  }

  // Stochastic Signal
  if (stochK < 20 && stochD < 20) {
    signals.push({ indicator: 'Stochastic', signal: 'Buy', description: `Stochastic K:${stochK.toFixed(1)} D:${stochD.toFixed(1)} in oversold zone`, strength: 3 });
    score += 12;
  } else if (stochK > 80 && stochD > 80) {
    signals.push({ indicator: 'Stochastic', signal: 'Sell', description: `Stochastic K:${stochK.toFixed(1)} D:${stochD.toFixed(1)} in overbought zone`, strength: 3 });
    score -= 12;
  } else if (stochK > stochD) {
    signals.push({ indicator: 'Stochastic', signal: 'Buy', description: 'Stochastic K above D (bullish momentum)', strength: 1 });
    score += 4;
  } else {
    signals.push({ indicator: 'Stochastic', signal: 'Sell', description: 'Stochastic K below D (bearish momentum)', strength: 1 });
    score -= 4;
  }

  // Williams %R Signal
  if (williamsR < -80) {
    signals.push({ indicator: 'Williams %R', signal: 'Buy', description: `Williams %R at ${williamsR.toFixed(1)} indicates oversold`, strength: 3 });
    score += 10;
  } else if (williamsR > -20) {
    signals.push({ indicator: 'Williams %R', signal: 'Sell', description: `Williams %R at ${williamsR.toFixed(1)} indicates overbought`, strength: 3 });
    score -= 10;
  } else {
    signals.push({ indicator: 'Williams %R', signal: 'Neutral', description: `Williams %R at ${williamsR.toFixed(1)} is neutral`, strength: 1 });
  }

  // CCI Signal
  if (cci < -100) {
    signals.push({ indicator: 'CCI(14)', signal: 'Buy', description: `CCI at ${cci.toFixed(1)} indicates oversold`, strength: 2 });
    score += 8;
  } else if (cci > 100) {
    signals.push({ indicator: 'CCI(14)', signal: 'Sell', description: `CCI at ${cci.toFixed(1)} indicates overbought`, strength: 2 });
    score -= 8;
  } else {
    signals.push({ indicator: 'CCI(14)', signal: 'Neutral', description: `CCI at ${cci.toFixed(1)} is in normal range`, strength: 1 });
  }

  // ADX (Trend Strength)
  if (adx > 25) {
    signals.push({ indicator: 'ADX(14)', signal: score > 0 ? 'Buy' : 'Sell', description: `ADX at ${adx.toFixed(1)} indicates strong trend (${score > 0 ? 'bullish' : 'bearish'})`, strength: 3 });
    score += score > 0 ? 5 : -5;
  } else {
    signals.push({ indicator: 'ADX(14)', signal: 'Neutral', description: `ADX at ${adx.toFixed(1)} indicates weak/no trend`, strength: 1 });
  }

  // Clamp score
  score = Math.max(-100, Math.min(100, score));

  // Determine overall signal
  let overall: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  if (score >= 50) overall = 'Strong Buy';
  else if (score >= 15) overall = 'Buy';
  else if (score > -15) overall = 'Neutral';
  else if (score > -50) overall = 'Sell';
  else overall = 'Strong Sell';

  return { signals, score, overall };
}

/**
 * Run comprehensive technical analysis on price history
 */
export function runTechnicalAnalysis(priceHistory: PriceDataPoint[]): TechnicalAnalysisResult {
  const availablePeriods = priceHistory.length;

  // Data sufficiency validation
  const insufficientIndicators: string[] = [];
  const indicatorChecks: string[] = ['RSI', 'MACD', 'SMA20', 'SMA50', 'SMA200', 'EMA12', 'EMA26', 'ATR', 'ADX', 'STOCHASTIC', 'WILLIAMS_R', 'CCI', 'BOLLINGER', 'OBV'];
  for (const indicator of indicatorChecks) {
    const { sufficient } = validateDataSufficiency(indicator, availablePeriods);
    if (!sufficient) {
      insufficientIndicators.push(indicator);
    }
  }
  const dataSufficiency: DataSufficiencyInfo = {
    availablePeriods,
    insufficientIndicators,
  };

  if (priceHistory.length < 2) {
    return {
      date: '',
      sma20: 0, sma50: 0, sma200: 0, ema12: 0, ema26: 0, adx14: 0,
      rsi14: 50, macd: 0, macdSignal: 0, macdHistogram: 0,
      stochK: 50, stochD: 50, williamsR: -50, cci14: 0,
      bbUpper: 0, bbMiddle: 0, bbLower: 0, atr14: 0,
      obv: 0, overallSignal: 'Neutral', signalScore: 0, signals: [],
      dataSufficiency,
    };
  }

  const closes = priceHistory.map(p => p.close);
  const highs = priceHistory.map(p => p.high);
  const lows = priceHistory.map(p => p.low);
  const volumes = priceHistory.map(p => p.volume);

  const endIdx = closes.length - 1;
  const currentClose = closes[endIdx];

  // Calculate all indicators (with data sufficiency awareness)
  const _sma20 = validateDataSufficiency('SMA20', availablePeriods).sufficient ? sma(closes, 20, endIdx) : 0;
  const _sma50 = validateDataSufficiency('SMA50', availablePeriods).sufficient ? sma(closes, 50, endIdx) : 0;
  const _sma200 = validateDataSufficiency('SMA200', availablePeriods).sufficient ? sma(closes, 200, endIdx) : 0;
  const _ema12 = validateDataSufficiency('EMA12', availablePeriods).sufficient ? ema(closes, 12, endIdx) : 0;
  const _ema26 = validateDataSufficiency('EMA26', availablePeriods).sufficient ? ema(closes, 26, endIdx) : 0;

  const _rsi14 = validateDataSufficiency('RSI', availablePeriods).sufficient ? calcRSI(closes, endIdx) : 50;
  const _macd = validateDataSufficiency('MACD', availablePeriods).sufficient ? calcMACD(closes, endIdx) : { macd: 0, signal: 0, histogram: 0 };
  const _bb = validateDataSufficiency('BOLLINGER', availablePeriods).sufficient ? calcBollingerBands(closes, endIdx) : { upper: 0, middle: 0, lower: 0 };
  const _atr14 = validateDataSufficiency('ATR', availablePeriods).sufficient ? calcATR(highs, lows, closes, endIdx) : 0;
  const _adx14 = validateDataSufficiency('ADX', availablePeriods).sufficient ? calcADX(highs, lows, closes, endIdx) : 25;
  const _stoch = validateDataSufficiency('STOCHASTIC', availablePeriods).sufficient ? calcStochastic(highs, lows, closes, endIdx) : { k: 50, d: 50 };
  const _williamsR = validateDataSufficiency('WILLIAMS_R', availablePeriods).sufficient ? calcWilliamsR(highs, lows, closes, endIdx) : -50;
  const _cci14 = validateDataSufficiency('CCI', availablePeriods).sufficient ? calcCCI(highs, lows, closes, endIdx) : 0;
  const _obv = validateDataSufficiency('OBV', availablePeriods).sufficient ? calcOBV(closes, volumes, endIdx) : 0;

  // Previous MACD values for crossover detection
  const prevMACD = endIdx > 0 && validateDataSufficiency('MACD', availablePeriods).sufficient ? calcMACD(closes, endIdx - 1) : { macd: _macd.macd, signal: _macd.signal };

  // Generate signals
  const { signals, score, overall } = generateSignals(
    _rsi14, _macd.macd, _macd.signal, _macd.histogram,
    _stoch.k, _stoch.d, _williamsR, _cci14,
    _sma20, _sma50, _sma200, currentClose,
    _bb.upper, _bb.lower, _adx14, _atr14,
    prevMACD.macd, prevMACD.signal
  );

  return {
    date: priceHistory[endIdx].date,
    sma20: parseFloat(_sma20.toFixed(2)),
    sma50: parseFloat(_sma50.toFixed(2)),
    sma200: parseFloat(_sma200.toFixed(2)),
    ema12: parseFloat(_ema12.toFixed(2)),
    ema26: parseFloat(_ema26.toFixed(2)),
    adx14: parseFloat(_adx14.toFixed(2)),
    rsi14: parseFloat(_rsi14.toFixed(2)),
    macd: parseFloat(_macd.macd.toFixed(4)),
    macdSignal: parseFloat(_macd.signal.toFixed(4)),
    macdHistogram: parseFloat(_macd.histogram.toFixed(4)),
    stochK: parseFloat(_stoch.k.toFixed(2)),
    stochD: parseFloat(_stoch.d.toFixed(2)),
    williamsR: parseFloat(_williamsR.toFixed(2)),
    cci14: parseFloat(_cci14.toFixed(2)),
    bbUpper: parseFloat(_bb.upper.toFixed(2)),
    bbMiddle: parseFloat(_bb.middle.toFixed(2)),
    bbLower: parseFloat(_bb.lower.toFixed(2)),
    atr14: parseFloat(_atr14.toFixed(2)),
    obv: parseFloat(_obv.toFixed(0)),
    overallSignal: overall,
    signalScore: score,
    signals,
    dataSufficiency,
  };
}
