'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calculator,
  Activity,
  FileText,
  Globe2,
  Minus,
  BarChart2,
} from 'lucide-react';
import ValuationPanel from './valuation-panel';
import MetricsPanel from './metrics-panel';
import TechnicalPanel from './technical-panel';
import AIReportPanel from './ai-report-panel';
import SectorPanel from './sector-panel';
import DataFreshnessIndicator from './data-freshness-indicator';
import MacroSensitivityPanel from './macro-sensitivity-panel';
import { formatPrice, formatPercent, formatMarketCap } from '@/app/page';

interface StockDetail {
  stock: {
    ticker: string;
    name: string;
    nameAr: string;
    sector: string;
    industry: string;
    marketCap: number;
    price: number;
    beta: number;
    dividendYield: number;
    peRatio: number;
    pbRatio: number;
    eps: number;
    bookValuePerShare: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    avgVolume: number;
    exchange: string;
    currency: string;
    description: string;
    descriptionAr: string;
    sharesOutstanding: number;
  };
  quickMetrics: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    roe: number;
    revenueGrowth: number;
    epsGrowth: number;
    debtToEquity: number;
    currentRatio: number;
  } | null;
  valuations: Array<{
    model: string;
    fairValue: number;
    upside: number;
    confidence: number;
  }>;
}

interface StockDetailViewProps {
  ticker: string;
  onBack: () => void;
}

export default function StockDetailView({ ticker, onBack }: StockDetailViewProps) {
  const [stockData, setStockData] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/${ticker}`);
        const data = await res.json();
        setStockData(data);
      } catch (err) {
        console.error('Failed to fetch stock:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [ticker]);

  if (loading || !stockData) {
    return (
      <div className='p-4 space-y-4'>
        {/* Header skeleton */}
        <div className='flex items-start gap-4'>
          <div className='space-y-2'>
            <Skeleton className='h-8 w-48 bg-slate-800' />
            <Skeleton className='h-4 w-32 bg-slate-800' />
          </div>
          <div className='ml-auto space-y-2'>
            <Skeleton className='h-10 w-36 bg-slate-800' />
            <Skeleton className='h-4 w-24 bg-slate-800' />
          </div>
        </div>
        <Skeleton className='h-10 w-full bg-slate-800 max-w-xl' />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Skeleton className='h-64 bg-slate-800 rounded-lg' />
          <Skeleton className='h-64 bg-slate-800 rounded-lg' />
        </div>
      </div>
    );
  }

  const { stock, quickMetrics, valuations } = stockData;
  const compositeValuation = valuations.find(
    (v) => v.model === 'Composite (Weighted)'
  );
  const upside = compositeValuation?.upside ?? 0;
  const fairValue = compositeValuation?.fairValue ?? stock.price;

  // Price position in 52-week range
  const rangePosition =
    stock.fiftyTwoWeekHigh > stock.fiftyTwoWeekLow
      ? ((stock.price - stock.fiftyTwoWeekLow) /
          (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) *
        100
      : 50;

  return (
    <div className='p-4 space-y-4'>
      {/* ─── Data Freshness Indicator ──────────────────── */}
      <DataFreshnessIndicator lastPriceAt={null} lastFinancialsAt={null} />

      {/* ─── Stock Header ───────────────────────────────── */}
      <div
        className='rounded-xl border p-4'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
          <div>
            <div className='flex items-center gap-3 mb-1'>
              <h1 className='mono-num text-2xl font-bold text-cyan-400'>
                {stock.ticker}
              </h1>
              <Badge
                variant='outline'
                className='text-xs bg-slate-800 border-slate-700 text-slate-300'
              >
                {stock.sector}
              </Badge>
              {stock.industry && (
                <Badge
                  variant='outline'
                  className='text-xs bg-slate-800/50 border-slate-700 text-slate-400 hidden sm:inline-flex'
                >
                  {stock.industry}
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-slate-300 text-lg'>{stock.name}</span>
              <span className='text-slate-500 text-lg' dir='rtl'>
                {stock.nameAr}
              </span>
            </div>
            <div className='flex items-center gap-3 mt-2 text-xs text-slate-500'>
              <span>MCap: {formatMarketCap(stock.marketCap)}</span>
              <span>Beta: {stock.beta.toFixed(2)}</span>
              <span>Div: {(stock.dividendYield * 100).toFixed(1)}%</span>
              <span>P/E: {stock.peRatio.toFixed(1)}x</span>
              <span>P/B: {stock.pbRatio.toFixed(1)}x</span>
            </div>
          </div>

          <div className='text-right'>
            <div className='mono-num text-3xl font-bold text-white'>
              {formatPrice(stock.price)}
            </div>
            <div className='flex items-center justify-end gap-2 mt-1'>
              {upside >= 0 ? (
                <TrendingUp className='w-4 h-4 text-emerald-400' />
              ) : upside < 0 ? (
                <TrendingDown className='w-4 h-4 text-red-400' />
              ) : (
                <Minus className='w-4 h-4 text-slate-400' />
              )}
              <span
                className={`mono-num text-lg font-semibold ${
                  upside > 0
                    ? 'text-emerald-400'
                    : upside < 0
                    ? 'text-red-400'
                    : 'text-slate-400'
                }`}
              >
                {formatPercent(upside)}
              </span>
              <span className='text-xs text-slate-500'>vs Fair Value</span>
            </div>
            {fairValue && (
              <div className='text-xs text-slate-500 mt-1'>
                Fair Value: <span className='mono-num text-cyan-400'>{formatPrice(fairValue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 52-Week Range */}
        <div className='mt-4'>
          <div className='flex items-center justify-between text-xs text-slate-500 mb-1'>
            <span className='mono-num'>{stock.fiftyTwoWeekLow.toFixed(2)}</span>
            <span>52-Week Range</span>
            <span className='mono-num'>{stock.fiftyTwoWeekHigh.toFixed(2)}</span>
          </div>
          <div className='relative h-2 rounded-full bg-slate-800'>
            <div
              className='absolute h-full rounded-full'
              style={{
                left: 0,
                right: `${100 - rangePosition}%`,
                background:
                  'linear-gradient(to right, #ef4444, #f59e0b, #10b981)',
              }}
            />
            <div
              className='absolute w-3 h-3 rounded-full border-2 border-white -top-0.5'
              style={{
                left: `${rangePosition}%`,
                transform: 'translateX(-50%)',
                backgroundColor: '#06b6d4',
              }}
            />
          </div>
        </div>

        {/* Quick Metrics */}
        {quickMetrics && (
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4'>
            {[
              { label: 'ROE', value: (quickMetrics.roe * 100).toFixed(1) + '%' },
              {
                label: 'Net Margin',
                value: (quickMetrics.netMargin * 100).toFixed(1) + '%',
              },
              {
                label: 'EPS Growth',
                value: formatPercent(quickMetrics.epsGrowth),
              },
              {
                label: 'Debt/Eq',
                value: quickMetrics.debtToEquity.toFixed(2) + 'x',
              },
            ].map((m) => (
              <div
                key={m.label}
                className='px-3 py-2 rounded-lg'
                style={{ backgroundColor: '#0f172a' }}
              >
                <div className='text-[10px] text-slate-500'>{m.label}</div>
                <div className='mono-num text-sm font-medium text-white'>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Tab Navigation ─────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='bg-slate-900 border border-slate-700 h-9 p-0.5'>
          <TabsTrigger
            value='overview'
            className='text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 h-8'
          >
            <BarChart3 className='w-3.5 h-3.5 mr-1.5' />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value='valuation'
            className='text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 h-8'
          >
            <Calculator className='w-3.5 h-3.5 mr-1.5' />
            Valuation
          </TabsTrigger>
          <TabsTrigger
            value='metrics'
            className='text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 h-8'
          >
            <Activity className='w-3.5 h-3.5 mr-1.5' />
            Metrics
          </TabsTrigger>
          <TabsTrigger
            value='technical'
            className='text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 h-8'
          >
            <TrendingUp className='w-3.5 h-3.5 mr-1.5' />
            Technical
          </TabsTrigger>
          <TabsTrigger
            value='report'
            className='text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 h-8'
          >
            <FileText className='w-3.5 h-3.5 mr-1.5' />
            AI Report
          </TabsTrigger>
          <TabsTrigger
            value='sector'
            className='text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 h-8'
          >
            <Globe2 className='w-3.5 h-3.5 mr-1.5' />
            Sector
          </TabsTrigger>
          <TabsTrigger
            value='macro'
            className='text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 h-8'
          >
            <BarChart2 className='w-3.5 h-3.5 mr-1.5' />
            Macro
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='mt-3'>
          <OverviewTab ticker={ticker} stockData={stockData} />
        </TabsContent>
        <TabsContent value='valuation' className='mt-3'>
          <ValuationPanel ticker={ticker} currentPrice={stock.price} sector={stock.sector} />
        </TabsContent>
        <TabsContent value='metrics' className='mt-3'>
          <MetricsPanel ticker={ticker} />
        </TabsContent>
        <TabsContent value='technical' className='mt-3'>
          <TechnicalPanel ticker={ticker} />
        </TabsContent>
        <TabsContent value='report' className='mt-3'>
          <AIReportPanel ticker={ticker} />
        </TabsContent>
        <TabsContent value='sector' className='mt-3'>
          <SectorPanel ticker={ticker} sector={stock.sector} />
        </TabsContent>
        <TabsContent value='macro' className='mt-3'>
          <MacroSensitivityPanel
            currentWACC={0.15}
            currentFairValue={fairValue}
            currentPrice={stock.price}
            currentUpside={upside}
            sensitivities={[
              { rateChangeBps: 100, waccImpact: 0.01, fairValueImpact: -(fairValue * 0.08), newUpside: upside - 8 },
              { rateChangeBps: 200, waccImpact: 0.02, fairValueImpact: -(fairValue * 0.15), newUpside: upside - 15 },
              { rateChangeBps: -100, waccImpact: -0.01, fairValueImpact: fairValue * 0.09, newUpside: upside + 9 },
              { rateChangeBps: -200, waccImpact: -0.02, fairValueImpact: fairValue * 0.18, newUpside: upside + 18 },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────
function OverviewTab({
  ticker,
  stockData,
}: {
  ticker: string;
  stockData: StockDetail;
}) {
  const { stock, quickMetrics, valuations } = stockData;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      {/* Valuation Summary */}
      <div
        className='rounded-xl border p-4'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <h3 className='text-sm font-semibold text-slate-300 mb-3'>
          Valuation Summary
        </h3>
        <div className='space-y-2'>
          {valuations.map((v) => (
            <div
              key={v.model}
              className='flex items-center justify-between px-3 py-2 rounded-lg'
              style={{ backgroundColor: '#0f172a' }}
            >
              <span className='text-xs text-slate-400'>{v.model}</span>
              <div className='flex items-center gap-3'>
                <span className='mono-num text-xs text-white'>
                  EGP {v.fairValue.toFixed(2)}
                </span>
                <span
                  className={`mono-num text-xs ${
                    v.upside >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatPercent(v.upside)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Ratios */}
      <div
        className='rounded-xl border p-4'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <h3 className='text-sm font-semibold text-slate-300 mb-3'>
          Key Financial Ratios
        </h3>
        {quickMetrics && (
          <div className='space-y-3'>
            {[
              { label: 'Gross Margin', value: quickMetrics.grossMargin, format: 'pct' },
              { label: 'Operating Margin', value: quickMetrics.operatingMargin, format: 'pct' },
              { label: 'Net Margin', value: quickMetrics.netMargin, format: 'pct' },
              { label: 'ROE', value: quickMetrics.roe, format: 'pct' },
              { label: 'Current Ratio', value: quickMetrics.currentRatio, format: 'x' },
              { label: 'Debt/Equity', value: quickMetrics.debtToEquity, format: 'x' },
            ].map((item) => (
              <div key={item.label} className='flex items-center gap-3'>
                <span className='text-xs text-slate-400 w-28'>
                  {item.label}
                </span>
                <div className='flex-1 h-2 rounded-full bg-slate-800 overflow-hidden'>
                  <div
                    className='h-full rounded-full bg-cyan-500/60'
                    style={{
                      width: `${Math.min(Math.abs(item.value) * (item.format === 'pct' ? 100 : 30), 100)}%`,
                    }}
                  />
                </div>
                <span className='mono-num text-xs text-slate-200 w-16 text-right'>
                  {item.format === 'pct'
                    ? `${(item.value * 100).toFixed(1)}%`
                    : `${item.value.toFixed(2)}x`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Company Description */}
      {stock.description && (
        <div
          className='rounded-xl border p-4 lg:col-span-2'
          style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
        >
          <h3 className='text-sm font-semibold text-slate-300 mb-2'>
            About {stock.name}
          </h3>
          <p className='text-xs text-slate-400 leading-relaxed'>
            {stock.description}
          </p>
          {stock.descriptionAr && (
            <p
              className='text-xs text-slate-500 leading-relaxed mt-2'
              dir='rtl'
            >
              {stock.descriptionAr}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
