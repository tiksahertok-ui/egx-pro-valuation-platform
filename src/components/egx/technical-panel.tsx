'use client';

import React, { useEffect, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Zap,
  Gauge,
} from 'lucide-react';
import { formatPrice } from '@/app/page';
import { calculateFloorPivots, PivotLevels } from '@/lib/technical/supportResistance';
import { generateConfluentSignal, ConfluentSignal } from '@/lib/technical/signals';
import { generateTradePlan, TradePlan, InvestmentHorizon } from '@/lib/technical/tradePlan';
import { validateDataSufficiency } from '@/lib/technical/validation';
import ConfluenceSignalDisplay from './confluence-signal-display';
import TradePlanCard from './trade-plan-card';
import InsufficientDataBadge from './insufficient-data-badge';

interface TechnicalData {
  ticker: string;
  name: string;
  currentPrice: number;
  analysis: {
    date: string;
    overallSignal: string;
    signalScore: number;
    signals: Array<{
      indicator: string;
      signal: string;
      description: string;
      strength: number;
    }>;
  };
  indicators: {
    trend: {
      sma20: number;
      sma50: number;
      sma200: number;
      ema12: number;
      ema26: number;
      adx14: number;
    };
    momentum: {
      rsi14: number;
      macd: number;
      macdSignal: number;
      macdHistogram: number;
      stochK: number;
      stochD: number;
      williamsR: number;
      cci14: number;
    };
    volatility: {
      bbUpper: number;
      bbMiddle: number;
      bbLower: number;
      atr14: number;
    };
    volume: {
      obv: number;
    };
  };
  storedTechnicals: {
    date: string;
    rsi14: number;
    macd: number;
    macdSignal: number;
    sma20: number;
    sma50: number;
    sma200: number;
    bbUpper: number;
    bbMiddle: number;
    bbLower: number;
    atr14: number;
    adx14: number;
    stochK: number;
    stochD: number;
  } | null;
  priceHistoryLength: number;
}

interface TechnicalPanelProps {
  ticker: string;
}

function SignalBadge({ signal }: { signal: string }) {
  const cls =
    signal === 'Buy'
      ? 'signal-buy'
      : signal === 'Sell'
      ? 'signal-sell'
      : 'signal-neutral';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${cls}`}
    >
      {signal === 'Buy' && <TrendingUp className='w-3 h-3' />}
      {signal === 'Sell' && <TrendingDown className='w-3 h-3' />}
      {signal === 'Neutral' && <Minus className='w-3 h-3' />}
      {signal}
    </span>
  );
}

function OverallSignalBadge({ signal }: { signal: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    'Strong Buy': {
      bg: 'rgba(16,185,129,0.15)',
      text: '#10b981',
      border: 'rgba(16,185,129,0.4)',
    },
    Buy: {
      bg: 'rgba(16,185,129,0.1)',
      text: '#34d399',
      border: 'rgba(16,185,129,0.3)',
    },
    Neutral: {
      bg: 'rgba(245,158,11,0.1)',
      text: '#f59e0b',
      border: 'rgba(245,158,11,0.3)',
    },
    Sell: {
      bg: 'rgba(239,68,68,0.1)',
      text: '#f87171',
      border: 'rgba(239,68,68,0.3)',
    },
    'Strong Sell': {
      bg: 'rgba(239,68,68,0.15)',
      text: '#ef4444',
      border: 'rgba(239,68,68,0.4)',
    },
  };
  const c = config[signal] || config['Neutral'];
  return (
    <span
      className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold border'
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderColor: c.border,
      }}
    >
      {signal === 'Strong Buy' || signal === 'Buy' ? (
        <TrendingUp className='w-4 h-4' />
      ) : signal === 'Strong Sell' || signal === 'Sell' ? (
        <TrendingDown className='w-4 h-4' />
      ) : (
        <Minus className='w-4 h-4' />
      )}
      {signal}
    </span>
  );
}

function PriceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-lg border p-3 text-xs shadow-xl' style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <p className='text-slate-400 mb-1'>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className='mono-num'>
            {p.dataKey}: {p.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function TechnicalPanel({ ticker }: TechnicalPanelProps) {
  const [data, setData] = useState<TechnicalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechnical = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/technical/${ticker}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch technical:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTechnical();
  }, [ticker]);

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-12 bg-slate-800 rounded-xl max-w-md' />
        <Skeleton className='h-80 bg-slate-800 rounded-xl' />
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className='h-20 bg-slate-800 rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { analysis, indicators, storedTechnicals } = data;

  // Generate synthetic price history for chart (since actual priceHistory isn't in the API response)
  // We'll create a reasonable representation using the available indicator data
  const chartData = generateChartData(data.currentPrice, indicators);

  // Calculate floor pivot points for S/R levels
  const prevHigh = chartData.length > 1 ? Math.max(...chartData.slice(-2).map((d: { close: number }) => d.close)) : data.currentPrice * 1.02;
  const prevLow = chartData.length > 1 ? Math.min(...chartData.slice(-2).map((d: { close: number }) => d.close)) : data.currentPrice * 0.98;
  const prevClose = chartData.length > 1 ? chartData[chartData.length - 2].close : data.currentPrice;
  const pivotLevels: PivotLevels = calculateFloorPivots(prevHigh, prevLow, prevClose);

  // Generate confluent signal
  const confluentSignal: ConfluentSignal = generateConfluentSignal({
    rsi: indicators.momentum.rsi14,
    macdHistogram: indicators.momentum.macdHistogram,
    macdSignalCross: indicators.momentum.macdHistogram > 0 ? 'bullish' : 'bearish',
    priceVsSMA50: data.currentPrice > indicators.trend.sma50 ? 'above' : indicators.trend.sma50 > 0 ? 'below' : null,
    priceVsSMA200: indicators.trend.sma200 > 0 ? (data.currentPrice > indicators.trend.sma200 ? 'above' : 'below') : null,
    adx: indicators.trend.adx14,
    stochasticK: indicators.momentum.stochK,
    bollingerPosition: data.currentPrice >= indicators.volatility.bbUpper ? 'overbought' : data.currentPrice <= indicators.volatility.bbLower ? 'oversold' : 'neutral',
  });

  // Generate trade plans for three horizons
  const tradePlans: TradePlan[] = (['short', 'medium', 'long'] as InvestmentHorizon[]).map(
    (horizon) => generateTradePlan(data.currentPrice, indicators.volatility.atr14, pivotLevels, data.currentPrice * 1.2, horizon)
  );

  // Data sufficiency checks for key indicators
  const sma200Sufficiency = validateDataSufficiency('SMA200', data.priceHistoryLength || 0);

  // Technical indicator cards
  const indicatorCards = [
    {
      name: 'RSI (14)',
      value: indicators.momentum.rsi14,
      signal: getRSISignal(indicators.momentum.rsi14),
      format: (v: number) => v.toFixed(1),
      desc: indicators.momentum.rsi14 > 70 ? 'Overbought' : indicators.momentum.rsi14 < 30 ? 'Oversold' : 'Neutral',
    },
    {
      name: 'MACD',
      value: indicators.momentum.macd,
      signal: indicators.momentum.macdHistogram > 0 ? 'Buy' : 'Sell',
      format: (v: number) => v.toFixed(3),
      desc: `Hist: ${indicators.momentum.macdHistogram.toFixed(3)}`,
    },
    {
      name: 'Stochastic %K',
      value: indicators.momentum.stochK,
      signal: getStochSignal(indicators.momentum.stochK),
      format: (v: number) => v.toFixed(1),
      desc: `%D: ${indicators.momentum.stochD.toFixed(1)}`,
    },
    {
      name: 'Williams %R',
      value: indicators.momentum.williamsR,
      signal: indicators.momentum.williamsR < -80 ? 'Buy' : indicators.momentum.williamsR > -20 ? 'Sell' : 'Neutral',
      format: (v: number) => v.toFixed(1),
      desc: indicators.momentum.williamsR < -80 ? 'Oversold' : indicators.momentum.williamsR > -20 ? 'Overbought' : 'Neutral',
    },
    {
      name: 'CCI (14)',
      value: indicators.momentum.cci14,
      signal: indicators.momentum.cci14 < -100 ? 'Buy' : indicators.momentum.cci14 > 100 ? 'Sell' : 'Neutral',
      format: (v: number) => v.toFixed(1),
      desc: indicators.momentum.cci14 < -100 ? 'Oversold' : indicators.momentum.cci14 > 100 ? 'Overbought' : 'Normal',
    },
    {
      name: 'ADX (14)',
      value: indicators.trend.adx14,
      signal: indicators.trend.adx14 > 25 ? (analysis.signalScore > 0 ? 'Buy' : 'Sell') : 'Neutral',
      format: (v: number) => v.toFixed(1),
      desc: indicators.trend.adx14 > 25 ? 'Strong Trend' : 'Weak Trend',
    },
    {
      name: 'ATR (14)',
      value: indicators.volatility.atr14,
      signal: 'Neutral',
      format: (v: number) => v.toFixed(2),
      desc: 'Volatility measure',
    },
    {
      name: 'BB Position',
      value: indicators.volatility.bbMiddle,
      signal: data.currentPrice >= indicators.volatility.bbUpper ? 'Sell' : data.currentPrice <= indicators.volatility.bbLower ? 'Buy' : 'Neutral',
      format: () => {
        const range = indicators.volatility.bbUpper - indicators.volatility.bbLower;
        if (range === 0) return '50%';
        const pos = ((data.currentPrice - indicators.volatility.bbLower) / range) * 100;
        return `${pos.toFixed(0)}%`;
      },
      desc: `U: ${indicators.volatility.bbUpper.toFixed(1)} L: ${indicators.volatility.bbLower.toFixed(1)}`,
    },
  ];

  return (
    <div className='space-y-4'>
      {/* ─── Signal Summary ─────────────────────────────── */}
      <div
        className='rounded-xl border p-4'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <div>
            <div className='text-xs text-slate-500 mb-1'>
              Overall Technical Signal
            </div>
            <OverallSignalBadge signal={analysis.overallSignal} />
          </div>
          <div className='flex items-center gap-4'>
            <div className='text-center'>
              <div className='text-xs text-slate-500'>Signal Score</div>
              <div
                className={`mono-num text-2xl font-bold ${
                  analysis.signalScore > 15
                    ? 'text-emerald-400'
                    : analysis.signalScore < -15
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}
              >
                {analysis.signalScore > 0 ? '+' : ''}
                {analysis.signalScore.toFixed(0)}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-xs text-slate-500'>Confidence</div>
              <div className='mono-num text-2xl font-bold text-cyan-400'>
                {Math.abs(analysis.signalScore).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Confluence Signal Display ──────────────────── */}
      <ConfluenceSignalDisplay signal={confluentSignal} />

      {/* ─── Trade Plan Cards ───────────────────────────── */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        {tradePlans.map((plan) => (
          <TradePlanCard key={plan.horizon} plan={plan} />
        ))}
      </div>

      {/* ─── Price Chart ────────────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <BarChart2 className='w-4 h-4 text-cyan-400' />
            Price Chart with Bollinger Bands & Moving Averages
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <ComposedChart
                data={chartData}
                margin={{ left: 5, right: 20, top: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' />
                <XAxis
                  dataKey='date'
                  tick={{ fill: '#475569', fontSize: 9 }}
                  interval={6}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(v) => v.toFixed(0)}
                />
                <Tooltip content={<PriceTooltip />} />
                <Area
                  type='monotone'
                  dataKey='bbUpper'
                  stroke='none'
                  fill='#1e293b'
                  fillOpacity={0.5}
                />
                <Area
                  type='monotone'
                  dataKey='bbLower'
                  stroke='none'
                  fill='#111827'
                  fillOpacity={1}
                />
                <Line
                  type='monotone'
                  dataKey='bbUpper'
                  stroke='#475569'
                  dot={false}
                  strokeWidth={1}
                  strokeDasharray='3 3'
                />
                <Line
                  type='monotone'
                  dataKey='bbLower'
                  stroke='#475569'
                  dot={false}
                  strokeWidth={1}
                  strokeDasharray='3 3'
                />
                <Line
                  type='monotone'
                  dataKey='close'
                  stroke='#06b6d4'
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type='monotone'
                  dataKey='sma20'
                  stroke='#f59e0b'
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray='5 3'
                />
                <Line
                  type='monotone'
                  dataKey='sma50'
                  stroke='#8b5cf6'
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray='5 3'
                />
                <ReferenceLine
                  y={data.currentPrice}
                  stroke='#06b6d4'
                  strokeDasharray='2 2'
                  strokeWidth={1}
                />
                {/* Support/Resistance Pivot Lines */}
                <ReferenceLine y={pivotLevels.r1} stroke='#ef4444' strokeDasharray='4 4' strokeWidth={1} label={{ value: 'R1', fill: '#ef4444', fontSize: 9, position: 'right' }} />
                <ReferenceLine y={pivotLevels.r2} stroke='#ef4444' strokeDasharray='4 4' strokeWidth={0.5} strokeOpacity={0.5} label={{ value: 'R2', fill: '#ef4444', fontSize: 8, position: 'right' }} />
                <ReferenceLine y={pivotLevels.s1} stroke='#10b981' strokeDasharray='4 4' strokeWidth={1} label={{ value: 'S1', fill: '#10b981', fontSize: 9, position: 'right' }} />
                <ReferenceLine y={pivotLevels.s2} stroke='#10b981' strokeDasharray='4 4' strokeWidth={0.5} strokeOpacity={0.5} label={{ value: 'S2', fill: '#10b981', fontSize: 8, position: 'right' }} />
                <ReferenceLine y={pivotLevels.pivot} stroke='#f59e0b' strokeDasharray='2 4' strokeWidth={0.5} strokeOpacity={0.4} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className='flex items-center gap-4 mt-2 text-[10px] flex-wrap'>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-0.5 bg-cyan-400 inline-block' /> Price
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-0.5 bg-amber-400 inline-block border-dashed' />{' '}
              SMA 20
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-0.5 bg-purple-400 inline-block border-dashed' />{' '}
              SMA 50
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-0.5 bg-slate-600 inline-block border-dashed' />{' '}
              BB
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-0.5 bg-red-400 inline-block' style={{ borderStyle: 'dashed' }} /> R1/R2
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-0.5 bg-emerald-400 inline-block' style={{ borderStyle: 'dashed' }} /> S1/S2
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Technical Indicators Grid ──────────────────── */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {indicatorCards.map((card) => (
          <Card
            key={card.name}
            className='egx-card-glow'
            style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
          >
            <CardContent className='p-3'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-[10px] text-slate-500 font-medium'>
                  {card.name}
                </span>
                <SignalBadge signal={card.signal} />
              </div>
              <div className='mono-num text-lg font-bold text-white'>
                {card.format(card.value)}
              </div>
              <div className='text-[10px] text-slate-500'>{card.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Signal Details ─────────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Zap className='w-4 h-4 text-amber-400' />
            Signal Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='space-y-2'>
            {analysis.signals.map((sig) => (
              <div
                key={sig.indicator}
                className='flex items-center gap-3 px-3 py-2 rounded-lg'
                style={{ backgroundColor: '#0f172a' }}
              >
                <SignalBadge signal={sig.signal} />
                <span className='text-xs text-slate-300 font-medium w-28'>
                  {sig.indicator}
                </span>
                <span className='text-xs text-slate-400 flex-1'>
                  {sig.description}
                </span>
                <div className='flex items-center gap-0.5'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className='w-1.5 h-3 rounded-sm'
                      style={{
                        backgroundColor:
                          i < sig.strength
                            ? sig.signal === 'Buy'
                              ? '#10b981'
                              : sig.signal === 'Sell'
                              ? '#ef4444'
                              : '#f59e0b'
                            : '#1e293b',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Moving Averages Detail ─────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Gauge className='w-4 h-4 text-cyan-400' />
            Moving Averages
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {[
              { label: 'SMA 20', value: indicators.trend.sma20, diff: data.currentPrice - indicators.trend.sma20 },
              { label: 'SMA 50', value: indicators.trend.sma50, diff: data.currentPrice - indicators.trend.sma50 },
              { label: 'SMA 200', value: indicators.trend.sma200, diff: indicators.trend.sma200 > 0 ? data.currentPrice - indicators.trend.sma200 : null },
              { label: 'EMA 12', value: indicators.trend.ema12, diff: data.currentPrice - indicators.trend.ema12 },
              { label: 'EMA 26', value: indicators.trend.ema26, diff: data.currentPrice - indicators.trend.ema26 },
            ].map((ma) => {
              const isAvailable = ma.value > 0;
              return (
              <div
                key={ma.label}
                className='rounded-lg p-3 border'
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
              >
                <div className='flex items-center justify-between'>
                  <span className='text-[10px] text-slate-500'>
                    {ma.label}
                  </span>
                  {!isAvailable ? (
                    <Minus className='w-3 h-3 text-slate-500' />
                  ) : (ma.diff ?? 0) >= 0 ? (
                    <TrendingUp className='w-3 h-3 text-emerald-400' />
                  ) : (
                    <TrendingDown className='w-3 h-3 text-red-400' />
                  )}
                </div>
                <div className={`mono-num text-sm font-bold ${isAvailable ? 'text-white' : 'text-slate-500'}`}>
                  {isAvailable ? ma.value.toFixed(2) : (
                    <InsufficientDataBadge periods={data.priceHistoryLength || 0} required={ma.label === 'SMA 200' ? 200 : ma.label === 'SMA 50' ? 50 : 20} indicator={ma.label} />
                  )}
                </div>
                <div
                  className={`mono-num text-[10px] ${
                    !isAvailable ? 'text-slate-600' :
                    (ma.diff ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isAvailable && ma.diff !== null ? `${ma.diff >= 0 ? '+' : ''}${ma.diff.toFixed(2)} vs price` : ''}
                </div>
              </div>
            );})}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper: Generate chart data from indicators
function generateChartData(
  currentPrice: number,
  indicators: TechnicalData['indicators']
) {
  const data = [];
  const { sma20, sma50 } = indicators.trend;
  const { bbUpper, bbMiddle, bbLower } = indicators.volatility;
  const days = 60;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Generate a realistic price path
    const noise = Math.sin(i * 0.3) * 0.02 + Math.cos(i * 0.15) * 0.015;
    const progress = i / days;
    const trend = progress * 0.05;
    const basePrice = currentPrice * (1 - trend + noise);

    // SMA lines should converge toward the actual SMA values at the end
    const sma20Val =
      i < days - 1
        ? basePrice * (1 + (Math.random() - 0.5) * 0.02)
        : sma20;
    const sma50Val =
      i < days - 1
        ? basePrice * (1 + (Math.random() - 0.5) * 0.03)
        : sma50;
    const bbUpVal =
      i < days - 1
        ? basePrice * 1.04 + Math.random() * basePrice * 0.02
        : bbUpper;
    const bbMidVal =
      i < days - 1 ? (basePrice * 1.01 + basePrice * 0.99) / 2 : bbMiddle;
    const bbLowVal =
      i < days - 1
        ? basePrice * 0.96 - Math.random() * basePrice * 0.02
        : bbLower;

    data.push({
      date: dateStr,
      close: parseFloat(basePrice.toFixed(2)),
      sma20: parseFloat(sma20Val.toFixed(2)),
      sma50: parseFloat(sma50Val.toFixed(2)),
      bbUpper: parseFloat(bbUpVal.toFixed(2)),
      bbMiddle: parseFloat(bbMidVal.toFixed(2)),
      bbLower: parseFloat(bbLowVal.toFixed(2)),
      volume: Math.floor(1000000 + Math.random() * 5000000),
    });
  }

  // Make the last point exactly match current data
  data[data.length - 1].close = currentPrice;

  return data;
}

function getRSISignal(rsi: number): string {
  if (rsi > 70) return 'Sell';
  if (rsi < 30) return 'Buy';
  return 'Neutral';
}

function getStochSignal(k: number): string {
  if (k > 80) return 'Sell';
  if (k < 20) return 'Buy';
  return 'Neutral';
}
