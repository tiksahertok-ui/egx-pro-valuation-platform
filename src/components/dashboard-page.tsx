'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, ArrowUpRight, Info, Globe, Shield, PieChart, Target } from 'lucide-react';
import { LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ReferenceLine, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const topStocks = useMemo(() => {
    return [...stocks]
      .filter(s => s.price > 0)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 12);
  }, [stocks]);

  // CBE Rate History data
  const cbeRateData = useMemo(() => {
    return [
      { date: 'Jan 24', rate: 27.25 },
      { date: 'Mar 24', rate: 27.25 },
      { date: 'Jun 24', rate: 27.25 },
      { date: 'Sep 24', rate: 25.75 },
      { date: 'Nov 24', rate: 25.00 },
      { date: 'Jan 25', rate: 23.25 },
      { date: 'Mar 25', rate: 21.25 },
      { date: 'Jun 25', rate: 20.00 },
      { date: 'Sep 25', rate: 19.50 },
      { date: 'Feb 26', rate: 19.00 },
    ];
  }, []);

  // Fair Value vs. Market Price Scatter Plot data
  const scatterData = useMemo(() => {
    return stocks
      .filter(s => s.price > 0 && s.marketCap > 0)
      .map(s => {
        const eps = s.eps || 0;
        const bvps = s.bookValuePerShare || 0;
        const graham = (eps > 0 && bvps > 0) ? Math.sqrt(15 * eps * bvps) : 0;
        const peBased = eps > 0 ? eps * 8.5 : 0;
        const values = [graham, peBased].filter(v => v > 0);
        const fairValue = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
        const upside = fairValue > 0 ? ((fairValue - s.price) / s.price) * 100 : 0;
        return {
          ticker: s.ticker,
          marketPrice: s.price,
          fairValue,
          upside,
          fill: upside > 10 ? '#10b981' : upside < -10 ? '#ef4444' : '#f59e0b',
        };
      })
      .filter(d => d.fairValue > 0);
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
      {/* Market Summary Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            Market Summary
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Egyptian Exchange - Real-time valuation data</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono">
          {stocks.length} stocks tracked
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -translate-y-4 translate-x-4" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Total Market Cap</p>
            </div>
            <p className="text-xl font-bold font-mono">
              {stats.totalMarketCap > 0 ? formatMarketCap(stats.totalMarketCap) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -translate-y-4 translate-x-4" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Total Stocks</p>
            </div>
            <p className="text-xl font-bold font-mono">{stats.stocksCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -translate-y-4 translate-x-4" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Sectors</p>
            </div>
            <p className="text-xl font-bold font-mono">{stats.sectorsCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -translate-y-4 translate-x-4" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Avg P/E Ratio</p>
            </div>
            <p className="text-xl font-bold font-mono">{stats.avgPE > 0 ? stats.avgPE.toFixed(1) : '—'}</p>
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
              <Shield className="w-4 h-4 text-emerald-500" />
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

      {/* CBE Rate History */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            CBE Rate History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={cbeRateData}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[17, 29]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'CBE Rate']}
              />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-center mt-1">
            <span className="text-[10px] text-muted-foreground">Current: 19.00% (May 2026)</span>
          </div>
        </CardContent>
      </Card>

      {/* Featured Stocks */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Featured Stocks
            </CardTitle>
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono shrink-0">
                    {s.ticker.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate group-hover:text-emerald-500 transition-colors">{s.ticker}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.name}</p>
                  </div>
                </div>
                <p className="text-sm font-bold font-mono">{s.price > 0 ? formatPrice(s.price) : '—'}</p>
                {s.sector && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.sector}</p>}
                {s.peRatio > 0 && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 h-4 border-border/50">
                      P/E {s.peRatio.toFixed(1)}
                    </Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fair Value vs. Market Price Scatter Plot */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            Fair Value vs. Market Price
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" dataKey="marketPrice" name="Market Price" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" label={{ value: 'Market Price (EGP)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis type="number" dataKey="fairValue" name="Fair Value" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" label={{ value: 'Fair Value (EGP)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => [`EGP ${value.toFixed(2)}`, name]}
                  labelFormatter={(_, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0]?.payload as { ticker: string; upside: number } | undefined;
                      if (data) {
                        return `${data.ticker} (${data.upside > 0 ? '+' : ''}${data.upside.toFixed(1)}%)`;
                      }
                    }
                    return '';
                  }}
                />
                <ReferenceLine slope={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                <Scatter data={scatterData} fill="#10b981">
                  {scatterData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-xs">No valuation data available</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Undervalued {'>'}10%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">Fair Value ±10%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-muted-foreground">Overvalued {'>'}10%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
