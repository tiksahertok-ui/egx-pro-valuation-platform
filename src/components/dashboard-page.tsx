'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, ArrowUpRight, Info } from 'lucide-react';
import { LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatMarketCap, CHART_COLORS } from '@/lib/helpers';
import type { StockData, SectorData, PageView } from '@/lib/types';

interface DashboardPageProps {
  stocks: StockData[];
  sectors: SectorData[];
  isLoading: boolean;
  onSelectStock: (ticker: string) => void;
  onNavigate: (view: PageView) => void;
}

export function DashboardPage({ stocks, sectors, isLoading, onSelectStock, onNavigate }: DashboardPageProps) {
  const stats = useMemo(() => {
    const totalMarketCap = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
    const stocksCount = stocks.length;
    const sectorsCount = new Set(stocks.map(s => s.sector)).size;
    const stocksWithPE = stocks.filter(s => s.peRatio > 0);
    const avgPE = stocksWithPE.length > 0
      ? stocksWithPE.reduce((sum, s) => sum + s.peRatio, 0) / stocksWithPE.length
      : 0;
    const pricedStocks = stocks.filter(s => s.price > 0);
    const topGainers = [...pricedStocks].sort((a, b) => {
      const aChange = a.fiftyTwoWeekHigh ? ((a.price - a.fiftyTwoWeekHigh * 0.95) / (a.fiftyTwoWeekHigh * 0.95)) : 0;
      const bChange = b.fiftyTwoWeekHigh ? ((b.price - b.fiftyTwoWeekHigh * 0.95) / (b.fiftyTwoWeekHigh * 0.95)) : 0;
      return bChange - aChange;
    }).slice(0, 5);
    const topLosers = [...pricedStocks].sort((a, b) => {
      const aChange = a.fiftyTwoWeekLow ? ((a.price - a.fiftyTwoWeekLow * 1.05) / (a.fiftyTwoWeekLow * 1.05)) : 0;
      const bChange = b.fiftyTwoWeekLow ? ((b.price - b.fiftyTwoWeekLow * 1.05) / (b.fiftyTwoWeekLow * 1.05)) : 0;
      return aChange - bChange;
    }).slice(0, 5);

    return { totalMarketCap, stocksCount, sectorsCount, avgPE, topGainers, topLosers, pricedStocks: pricedStocks.length };
  }, [stocks]);

  const sectorDistribution = useMemo(() => {
    const sectorMap = new Map<string, number>();
    stocks.forEach(s => {
      const current = sectorMap.get(s.sector) || 0;
      sectorMap.set(s.sector, current + (s.marketCap || 1));
    });
    return Array.from(sectorMap.entries())
      .map(([sector, value]) => ({ name: sector, sector, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [stocks]);

  // Top stocks by market cap for the featured section
  const topStocks = useMemo(() => {
    return [...stocks]
      .filter(s => s.price > 0)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 12);
  }, [stocks]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Total Market Cap</p>
            </div>
            <p className="text-lg font-bold font-mono">
              {stats.totalMarketCap > 0 ? formatMarketCap(stats.totalMarketCap) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Total Stocks</p>
            </div>
            <p className="text-lg font-bold font-mono">{stats.stocksCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Sectors</p>
            </div>
            <p className="text-lg font-bold font-mono">{stats.sectorsCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Avg P/E Ratio</p>
            </div>
            <p className="text-lg font-bold font-mono">{stats.avgPE > 0 ? stats.avgPE.toFixed(1) : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Gainers */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats.topGainers.length > 0 ? (
              <div className="space-y-1">
                {stats.topGainers.map(s => (
                  <button
                    key={s.ticker}
                    onClick={() => onSelectStock(s.ticker)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono shrink-0">
                        {s.ticker.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{s.ticker}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold font-mono text-emerald-500 shrink-0">{formatPrice(s.price)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Click &quot;Refresh&quot; to fetch prices</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats.topLosers.length > 0 ? (
              <div className="space-y-1">
                {stats.topLosers.map(s => (
                  <button
                    key={s.ticker}
                    onClick={() => onSelectStock(s.ticker)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 text-[10px] font-bold font-mono shrink-0">
                        {s.ticker.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{s.ticker}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold font-mono text-red-500 shrink-0">{formatPrice(s.price)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Click &quot;Refresh&quot; to fetch prices</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sector Distribution */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Sector Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {sectorDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie
                    data={sectorDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sectorDistribution.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatMarketCap(value)} />
                  <Legend formatter={(value: string) => <span className="text-[10px] text-muted-foreground">{value}</span>} />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Featured Stocks */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Featured Stocks</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => onNavigate('stocks')}>
              View All <ArrowUpRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {topStocks.map(s => (
              <button
                key={s.ticker}
                onClick={() => onSelectStock(s.ticker)}
                className="p-3 rounded-lg border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono shrink-0">
                    {s.ticker.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate group-hover:text-emerald-500 transition-colors">{s.ticker}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.name}</p>
                  </div>
                </div>
                <p className="text-xs font-bold font-mono">{s.price > 0 ? formatPrice(s.price) : '—'}</p>
                {s.sector && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.sector}</p>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
