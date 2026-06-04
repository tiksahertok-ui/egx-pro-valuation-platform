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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  DollarSign,
  Activity,
  Landmark,
  Globe2,
} from 'lucide-react';
import { formatEGP, formatPercent, formatPrice, formatMarketCap } from '@/app/page';

interface Stock {
  ticker: string;
  name: string;
  nameAr: string;
  sector: string;
  marketCap: number;
  price: number;
  change: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  beta: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  fairValue: number | null;
  upside: number | null;
  valuationModel: string | null;
  confidence: number | null;
}

interface SectorData {
  sectors: {
    sector: string;
    avgPE: number;
    avgPB: number;
    avgEVEbitda: number;
    avgDivYield: number;
    avgROE: number;
    avgROA: number;
    avgDebtEquity: number;
    totalMarketCap: number;
    numCompanies: number;
  }[];
  summary: {
    totalSectors: number;
    totalCompanies: number;
    totalMarketCap: number;
  };
}

interface EconomicIndicator {
  name: string;
  nameAr: string;
  value: number;
  previousValue: number;
  change: number;
  unit: string;
  formattedValue: string;
  changeDirection: string;
}

interface DashboardViewProps {
  stocks: Stock[];
  loading: boolean;
  onSelectStock: (ticker: string) => void;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; marketCap: number; avgPE: number; companies: number } }> }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className='rounded-lg border p-3 text-xs shadow-xl' style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <p className='font-semibold text-slate-200 mb-1'>{d.fullName}</p>
        <p className='text-slate-400'>Market Cap: {formatMarketCap(d.marketCap)}</p>
        <p className='text-slate-400'>Avg P/E: {d.avgPE.toFixed(1)}x</p>
        <p className='text-slate-400'>Companies: {d.companies}</p>
      </div>
    );
  }
  return null;
}

export default function DashboardView({
  stocks,
  loading,
  onSelectStock,
}: DashboardViewProps) {
  const [sectors, setSectors] = useState<SectorData | null>(null);
  const [economicData, setEconomicData] = useState<EconomicIndicator[]>([]);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const res = await fetch('/api/sectors');
        const data = await res.json();
        setSectors(data);
      } catch (err) {
        console.error('Failed to fetch sectors:', err);
      }
    };
    const fetchEconomic = async () => {
      try {
        const res = await fetch('/api/economic');
        const data = await res.json();
        setEconomicData(data.indicators || []);
      } catch (err) {
        console.error('Failed to fetch economic data:', err);
      }
    };
    fetchSectors();
    fetchEconomic();
  }, []);

  // Derived data
  const totalMarketCap = stocks.reduce((sum, s) => sum + s.marketCap, 0);
  const stocksWUpside = stocks.filter((s) => s.upside !== null);
  const advancing = stocksWUpside.filter((s) => (s.upside ?? 0) > 0).length;
  const declining = stocksWUpside.filter((s) => (s.upside ?? 0) < 0).length;

  const topGainers = [...stocksWUpside]
    .sort((a, b) => (b.upside ?? 0) - (a.upside ?? 0))
    .slice(0, 5);
  const topLosers = [...stocksWUpside]
    .sort((a, b) => (a.upside ?? 0) - (b.upside ?? 0))
    .slice(0, 5);

  const sectorChartData = (sectors?.sectors || [])
    .map((s) => ({
      name: s.sector.length > 12 ? s.sector.slice(0, 12) + '...' : s.sector,
      fullName: s.sector,
      marketCap: s.totalMarketCap,
      avgPE: s.avgPE,
      companies: s.numCompanies,
    }))
    .sort((a, b) => b.marketCap - a.marketCap);

  if (loading) {
    return (
      <div className='p-4 space-y-4'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-24 bg-slate-800 rounded-lg' />
          ))}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
          <Skeleton className='h-64 bg-slate-800 rounded-lg' />
          <Skeleton className='h-64 bg-slate-800 rounded-lg' />
        </div>
        <Skeleton className='h-96 bg-slate-800 rounded-lg' />
      </div>
    );
  }

  return (
    <div className='p-4 space-y-4'>
      {/* ─── Market Summary Bar ─────────────────────────── */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <Card className='egx-card-glow' style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2 mb-1'>
              <BarChart3 className='w-4 h-4 text-cyan-400' />
              <span className='text-xs text-slate-500'>Total Market Cap</span>
            </div>
            <div className='mono-num text-lg font-bold text-white'>
              {formatMarketCap(totalMarketCap)}
            </div>
          </CardContent>
        </Card>

        <Card className='egx-card-glow' style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2 mb-1'>
              <Activity className='w-4 h-4 text-cyan-400' />
              <span className='text-xs text-slate-500'>Listed Stocks</span>
            </div>
            <div className='mono-num text-lg font-bold text-white'>
              {stocks.length}
            </div>
          </CardContent>
        </Card>

        <Card className='egx-card-glow' style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2 mb-1'>
              <TrendingUp className='w-4 h-4 text-emerald-400' />
              <span className='text-xs text-slate-500'>Undervalued</span>
            </div>
            <div className='mono-num text-lg font-bold text-emerald-400'>
              {advancing}
            </div>
          </CardContent>
        </Card>

        <Card className='egx-card-glow' style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2 mb-1'>
              <TrendingDown className='w-4 h-4 text-red-400' />
              <span className='text-xs text-slate-500'>Overvalued</span>
            </div>
            <div className='mono-num text-lg font-bold text-red-400'>
              {declining}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Top Valued + Market Movers ─────────────────── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
        {/* Top Valued Stocks */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <TrendingUp className='w-4 h-4 text-emerald-400' />
              Top Undervalued Stocks
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='space-y-2'>
              {topGainers.map((stock, idx) => (
                <div
                  key={stock.ticker}
                  className='flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-800/60'
                  style={{ backgroundColor: idx % 2 === 0 ? '#0f172a' : 'transparent' }}
                  onClick={() => onSelectStock(stock.ticker)}
                >
                  <div className='flex items-center gap-3'>
                    <span className='mono-num text-xs text-slate-500 w-4'>
                      {idx + 1}
                    </span>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='mono-num font-semibold text-cyan-400 text-sm'>
                          {stock.ticker}
                        </span>
                        <Badge
                          variant='outline'
                          className='text-[10px] h-4 bg-slate-800 border-slate-700 text-slate-400'
                        >
                          {stock.sector}
                        </Badge>
                      </div>
                      <span className='text-xs text-slate-500'>
                        {stock.name}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='mono-num text-sm text-white'>
                      {formatPrice(stock.price)}
                    </div>
                    <div className='flex items-center gap-1 justify-end'>
                      <ArrowUpRight className='w-3 h-3 text-emerald-400' />
                      <span className='mono-num text-xs text-emerald-400'>
                        {formatPercent(stock.upside ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Losers */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <TrendingDown className='w-4 h-4 text-red-400' />
              Top Overvalued Stocks
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='space-y-2'>
              {topLosers.map((stock, idx) => (
                <div
                  key={stock.ticker}
                  className='flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-800/60'
                  style={{ backgroundColor: idx % 2 === 0 ? '#0f172a' : 'transparent' }}
                  onClick={() => onSelectStock(stock.ticker)}
                >
                  <div className='flex items-center gap-3'>
                    <span className='mono-num text-xs text-slate-500 w-4'>
                      {idx + 1}
                    </span>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='mono-num font-semibold text-cyan-400 text-sm'>
                          {stock.ticker}
                        </span>
                        <Badge
                          variant='outline'
                          className='text-[10px] h-4 bg-slate-800 border-slate-700 text-slate-400'
                        >
                          {stock.sector}
                        </Badge>
                      </div>
                      <span className='text-xs text-slate-500'>
                        {stock.name}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='mono-num text-sm text-white'>
                      {formatPrice(stock.price)}
                    </div>
                    <div className='flex items-center gap-1 justify-end'>
                      <ArrowDownRight className='w-3 h-3 text-red-400' />
                      <span className='mono-num text-xs text-red-400'>
                        {formatPercent(stock.upside ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Sector Performance ─────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Globe2 className='w-4 h-4 text-cyan-400' />
            Sector Market Capitalization
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={sectorChartData} layout='vertical' margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' horizontal={false} />
                <XAxis
                  type='number'
                  tickFormatter={(v) => formatEGP(v)}
                  stroke='#475569'
                  fontSize={10}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={90}
                  stroke='#475569'
                  fontSize={10}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey='marketCap' radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {sectorChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index < 3 ? '#06b6d4' : '#1e293b'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── Stock Grid ─────────────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <DollarSign className='w-4 h-4 text-cyan-400' />
            All Listed Stocks
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead>
                <tr className='border-b' style={{ borderColor: '#1e293b' }}>
                  <th className='text-left py-2 px-2 text-slate-500 font-medium'>Ticker</th>
                  <th className='text-left py-2 px-2 text-slate-500 font-medium'>Name</th>
                  <th className='text-left py-2 px-2 text-slate-500 font-medium hidden sm:table-cell'>Sector</th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>Price</th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>P/E</th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>Fair Value</th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>Upside</th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr
                    key={stock.ticker}
                    className='border-b cursor-pointer transition-colors hover:bg-slate-800/40'
                    style={{ borderColor: '#1e293b40' }}
                    onClick={() => onSelectStock(stock.ticker)}
                  >
                    <td className='py-2 px-2'>
                      <span className='mono-num font-semibold text-cyan-400'>
                        {stock.ticker}
                      </span>
                    </td>
                    <td className='py-2 px-2'>
                      <div className='text-slate-300'>{stock.name}</div>
                      <div className='text-slate-500 text-[10px]' dir='rtl'>
                        {stock.nameAr}
                      </div>
                    </td>
                    <td className='py-2 px-2 hidden sm:table-cell'>
                      <Badge
                        variant='outline'
                        className='text-[10px] h-4 bg-slate-800/50 border-slate-700 text-slate-400'
                      >
                        {stock.sector}
                      </Badge>
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-200'>
                      {stock.price.toFixed(2)}
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-400'>
                      {stock.peRatio?.toFixed(1) ?? '-'}x
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-300'>
                      {stock.fairValue ? stock.fairValue.toFixed(2) : '-'}
                    </td>
                    <td className='py-2 px-2 text-right'>
                      {stock.upside !== null ? (
                        <span
                          className={`mono-num font-medium ${
                            stock.upside >= 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {formatPercent(stock.upside)}
                        </span>
                      ) : (
                        <span className='text-slate-600'>-</span>
                      )}
                    </td>
                    <td className='py-2 px-2 text-right'>
                      {stock.confidence !== null ? (
                        <div className='flex items-center justify-end gap-1'>
                          <div className='w-10 h-1.5 rounded-full bg-slate-800 overflow-hidden'>
                            <div
                              className='h-full rounded-full'
                              style={{
                                width: `${stock.confidence * 100}%`,
                                backgroundColor:
                                  stock.confidence > 0.7
                                    ? '#10b981'
                                    : stock.confidence > 0.4
                                    ? '#f59e0b'
                                    : '#ef4444',
                              }}
                            />
                          </div>
                          <span className='mono-num text-slate-400'>
                            {(stock.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className='text-slate-600'>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Economic Indicators ────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Landmark className='w-4 h-4 text-cyan-400' />
            Egypt Economic Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
            {economicData.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className='h-20 bg-slate-800 rounded-lg' />
                ))
              : economicData.map((ind) => (
                  <div
                    key={ind.name}
                    className='p-3 rounded-lg border transition-colors hover:border-cyan-500/30'
                    style={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                    }}
                  >
                    <div className='text-[10px] text-slate-500 mb-1'>
                      {ind.name}
                    </div>
                    <div className='mono-num text-sm font-bold text-white'>
                      {ind.formattedValue || `${ind.value.toFixed(1)}${ind.unit === '%' ? '%' : ''}`}
                    </div>
                    <div className='flex items-center gap-1 mt-1'>
                      {ind.changeDirection === 'up' ? (
                        <ArrowUpRight className='w-3 h-3 text-emerald-400' />
                      ) : ind.changeDirection === 'down' ? (
                        <ArrowDownRight className='w-3 h-3 text-red-400' />
                      ) : null}
                      <span
                        className={`mono-num text-[10px] ${
                          ind.changeDirection === 'up'
                            ? 'text-emerald-400'
                            : ind.changeDirection === 'down'
                            ? 'text-red-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {ind.change !== 0
                          ? `${ind.change > 0 ? '+' : ''}${ind.change.toFixed(2)}`
                          : 'Stable'}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
