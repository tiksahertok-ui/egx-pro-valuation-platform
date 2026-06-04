'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  Globe2,
  Percent,
  Building2,
  Wallet,
} from 'lucide-react';

interface EconomicIndicator {
  id: string;
  name: string;
  nameAr: string;
  value: number;
  previousValue: number;
  change: number;
  unit: string;
  source: string;
  date: string;
  formattedValue: string;
  changeDirection: string;
}

interface DerivedMetrics {
  realInterestRate: number | null;
  realInterestRateDescription: string;
  gdpGrowthTrend: string;
  currencyOutlook: string;
}

interface EconomicData {
  indicators: EconomicIndicator[];
  categories: {
    monetary: EconomicIndicator[];
    macro: EconomicIndicator[];
    external: EconomicIndicator[];
    fiscal: EconomicIndicator[];
  };
  derived: DerivedMetrics;
  lastUpdated: string | null;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  monetary: { label: 'Monetary Policy', icon: Landmark, color: '#06b6d4' },
  macro: { label: 'Macroeconomic', icon: Globe2, color: '#10b981' },
  external: { label: 'External Sector', icon: DollarSign, color: '#8b5cf6' },
  fiscal: { label: 'Fiscal Policy', icon: Building2, color: '#f59e0b' },
};

function IndicatorCard({
  indicator,
}: {
  indicator: EconomicIndicator;
}) {
  const isPositive = indicator.changeDirection === 'up';
  const isNegative = indicator.changeDirection === 'down';
  const changePct =
    indicator.previousValue !== 0
      ? ((indicator.value - indicator.previousValue) /
          Math.abs(indicator.previousValue)) *
        100
      : 0;

  // Impact assessment
  let impact = 'Neutral impact on equities';
  let impactColor = '#f59e0b';
  if (indicator.name === 'CBE Policy Rate') {
    impact =
      indicator.changeDirection === 'up'
        ? 'Negative: Higher rates pressure valuations'
        : 'Positive: Lower rates support valuations';
    impactColor = indicator.changeDirection === 'up' ? '#ef4444' : '#10b981';
  } else if (indicator.name === 'Inflation Rate') {
    impact =
      indicator.changeDirection === 'down'
        ? 'Positive: Declining inflation supports real returns'
        : 'Negative: Rising inflation erodes returns';
    impactColor = indicator.changeDirection === 'down' ? '#10b981' : '#ef4444';
  } else if (indicator.name === 'GDP Growth Rate') {
    impact =
      indicator.changeDirection === 'up'
        ? 'Positive: Accelerating growth supports earnings'
        : 'Negative: Decelerating growth pressures earnings';
    impactColor = indicator.changeDirection === 'up' ? '#10b981' : '#ef4444';
  } else if (indicator.name === 'USD/EGP Rate') {
    impact =
      indicator.changeDirection === 'down'
        ? 'Positive: EGP stability attracts foreign inflows'
        : 'Negative: Depreciation pressures foreign outflows';
    impactColor = indicator.changeDirection === 'down' ? '#10b981' : '#ef4444';
  } else if (indicator.name === 'Foreign Reserves') {
    impact =
      indicator.changeDirection === 'up'
        ? 'Positive: Strong reserves support currency'
        : 'Negative: Declining reserves signal vulnerability';
    impactColor = indicator.changeDirection === 'up' ? '#10b981' : '#ef4444';
  } else if (indicator.name === 'Unemployment Rate') {
    impact =
      indicator.changeDirection === 'down'
        ? 'Positive: Lower unemployment signals strength'
        : 'Negative: Rising unemployment signals weakness';
    impactColor = indicator.changeDirection === 'down' ? '#10b981' : '#ef4444';
  }

  return (
    <div
      className='rounded-xl border p-4 egx-card-glow'
      style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
    >
      <div className='flex items-start justify-between mb-2'>
        <div>
          <div className='text-xs font-medium text-slate-300'>
            {indicator.name}
          </div>
          <div className='text-[10px] text-slate-500' dir='rtl'>
            {indicator.nameAr}
          </div>
        </div>
        {isPositive ? (
          <ArrowUpRight className='w-4 h-4 text-emerald-400' />
        ) : isNegative ? (
          <ArrowDownRight className='w-4 h-4 text-red-400' />
        ) : (
          <Minus className='w-4 h-4 text-slate-400' />
        )}
      </div>
      <div className='mono-num text-2xl font-bold text-white mb-1'>
        {indicator.formattedValue || `${indicator.value.toFixed(1)}${indicator.unit === '%' ? '%' : ''}`}
      </div>
      <div className='flex items-center gap-2 mb-2'>
        <span
          className={`mono-num text-xs ${
            isPositive
              ? 'text-emerald-400'
              : isNegative
              ? 'text-red-400'
              : 'text-slate-500'
          }`}
        >
          {indicator.change !== 0
            ? `${indicator.change > 0 ? '+' : ''}${indicator.change.toFixed(2)}`
            : 'Stable'}
        </span>
        {indicator.previousValue !== 0 && (
          <span className='mono-num text-[10px] text-slate-500'>
            (Prev: {indicator.previousValue.toFixed(1)}
            {indicator.unit === '%' ? '%' : ''})
          </span>
        )}
      </div>
      <div
        className='text-[10px] leading-relaxed border-t pt-2'
        style={{ borderColor: '#1e293b', color: impactColor }}
      >
        {impact}
      </div>
    </div>
  );
}

export default function EconomicPanel() {
  const [data, setData] = useState<EconomicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEconomic = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/economic');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch economic data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEconomic();
  }, []);

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-32 bg-slate-800 rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className='space-y-4'>
      {/* ─── Derived Metrics Banner ─────────────────────── */}
      <div
        className='rounded-xl border p-4'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <h3 className='text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2'>
          <Wallet className='w-4 h-4 text-cyan-400' />
          Key Market Insights
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <div
            className='rounded-lg p-3 border'
            style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
          >
            <div className='text-[10px] text-slate-500 mb-1'>
              Real Interest Rate
            </div>
            <div className='mono-num text-lg font-bold text-white'>
              {data.derived.realInterestRate !== null
                ? `${data.derived.realInterestRate.toFixed(1)}%`
                : 'N/A'}
            </div>
            <div
              className='text-[10px]'
              style={{
                color:
                  data.derived.realInterestRate &&
                  data.derived.realInterestRate > 0
                    ? '#10b981'
                    : '#ef4444',
              }}
            >
              {data.derived.realInterestRateDescription}
            </div>
          </div>
          <div
            className='rounded-lg p-3 border'
            style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
          >
            <div className='text-[10px] text-slate-500 mb-1'>
              GDP Growth Trend
            </div>
            <div className='mono-num text-lg font-bold text-white'>
              {data.derived.gdpGrowthTrend}
            </div>
            <div className='text-[10px] text-slate-500'>
              Direction of economic growth
            </div>
          </div>
          <div
            className='rounded-lg p-3 border'
            style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
          >
            <div className='text-[10px] text-slate-500 mb-1'>
              EGP Currency Outlook
            </div>
            <div className='mono-num text-lg font-bold text-white'>
              {data.derived.currencyOutlook}
            </div>
            <div className='text-[10px] text-slate-500'>
              USD/EGP exchange trend
            </div>
          </div>
        </div>
      </div>

      {/* ─── Indicator Categories ───────────────────────── */}
      {Object.entries(categoryConfig).map(([key, config]) => {
        const categoryData = data.categories[key as keyof typeof data.categories];
        if (!categoryData || categoryData.length === 0) return null;
        const Icon = config.icon;

        return (
          <Card key={key} style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
            <CardHeader className='pb-2 pt-4 px-4'>
              <CardTitle
                className='text-sm font-semibold flex items-center gap-2'
                style={{ color: config.color }}
              >
                <Icon className='w-4 h-4' />
                {config.label}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {categoryData.map((indicator) => (
                  <IndicatorCard
                    key={indicator.name}
                    indicator={indicator}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ─── Market Impact Summary ──────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Percent className='w-4 h-4 text-cyan-400' />
            Impact on Stock Market
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='space-y-3'>
            {data.indicators.map((ind) => {
              let impact = 'neutral';
              if (
                ['CBE Policy Rate', 'Inflation Rate', 'Unemployment Rate'].includes(ind.name) &&
                ind.changeDirection === 'down'
              )
                impact = 'positive';
              if (
                ['CBE Policy Rate', 'Inflation Rate', 'Unemployment Rate'].includes(ind.name) &&
                ind.changeDirection === 'up'
              )
                impact = 'negative';
              if (
                ['GDP Growth Rate', 'Foreign Reserves'].includes(ind.name) &&
                ind.changeDirection === 'up'
              )
                impact = 'positive';
              if (
                ['GDP Growth Rate', 'Foreign Reserves'].includes(ind.name) &&
                ind.changeDirection === 'down'
              )
                impact = 'negative';
              if (ind.name === 'USD/EGP Rate' && ind.changeDirection === 'down')
                impact = 'positive';
              if (ind.name === 'USD/EGP Rate' && ind.changeDirection === 'up')
                impact = 'negative';

              return (
                <div
                  key={ind.name}
                  className='flex items-center gap-3 px-3 py-2 rounded-lg'
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <span className='text-xs text-slate-400 w-36'>
                    {ind.name}
                  </span>
                  <div className='flex-1'>
                    <div className='w-full h-2 rounded-full bg-slate-800 overflow-hidden'>
                      <div
                        className='h-full rounded-full transition-all'
                        style={{
                          width:
                            impact === 'positive'
                              ? '75%'
                              : impact === 'negative'
                              ? '25%'
                              : '50%',
                          backgroundColor:
                            impact === 'positive'
                              ? '#10b981'
                              : impact === 'negative'
                              ? '#ef4444'
                              : '#f59e0b',
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium w-16 text-right ${
                      impact === 'positive'
                        ? 'text-emerald-400'
                        : impact === 'negative'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {impact.charAt(0).toUpperCase() + impact.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
