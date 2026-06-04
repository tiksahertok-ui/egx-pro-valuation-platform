'use client';

import React, { useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { formatPrice, formatPercent } from '@/app/page';
import LegalDisclaimer from './legal-disclaimer';
import { EGYPT_MARKET_PARAMS } from '@/lib/valuation/egyptMarketParams';
import { validateTerminalGrowthRate, CurrencyConvention } from '@/lib/valuation/wacc';
import { getWeightsForSector } from '@/lib/valuation/sectorWeights';

interface ValuationData {
  ticker: string;
  name: string;
  currentPrice: number;
  valuations: Array<{
    model: string;
    fairValue: number;
    bearCase: number;
    baseCase: number;
    bullCase: number;
    upside: number;
    confidence: number;
    assumptions: string;
  }>;
  weightedFairValue?: {
    fairValue: number;
    upside: number;
  };
}

interface ValuationPanelProps {
  ticker: string;
  currentPrice: number;
  sector?: string;
}

function ValuationTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; fairValue: number; bearCase: number; bullCase: number } }> }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className='rounded-lg border p-3 text-xs shadow-xl' style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <p className='font-semibold text-slate-200 mb-1'>{d.fullName}</p>
        <p className='text-cyan-400'>Fair Value: EGP {d.fairValue.toFixed(2)}</p>
        <p className='text-red-400'>Bear: EGP {d.bearCase.toFixed(2)}</p>
        <p className='text-emerald-400'>Bull: EGP {d.bullCase.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export default function ValuationPanel({
  ticker,
  currentPrice,
  sector,
}: ValuationPanelProps) {
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencyConvention, setCurrencyConvention] = useState<CurrencyConvention>('EGP_NOMINAL');

  useEffect(() => {
    const fetchValuation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/valuation/${ticker}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch valuation:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchValuation();
  }, [ticker]);

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-40 bg-slate-800 rounded-xl' />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Skeleton className='h-64 bg-slate-800 rounded-xl' />
          <Skeleton className='h-64 bg-slate-800 rounded-xl' />
        </div>
      </div>
    );
  }

  if (!data || !data.valuations.length) {
    return (
      <div
        className='rounded-xl border p-8 text-center'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <AlertTriangle className='w-8 h-8 text-amber-400 mx-auto mb-2' />
        <p className='text-slate-400'>No valuation data available</p>
      </div>
    );
  }

  const composite = data.valuations.find(
    (v) => v.model === 'Composite (Weighted)'
  );
  const weightedFV =
    data.weightedFairValue?.fairValue ?? composite?.fairValue ?? currentPrice;
  const weightedUpside =
    data.weightedFairValue?.upside ??
    composite?.upside ??
    ((weightedFV - currentPrice) / currentPrice) * 100;

  // Radar chart data - normalized scores per model
  const radarData = data.valuations
    .filter((v) => v.model !== 'Composite (Weighted)')
    .map((v) => ({
      model:
        v.model.length > 12 ? v.model.slice(0, 12) + '…' : v.model,
      fairValue: Math.max(0, (v.fairValue / currentPrice) * 100),
      confidence: v.confidence * 100,
      upside: Math.min(100, Math.max(0, 50 + v.upside)),
    }));

  // Scenario analysis
  const scenarios = [
    {
      name: 'Bear Case',
      value: composite?.bearCase ?? 0,
      color: '#ef4444',
      icon: TrendingDown,
      assumptions: 'Pessimistic macro, lower growth, higher risk',
    },
    {
      name: 'Base Case',
      value: composite?.baseCase ?? 0,
      color: '#f59e0b',
      icon: Target,
      assumptions: 'Moderate growth, stable conditions',
    },
    {
      name: 'Bull Case',
      value: composite?.bullCase ?? 0,
      color: '#10b981',
      icon: TrendingUp,
      assumptions: 'Optimistic growth, favorable macro',
    },
  ];

  // Model comparison bar chart data
  const modelComparison = data.valuations.map((v) => ({
    name: v.model.length > 15 ? v.model.slice(0, 15) + '…' : v.model,
    fullName: v.model,
    fairValue: v.fairValue,
    bearCase: v.bearCase,
    bullCase: v.bullCase,
  }));

  // Terminal growth rate validation
  const terminalGrowthRate = 0.03; // typical 3% terminal growth assumption
  const waccEstimate = 0.15; // approximate WACC for EGX stocks
  const growthValidation = validateTerminalGrowthRate(terminalGrowthRate, waccEstimate, currencyConvention);

  // Sector-specific model weights
  const sectorWeights = getWeightsForSector(sector || 'Default');
  const sectorLabel = sector || 'Default';

  // Currency convention options
  const conventionOptions: { value: CurrencyConvention; label: string }[] = [
    { value: 'EGP_NOMINAL', label: 'EGP Nominal' },
    { value: 'EGP_REAL', label: 'EGP Real' },
    { value: 'USD_REAL', label: 'USD Real' },
  ];

  return (
    <div className='space-y-4'>
      {/* ─── Legal Disclaimer (inline) ──────────────────── */}
      <LegalDisclaimer variant='inline' />

      {/* ─── Currency Convention Selector ───────────────── */}
      <div
        className='rounded-xl border p-4'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Shield className='w-4 h-4 text-cyan-400' />
            <span className='text-xs font-semibold text-slate-300'>Currency Convention</span>
          </div>
          <select
            value={currencyConvention}
            onChange={(e) => setCurrencyConvention(e.target.value as CurrencyConvention)}
            className='h-8 rounded-md border px-3 text-xs bg-slate-800 border-slate-700 text-slate-200 focus:border-cyan-500 focus:outline-none'
          >
            {conventionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Terminal Growth Rate Warning ──────────────── */}
      {growthValidation.warning && (
        <div
          className='rounded-xl border p-3 flex items-start gap-2'
          style={{ backgroundColor: '#1a1206', borderColor: growthValidation.valid ? '#854d0e' : '#ef4444' }}
        >
          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${growthValidation.valid ? 'text-amber-400' : 'text-red-400'}`} />
          <div>
            <span className={`text-xs font-semibold ${growthValidation.valid ? 'text-amber-300' : 'text-red-300'}`}>
              Terminal Growth Rate Warning
            </span>
            <p className={`text-[11px] mt-0.5 ${growthValidation.valid ? 'text-amber-200' : 'text-red-200'}`}>
              {growthValidation.warning}
            </p>
          </div>
        </div>
      )}

      {/* ─── Sector Model Weights ──────────────────────── */}
      <div
        className='rounded-xl border p-4'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <div className='flex items-center gap-2 mb-3'>
          <Zap className='w-4 h-4 text-cyan-400' />
          <span className='text-xs font-semibold text-slate-300'>Model Weights — {sectorLabel} Sector</span>
        </div>
        <div className='grid grid-cols-4 sm:grid-cols-8 gap-2'>
          {Object.entries(sectorWeights).map(([model, weight]) => (
            <div key={model} className='text-center'>
              <div className='text-[9px] text-slate-500 mb-1'>{model}</div>
              <div className='w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-1'>
                <div
                  className='h-full rounded-full bg-cyan-500/60'
                  style={{ width: `${weight * 100}%` }}
                />
              </div>
              <div className='mono-num text-[10px] text-slate-300'>{(weight * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Fair Value Summary ─────────────────────────── */}
      <div
        className='rounded-xl border p-6 egx-glow'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='text-center md:text-left'>
            <div className='text-xs text-slate-500 mb-1'>
              Weighted Average Fair Value
            </div>
            <div className='mono-num text-4xl font-bold text-cyan-400'>
              {formatPrice(weightedFV)}
            </div>
          </div>
          <div className='flex items-center gap-6'>
            <div className='text-center'>
              <div className='text-xs text-slate-500 mb-1'>Current Price</div>
              <div className='mono-num text-2xl font-semibold text-white'>
                {formatPrice(currentPrice)}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-xs text-slate-500 mb-1'>Upside</div>
              <div
                className={`mono-num text-2xl font-bold ${
                  weightedUpside >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatPercent(weightedUpside)}
              </div>
            </div>
          </div>
        </div>

        {/* Valuation Range Bar */}
        {composite && (
          <div className='mt-6'>
            <div className='flex items-center justify-between text-xs text-slate-500 mb-2'>
              <span className='mono-num text-red-400'>
                Bear: {formatPrice(composite.bearCase)}
              </span>
              <span className='mono-num text-amber-400'>
                Base: {formatPrice(composite.baseCase)}
              </span>
              <span className='mono-num text-emerald-400'>
                Bull: {formatPrice(composite.bullCase)}
              </span>
            </div>
            <div className='relative h-8 rounded-lg overflow-hidden'>
              {/* Range bar */}
              <div className='absolute inset-0 flex'>
                <div
                  className='bg-red-500/30 h-full'
                  style={{
                    width: `${((composite.baseCase - composite.bearCase) / (composite.bullCase - composite.bearCase)) * 100}%`,
                  }}
                />
                <div
                  className='bg-amber-500/30 h-full'
                  style={{
                    width: `${((composite.bullCase - composite.baseCase) / (composite.bullCase - composite.bearCase)) * 100}%`,
                  }}
                />
              </div>
              {/* Current price marker */}
              {composite.bullCase > composite.bearCase && (
                <div
                  className='absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10'
                  style={{
                    left: `${((currentPrice - composite.bearCase) / (composite.bullCase - composite.bearCase)) * 100}%`,
                  }}
                >
                  <div className='absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] mono-num text-cyan-400 whitespace-nowrap'>
                    Current
                  </div>
                </div>
              )}
              {/* Fair value marker */}
              {composite.bullCase > composite.bearCase && (
                <div
                  className='absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-10 border-dashed'
                  style={{
                    left: `${((composite.fairValue - composite.bearCase) / (composite.bullCase - composite.bearCase)) * 100}%`,
                  }}
                >
                  <div className='absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] mono-num text-emerald-400 whitespace-nowrap'>
                    Fair Value
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Scenario Analysis ──────────────────────────── */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <Card
              key={scenario.name}
              className='egx-card-glow'
              style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
            >
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Icon className='w-4 h-4' style={{ color: scenario.color }} />
                  <span className='text-sm font-semibold text-slate-300'>
                    {scenario.name}
                  </span>
                </div>
                <div
                  className='mono-num text-2xl font-bold'
                  style={{ color: scenario.color }}
                >
                  {formatPrice(scenario.value)}
                </div>
                <div className='mono-num text-xs text-slate-400 mt-1'>
                  {formatPercent(
                    ((scenario.value - currentPrice) / currentPrice) * 100
                  )}{' '}
                  vs current
                </div>
                <div className='text-[10px] text-slate-500 mt-2'>
                  {scenario.assumptions}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Model Comparison Chart + Radar ─────────────── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Bar Chart */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300'>
              Fair Value by Model
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={modelComparison}
                  margin={{ left: 5, right: 20, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' />
                  <XAxis
                    dataKey='name'
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    angle={-30}
                    textAnchor='end'
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => `${v.toFixed(0)}`}
                  />
                  <Tooltip content={<ValuationTooltip />} />
                  <ReferenceLine
                    y={currentPrice}
                    stroke='#06b6d4'
                    strokeDasharray='5 5'
                    label={{
                      value: `Current: ${currentPrice.toFixed(0)}`,
                      fill: '#06b6d4',
                      fontSize: 10,
                    }}
                  />
                  <Bar dataKey='fairValue' radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {modelComparison.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.fairValue >= currentPrice
                            ? '#10b981'
                            : '#ef4444'
                        }
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart - Valuation Snowflake */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <Zap className='w-4 h-4 text-cyan-400' />
              Valuation Snowflake
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <RadarChart data={radarData}>
                  <PolarGrid stroke='#1e293b' />
                  <PolarAngleAxis
                    dataKey='model'
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 150]}
                    tick={{ fill: '#475569', fontSize: 8 }}
                  />
                  <Radar
                    name='Fair Value (% of Price)'
                    dataKey='fairValue'
                    stroke='#06b6d4'
                    fill='#06b6d4'
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name='Confidence'
                    dataKey='confidence'
                    stroke='#10b981'
                    fill='#10b981'
                    fillOpacity={0.1}
                    strokeWidth={1}
                    strokeDasharray='5 5'
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Model Comparison Table ─────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Shield className='w-4 h-4 text-cyan-400' />
            Model Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead>
                <tr
                  className='border-b'
                  style={{ borderColor: '#1e293b' }}
                >
                  <th className='text-left py-2 px-2 text-slate-500 font-medium'>
                    Model
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    Fair Value
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    Bear
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    Base
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    Bull
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    Upside
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.valuations.map((v) => (
                  <tr
                    key={v.model}
                    className='border-b'
                    style={{ borderColor: '#1e293b30' }}
                  >
                    <td className='py-2 px-2 text-slate-300 font-medium'>
                      {v.model}
                      {v.model === 'Composite (Weighted)' && (
                        <Badge className='ml-2 text-[9px] h-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30'>
                          PRIMARY
                        </Badge>
                      )}
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-white'>
                      {v.fairValue.toFixed(2)}
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-red-400'>
                      {v.bearCase.toFixed(2)}
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-amber-400'>
                      {v.baseCase.toFixed(2)}
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-emerald-400'>
                      {v.bullCase.toFixed(2)}
                    </td>
                    <td className='py-2 px-2 text-right'>
                      <span
                        className={`mono-num ${
                          v.upside >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {formatPercent(v.upside)}
                      </span>
                    </td>
                    <td className='py-2 px-2 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <div className='w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden'>
                          <div
                            className='h-full rounded-full'
                            style={{
                              width: `${v.confidence * 100}%`,
                              backgroundColor:
                                v.confidence > 0.7
                                  ? '#10b981'
                                  : v.confidence > 0.4
                                  ? '#f59e0b'
                                  : '#ef4444',
                            }}
                          />
                        </div>
                        <span className='mono-num text-slate-400'>
                          {(v.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
