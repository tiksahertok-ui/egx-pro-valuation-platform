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
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe2,
  BarChart3,
  TrendingUp,
  Award,
  Users,
} from 'lucide-react';
import { formatMarketCap } from '@/app/page';

interface SectorStats {
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
  computedAt?: string;
  stocks: Array<{
    ticker: string;
    name: string;
    nameAr: string;
    price: number;
    marketCap: number;
    peRatio: number;
    pbRatio: number;
    dividendYield: number;
    eps: number;
    beta: number;
    peVsSector: number;
    pbVsSector: number;
  }>;
}

interface StockDetail {
  stock: {
    ticker: string;
    name: string;
    nameAr: string;
    sector: string;
    marketCap: number;
    price: number;
    peRatio: number;
    pbRatio: number;
    eps: number;
    dividendYield: number;
  };
  quickMetrics: {
    roe: number;
    roa: number;
    debtToEquity: number;
    grossMargin: number;
    netMargin: number;
  } | null;
}

interface SectorPanelProps {
  ticker: string;
  sector: string;
}

function SectorTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; peRatio: number; isCurrent: boolean } }> }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className='rounded-lg border p-3 text-xs shadow-xl' style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <p className={`font-semibold ${d.isCurrent ? 'text-cyan-400' : 'text-slate-200'}`}>
          {d.name} {d.isCurrent ? '(Current)' : ''}
        </p>
        <p className='text-slate-400'>P/E: {d.peRatio.toFixed(1)}x</p>
      </div>
    );
  }
  return null;
}

export default function SectorPanel({ ticker, sector }: SectorPanelProps) {
  const [sectorData, setSectorData] = useState<SectorStats | null>(null);
  const [stockData, setStockData] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sectorsRes, stockRes] = await Promise.all([
          fetch('/api/sectors'),
          fetch(`/api/stocks/${ticker}`),
        ]);
        const sectorsJson = await sectorsRes.json();
        const stockJson = await stockRes.json();

        const mySector = sectorsJson.sectors?.find(
          (s: SectorStats) => s.sector === sector
        );
        setSectorData(mySector || null);
        setStockData(stockJson);
      } catch (err) {
        console.error('Failed to fetch sector data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticker, sector]);

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-20 bg-slate-800 rounded-xl' />
          ))}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Skeleton className='h-64 bg-slate-800 rounded-xl' />
          <Skeleton className='h-64 bg-slate-800 rounded-xl' />
        </div>
      </div>
    );
  }

  if (!sectorData || !stockData) {
    return (
      <div
        className='rounded-xl border p-8 text-center'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <p className='text-slate-400'>No sector data available</p>
      </div>
    );
  }

  const stock = stockData.stock;
  const qm = stockData.quickMetrics;

  // Sector overview stats
  const sectorStats = [
    {
      label: 'Avg P/E',
      value: `${sectorData.avgPE.toFixed(1)}x`,
      icon: BarChart3,
    },
    {
      label: 'Avg P/B',
      value: `${sectorData.avgPB.toFixed(1)}x`,
      icon: TrendingUp,
    },
    {
      label: 'Avg ROE',
      value: `${(sectorData.avgROE * 100).toFixed(1)}%`,
      icon: Award,
    },
    {
      label: 'Companies',
      value: `${sectorData.numCompanies}`,
      icon: Users,
    },
  ];

  // Radar chart - comparison of stock vs sector
  const radarData = [
    {
      metric: 'Valuation',
      stock: Math.max(0, Math.min(100, stock.peRatio > 0 ? (sectorData.avgPE / stock.peRatio) * 50 : 50)),
      sector: 50,
    },
    {
      metric: 'Profitability',
      stock: Math.max(0, Math.min(100, qm ? qm.roe * 300 : 50)),
      sector: Math.max(0, Math.min(100, sectorData.avgROE * 300)),
    },
    {
      metric: 'Growth',
      stock: Math.max(0, Math.min(100, stock.eps > 0 ? 60 : 30)),
      sector: 50,
    },
    {
      metric: 'Stability',
      stock: Math.max(0, Math.min(100, qm ? (1 - Math.min(qm.debtToEquity, 2) / 2) * 100 : 50)),
      sector: Math.max(0, Math.min(100, (1 - Math.min(sectorData.avgDebtEquity, 2) / 2) * 100)),
    },
    {
      metric: 'Income',
      stock: Math.max(0, Math.min(100, stock.dividendYield * 1000)),
      sector: Math.max(0, Math.min(100, sectorData.avgDivYield * 1000)),
    },
    {
      metric: 'Efficiency',
      stock: Math.max(0, Math.min(100, qm ? qm.netMargin * 300 : 50)),
      sector: Math.max(0, Math.min(100, sectorData.avgROA * 500)),
    },
  ];

  // Peer comparison table data
  const peerData = sectorData.stocks
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 10);

  // Rankings
  const sortedByMCap = [...sectorData.stocks].sort(
    (a, b) => b.marketCap - a.marketCap
  );
  const stockRank =
    sortedByMCap.findIndex((s) => s.ticker === ticker) + 1;

  // P/E comparison bar chart
  const peComparison = sectorData.stocks
    .slice(0, 8)
    .sort((a, b) => a.peRatio - b.peRatio)
    .map((s) => ({
      name: s.ticker,
      peRatio: s.peRatio,
      isCurrent: s.ticker === ticker,
    }));

  return (
    <div className='space-y-4'>
      {/* ─── Sector Overview ────────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Globe2 className='w-4 h-4 text-cyan-400' />
            {sector} Sector Overview
          </CardTitle>
          {sectorData.computedAt ? (
            <div className='text-[10px] text-slate-500 flex items-center gap-1 mt-1'>
              <span>Last computed: {new Date(sectorData.computedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ) : (
            <div className='text-[10px] text-amber-500/70 flex items-center gap-1 mt-1'>
              Static data
            </div>
          )}
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
            {sectorStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className='rounded-lg p-3 border'
                  style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                >
                  <div className='flex items-center gap-1.5 mb-1'>
                    <Icon className='w-3.5 h-3.5 text-cyan-400' />
                    <span className='text-[10px] text-slate-500'>
                      {stat.label}
                    </span>
                  </div>
                  <div className='mono-num text-lg font-bold text-white'>
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className='rounded-lg p-3 flex items-center justify-between'
            style={{ backgroundColor: '#0f172a' }}
          >
            <div>
              <span className='text-xs text-slate-400'>Total Market Cap: </span>
              <span className='mono-num text-sm font-semibold text-cyan-400'>
                {formatMarketCap(sectorData.totalMarketCap)}
              </span>
            </div>
            <div>
              <span className='text-xs text-slate-400'>
                Avg Debt/Equity:{' '}
              </span>
              <span className='mono-num text-sm font-semibold text-amber-400'>
                {sectorData.avgDebtEquity.toFixed(2)}x
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Radar Chart + P/E Comparison ───────────────── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Radar Chart */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300'>
              Stock vs Sector Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <RadarChart data={radarData}>
                  <PolarGrid stroke='#1e293b' />
                  <PolarAngleAxis
                    dataKey='metric'
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#475569', fontSize: 8 }}
                  />
                  <Radar
                    name={stock.ticker}
                    dataKey='stock'
                    stroke='#06b6d4'
                    fill='#06b6d4'
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name='Sector Avg'
                    dataKey='sector'
                    stroke='#f59e0b'
                    fill='#f59e0b'
                    fillOpacity={0.1}
                    strokeWidth={1}
                    strokeDasharray='5 5'
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className='flex items-center justify-center gap-4 text-[10px]'>
              <span className='flex items-center gap-1'>
                <span className='w-3 h-0.5 bg-cyan-400 inline-block' />{' '}
                {stock.ticker}
              </span>
              <span className='flex items-center gap-1'>
                <span className='w-3 h-0.5 bg-amber-400 inline-block border-dashed' />{' '}
                Sector Avg
              </span>
            </div>
          </CardContent>
        </Card>

        {/* P/E Comparison */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300'>
              P/E Ratio Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={peComparison}
                  layout='vertical'
                  margin={{ left: 30, right: 20, top: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='#1e293b'
                    horizontal={false}
                  />
                  <XAxis
                    type='number'
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => `${v.toFixed(0)}x`}
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    width={45}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip content={<SectorTooltip />} />
                  <Bar dataKey='peRatio' radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {peComparison.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.isCurrent ? '#06b6d4' : '#1e293b'}
                        fillOpacity={entry.isCurrent ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Peer Comparison Table ──────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Users className='w-4 h-4 text-cyan-400' />
            Peer Comparison
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
                    Ticker
                  </th>
                  <th className='text-left py-2 px-2 text-slate-500 font-medium'>
                    Name
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    Price
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    MCap
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    P/E
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    vs Sector
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    P/B
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    vs Sector
                  </th>
                  <th className='text-right py-2 px-2 text-slate-500 font-medium'>
                    Div Yield
                  </th>
                </tr>
              </thead>
              <tbody>
                {peerData.map((peer) => (
                  <tr
                    key={peer.ticker}
                    className='border-b'
                    style={{
                      borderColor: '#1e293b30',
                      backgroundColor:
                        peer.ticker === ticker
                          ? 'rgba(6,182,212,0.05)'
                          : 'transparent',
                    }}
                  >
                    <td className='py-2 px-2'>
                      <span
                        className={`mono-num font-semibold ${
                          peer.ticker === ticker
                            ? 'text-cyan-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {peer.ticker}
                      </span>
                      {peer.ticker === ticker && (
                        <Badge className='ml-1 text-[8px] h-3 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 px-1'>
                          CURRENT
                        </Badge>
                      )}
                    </td>
                    <td className='py-2 px-2 text-slate-400'>
                      {peer.name}
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-200'>
                      {peer.price.toFixed(2)}
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-400'>
                      {formatMarketCap(peer.marketCap)}
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-200'>
                      {peer.peRatio.toFixed(1)}x
                    </td>
                    <td className='py-2 px-2 text-right'>
                      <span
                        className={`mono-num ${
                          peer.peVsSector > 0
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {peer.peVsSector >= 0 ? '+' : ''}
                        {peer.peVsSector.toFixed(1)}%
                      </span>
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-200'>
                      {peer.pbRatio.toFixed(1)}x
                    </td>
                    <td className='py-2 px-2 text-right'>
                      <span
                        className={`mono-num ${
                          peer.pbVsSector > 0
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {peer.pbVsSector >= 0 ? '+' : ''}
                        {peer.pbVsSector.toFixed(1)}%
                      </span>
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-400'>
                      {(peer.dividendYield * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Rankings ───────────────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Award className='w-4 h-4 text-amber-400' />
            Sector Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            <div
              className='rounded-lg p-3 border text-center'
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <div className='text-[10px] text-slate-500'>
                Market Cap Rank
              </div>
              <div className='mono-num text-2xl font-bold text-cyan-400'>
                #{stockRank}
              </div>
              <div className='text-[10px] text-slate-500'>
                of {sectorData.numCompanies}
              </div>
            </div>
            <div
              className='rounded-lg p-3 border text-center'
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <div className='text-[10px] text-slate-500'>P/E vs Sector</div>
              <div
                className={`mono-num text-2xl font-bold ${
                  stock.peRatio < sectorData.avgPE
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {stock.peRatio < sectorData.avgPE ? 'Below' : 'Above'}
              </div>
              <div className='text-[10px] text-slate-500'>
                Avg {sectorData.avgPE.toFixed(1)}x
              </div>
            </div>
            <div
              className='rounded-lg p-3 border text-center'
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <div className='text-[10px] text-slate-500'>P/B vs Sector</div>
              <div
                className={`mono-num text-2xl font-bold ${
                  stock.pbRatio < sectorData.avgPB
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {stock.pbRatio < sectorData.avgPB ? 'Below' : 'Above'}
              </div>
              <div className='text-[10px] text-slate-500'>
                Avg {sectorData.avgPB.toFixed(1)}x
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
