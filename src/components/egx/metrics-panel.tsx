'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  TrendingUp,
  ShieldAlert,
  PieChart as PieIcon,
  Activity,
  Gauge,
} from 'lucide-react';

interface MetricsData {
  ticker: string;
  name: string;
  currentPrice: number;
  metrics: {
    wacc: number;
    costOfEquity: number;
    costOfDebt: number;
    debtToValue: number;
    equityToValue: number;
    roe: number;
    roa: number;
    roic: number;
    roicDescription: string;
    epsGrowth: number;
    revenueCAGR: number;
    netIncomeCAGR: number;
    debtToEquity: number;
    debtToAssets: number;
    interestCoverage: number;
    equityMultiplier: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    ebitdaMargin: number;
    assetTurnover: number;
    currentRatio: number;
    quickRatio: number;
    peRatio: number;
    pbRatio: number;
    evEbitda: number;
    priceToFCF: number;
    dividendPayoutRatio: number;
    fcffYield: number;
    fcfeYield: number;
    earningsQuality: number;
    riskFreeRate: number;
    marketRiskPremium: number;
    beta: number;
  };
}

interface MetricsPanelProps {
  ticker: string;
}

function GaugeBar({
  value,
  max,
  label,
  format,
  colorThresholds,
}: {
  value: number;
  max: number;
  label: string;
  format: 'pct' | 'x' | 'ratio';
  colorThresholds?: { green: [number, number]; amber: [number, number]; red: [number, number] };
}) {
  const pct = Math.min(Math.abs(value) / max, 1) * 100;
  let color = '#06b6d4';
  if (colorThresholds) {
    if (value >= colorThresholds.green[0] && value <= colorThresholds.green[1])
      color = '#10b981';
    else if (
      value >= colorThresholds.amber[0] &&
      value <= colorThresholds.amber[1]
    )
      color = '#f59e0b';
    else color = '#ef4444';
  }

  return (
    <div className='flex items-center gap-3'>
      <span className='text-xs text-slate-400 w-32 shrink-0'>{label}</span>
      <div className='flex-1 h-2 rounded-full bg-slate-800 overflow-hidden'>
        <div
          className='h-full rounded-full transition-all duration-500'
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className='mono-num text-xs text-slate-200 w-16 text-right'>
        {format === 'pct'
          ? `${(value * 100).toFixed(1)}%`
          : format === 'x'
          ? `${value.toFixed(2)}x`
          : value.toFixed(2)}
      </span>
    </div>
  );
}

function ScoreRing({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  let color = '#ef4444';
  if (score >= 70) color = '#10b981';
  else if (score >= 40) color = '#f59e0b';

  return (
    <div className='flex flex-col items-center'>
      <svg width='72' height='72' className='-rotate-90'>
        <circle
          cx='36'
          cy='36'
          r={radius}
          fill='none'
          stroke='#1e293b'
          strokeWidth='6'
        />
        <circle
          cx='36'
          cy='36'
          r={radius}
          fill='none'
          stroke={color}
          strokeWidth='6'
          strokeLinecap='round'
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className='transition-all duration-1000'
        />
      </svg>
      <div className='absolute flex flex-col items-center justify-center' style={{ marginTop: '-56px' }}>
        <span className='mono-num text-sm font-bold text-white'>
          {score.toFixed(0)}
        </span>
      </div>
      <span className='text-[10px] text-slate-500 mt-1'>{label}</span>
    </div>
  );
}

function MarginTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; fill: string } }> }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className='rounded-lg border p-2 text-xs shadow-xl' style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <span className='text-slate-200'>{d.name} Margin: </span>
        <span className='mono-num font-medium' style={{ color: d.fill }}>
          {d.value.toFixed(1)}%
        </span>
      </div>
    );
  }
  return null;
}

export default function MetricsPanel({ ticker }: MetricsPanelProps) {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/metrics/${ticker}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [ticker]);

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-24 bg-slate-800 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-64 bg-slate-800 rounded-xl' />
      </div>
    );
  }

  if (!data) return null;

  const m = data.metrics;

  // Margin analysis chart data
  const marginData = [
    { name: 'Gross', value: m.grossMargin * 100, fill: '#06b6d4' },
    { name: 'Operating', value: m.operatingMargin * 100, fill: '#10b981' },
    { name: 'EBITDA', value: m.ebitdaMargin * 100, fill: '#8b5cf6' },
    { name: 'Net', value: m.netMargin * 100, fill: '#f59e0b' },
  ];

  // Profitability chart data
  const profitabilityData = [
    { name: 'ROE', value: m.roe * 100, fill: '#06b6d4' },
    { name: 'ROA', value: m.roa * 100, fill: '#10b981' },
    { name: 'ROIC', value: m.roic * 100, fill: '#8b5cf6' },
  ];

  // Financial health score calculation
  const healthScore = Math.min(
    100,
    Math.max(
      0,
      (m.currentRatio > 1.5 ? 20 : m.currentRatio > 1 ? 10 : 0) +
        (m.debtToEquity < 0.5 ? 20 : m.debtToEquity < 1 ? 10 : 0) +
        (m.interestCoverage > 5 ? 20 : m.interestCoverage > 2 ? 10 : 0) +
        (m.roe > 0.15 ? 15 : m.roe > 0.08 ? 8 : 0) +
        (m.earningsQuality > 1 ? 15 : m.earningsQuality > 0.7 ? 8 : 0) +
        (m.netMargin > 0.15 ? 10 : m.netMargin > 0.05 ? 5 : 0)
    )
  );

  return (
    <div className='space-y-4'>
      {/* ─── Cost of Capital ────────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <DollarSign className='w-4 h-4 text-cyan-400' />
            Cost of Capital
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div
              className='rounded-lg p-4 text-center border'
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <div className='text-xs text-slate-500 mb-1'>WACC</div>
              <div className='mono-num text-2xl font-bold text-cyan-400'>
                {(m.wacc * 100).toFixed(2)}%
              </div>
              <div className='text-[10px] text-slate-500 mt-1'>
                Equity {(m.equityToValue * 100).toFixed(0)}% / Debt{' '}
                {(m.debtToValue * 100).toFixed(0)}%
              </div>
            </div>
            <div
              className='rounded-lg p-4 text-center border'
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <div className='text-xs text-slate-500 mb-1'>
                Cost of Equity (CAPM)
              </div>
              <div className='mono-num text-2xl font-bold text-emerald-400'>
                {(m.costOfEquity * 100).toFixed(2)}%
              </div>
              <div className='text-[10px] text-slate-500 mt-1'>
                Rf {(m.riskFreeRate * 100).toFixed(1)}% + β{m.beta.toFixed(2)} ×
                MRP {(m.marketRiskPremium * 100).toFixed(1)}%
              </div>
            </div>
            <div
              className='rounded-lg p-4 text-center border'
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <div className='text-xs text-slate-500 mb-1'>Cost of Debt</div>
              <div className='mono-num text-2xl font-bold text-amber-400'>
                {(m.costOfDebt * 100).toFixed(2)}%
              </div>
              <div className='text-[10px] text-slate-500 mt-1'>Pre-tax</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Profitability + Growth ─────────────────────── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Profitability */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <TrendingUp className='w-4 h-4 text-emerald-400' />
              Profitability
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='h-48'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={profitabilityData} margin={{ left: 0, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' />
                  <XAxis dataKey='name' tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                  />
                  <Tooltip content={<MarginTooltip />} />
                  <ReferenceLine y={0} stroke='#475569' />
                  <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {profitabilityData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className='mt-2 px-3 py-2 rounded-lg text-xs'
              style={{ backgroundColor: '#0f172a' }}
            >
              <span className='text-slate-400'>ROIC Assessment: </span>
              <span
                className={
                  m.roic > m.costOfEquity
                    ? 'text-emerald-400'
                    : m.roic > m.wacc
                    ? 'text-amber-400'
                    : 'text-red-400'
                }
              >
                {m.roicDescription}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Growth */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <Activity className='w-4 h-4 text-amber-400' />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='space-y-4 mt-2'>
              <GaugeBar
                value={m.epsGrowth}
                max={1}
                label='EPS Growth'
                format='pct'
                colorThresholds={{
                  green: [0.05, 1],
                  amber: [0, 0.05],
                  red: [-1, 0],
                }}
              />
              <GaugeBar
                value={m.revenueCAGR}
                max={0.5}
                label='Revenue CAGR'
                format='pct'
                colorThresholds={{
                  green: [0.05, 0.5],
                  amber: [0, 0.05],
                  red: [-0.5, 0],
                }}
              />
              <GaugeBar
                value={m.netIncomeCAGR}
                max={0.5}
                label='Net Income CAGR'
                format='pct'
                colorThresholds={{
                  green: [0.05, 0.5],
                  amber: [0, 0.05],
                  red: [-0.5, 0],
                }}
              />
            </div>

            {/* FCF Yields */}
            <div className='grid grid-cols-2 gap-3 mt-4'>
              <div
                className='rounded-lg p-3 text-center border'
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
              >
                <div className='text-[10px] text-slate-500'>FCFF Yield</div>
                <div className='mono-num text-sm font-bold text-cyan-400'>
                  {(m.fcffYield * 100).toFixed(1)}%
                </div>
              </div>
              <div
                className='rounded-lg p-3 text-center border'
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
              >
                <div className='text-[10px] text-slate-500'>FCFE Yield</div>
                <div className='mono-num text-sm font-bold text-emerald-400'>
                  {(m.fcfeYield * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Debt Analysis + Margins ────────────────────── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Debt Analysis */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <ShieldAlert className='w-4 h-4 text-red-400' />
              Debt & Leverage
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='space-y-3'>
              <GaugeBar
                value={m.debtToEquity}
                max={3}
                label='Debt/Equity'
                format='x'
                colorThresholds={{
                  green: [0, 0.5],
                  amber: [0.5, 1.5],
                  red: [1.5, 3],
                }}
              />
              <GaugeBar
                value={m.debtToAssets}
                max={1}
                label='Debt/Assets'
                format='pct'
                colorThresholds={{
                  green: [0, 0.3],
                  amber: [0.3, 0.6],
                  red: [0.6, 1],
                }}
              />
              <GaugeBar
                value={m.interestCoverage}
                max={15}
                label='Interest Coverage'
                format='x'
                colorThresholds={{
                  red: [0, 1.5],
                  amber: [1.5, 3],
                  green: [3, 15],
                }}
              />
              <GaugeBar
                value={m.currentRatio}
                max={3}
                label='Current Ratio'
                format='x'
                colorThresholds={{
                  red: [0, 1],
                  amber: [1, 1.5],
                  green: [1.5, 3],
                }}
              />
              <GaugeBar
                value={m.quickRatio}
                max={3}
                label='Quick Ratio'
                format='x'
                colorThresholds={{
                  red: [0, 0.8],
                  amber: [0.8, 1.2],
                  green: [1.2, 3],
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Margin Analysis */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <PieIcon className='w-4 h-4 text-purple-400' />
              Margin Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='h-52'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={marginData} margin={{ left: 0, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' />
                  <XAxis dataKey='name' tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                  />
                  <Tooltip content={<MarginTooltip />} />
                  <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {marginData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className='grid grid-cols-2 gap-2 mt-3'>
              <div
                className='rounded-lg p-2 text-center border'
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
              >
                <div className='text-[10px] text-slate-500'>
                  Earnings Quality
                </div>
                <div className='mono-num text-sm font-bold text-cyan-400'>
                  {m.earningsQuality.toFixed(2)}x
                </div>
                <div className='text-[10px] text-slate-500'>CFO/Net Income</div>
              </div>
              <div
                className='rounded-lg p-2 text-center border'
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
              >
                <div className='text-[10px] text-slate-500'>Asset Turnover</div>
                <div className='mono-num text-sm font-bold text-emerald-400'>
                  {m.assetTurnover.toFixed(2)}x
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Financial Health Score ─────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Gauge className='w-4 h-4 text-cyan-400' />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='flex items-center justify-center gap-8 py-4'>
            <div className='relative'>
              <ScoreRing score={healthScore} label='Overall' />
            </div>
            <div className='space-y-2'>
              {[
                {
                  label: 'Liquidity',
                  score: Math.min(
                    100,
                    m.currentRatio > 1.5
                      ? 90
                      : m.currentRatio > 1
                      ? 60
                      : 20
                  ),
                },
                {
                  label: 'Leverage',
                  score: Math.min(
                    100,
                    m.debtToEquity < 0.5
                      ? 90
                      : m.debtToEquity < 1
                      ? 60
                      : 20
                  ),
                },
                {
                  label: 'Profitability',
                  score: Math.min(
                    100,
                    m.roe > 0.15 ? 90 : m.roe > 0.08 ? 60 : 20
                  ),
                },
                {
                  label: 'Coverage',
                  score: Math.min(
                    100,
                    m.interestCoverage > 5
                      ? 90
                      : m.interestCoverage > 2
                      ? 60
                      : 20
                  ),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className='flex items-center gap-3 text-xs'
                >
                  <span className='text-slate-400 w-20'>{item.label}</span>
                  <div className='w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden'>
                    <div
                      className='h-full rounded-full'
                      style={{
                        width: `${item.score}%`,
                        backgroundColor:
                          item.score >= 70
                            ? '#10b981'
                            : item.score >= 40
                            ? '#f59e0b'
                            : '#ef4444',
                      }}
                    />
                  </div>
                  <span className='mono-num text-slate-300'>
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
