'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, TrendingDown, Search, RefreshCw,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus,
  LayoutDashboard, List, PieChart, Loader2,
  Building2, Eye, X, Info, Sun, Moon, DollarSign,
  Activity, Shield, Target, Calculator, ArrowRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

// ============================================================
// Types
// ============================================================

interface StockData {
  id: string;
  ticker: string;
  name: string;
  nameAr: string;
  sector: string;
  industry: string;
  price: number;
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  bookValuePerShare: number;
  dividendYield: number;
  beta: number;
  sharesOutstanding: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: number;
  lastPriceAt: string | null;
  description: string;
  descriptionAr: string;
}

interface ValuationModelResult {
  model: string;
  modelName: string;
  fairValue: number;
  upsideDownside: number;
  confidence: number;
  assumptions: Record<string, number | string>;
  verdict: 'undervalued' | 'fair' | 'overvalued';
}

interface StockDetail {
  stock: StockData & {
    financialData: Array<{
      year: number;
      revenue: number;
      netIncome: number;
      totalAssets: number;
      totalEquity: number;
      totalDebt: number;
      roe: number;
      roa: number;
      debtToEquity: number;
      grossMargin: number;
      operatingMargin: number;
      profitMargin: number;
      eps: number;
      bookValuePerShare: number;
      operatingCashflow?: number;
      freeCashflow?: number;
      revenueGrowth?: number;
      earningsGrowth?: number;
      evToEbitda?: number;
    }>;
    priceHistory: Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    technicalIndicators: Array<{
      date: string;
      rsi14?: number;
      macdLine?: number;
      macdSignal?: number;
      macdHist?: number;
      macdHistogram?: number;
      bbUpper?: number;
      bbMiddle?: number;
      bbLower?: number;
      sma20?: number;
      sma50?: number;
      sma200?: number;
    }>;
  };
  valuation: {
    ticker: string;
    currentPrice: number;
    models: ValuationModelResult[];
    averageFairValue: number;
    medianFairValue: number;
    averageUpside: number;
    overallVerdict: string;
    confidenceScore: number;
  } | null;
  sectorAvg: {
    avgPE: number;
    avgPB: number;
    avgROE: number;
    avgEVEbitda: number;
  };
}

interface SectorData {
  sector: string;
  sectorAr: string;
  stockCount: number;
  totalMarketCap: number;
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgDividendYield: number;
}

// ============================================================
// Constants
// ============================================================

const SECTOR_ICONS: Record<string, string> = {
  'Banking': '🏦',
  'Real Estate': '🏗️',
  'Financial Services': '💰',
  'Telecommunications': '📡',
  'Food & Beverages': '🍽️',
  'Food': '🍽️',
  'Construction & Engineering': '⚙️',
  'Construction': '⚙️',
  'Construction Materials': '🧱',
  'Energy': '⚡',
  'Chemicals & Fertilizers': '🧪',
  'Chemicals': '🧪',
  'Electrical Equipment': '🔌',
  'Tobacco': '🚬',
  'Technology': '💻',
  'Tourism': '✈️',
  'Healthcare & Pharma': '🏥',
  'Healthcare': '🏥',
  'Textiles & Retail': '👔',
  'Textiles': '👔',
  'Mining & Materials': '⛏️',
  'Mining': '⛏️',
  'Insurance': '🛡️',
  'Other & Investment': '📦',
  'Transport & Logistics': '🚛',
  'Transport': '🚛',
  'Media & Entertainment': '🎬',
  'Automotive': '🚗',
  'Paper & Packaging': '📄',
  'Industrial': '🏭',
  'Utilities': '💡',
  'Communication Services': '📞',
  'Consumer Discretionary': '🛍️',
  'Consumer Staples': '🛒',
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// ============================================================
// Helper Functions
// ============================================================

function formatNumber(num: number): string {
  if (!num && num !== 0) return '-';
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(2);
}

function formatPrice(num: number): string {
  if (!num) return '-';
  return 'EGP ' + num.toFixed(2);
}

function formatMarketCap(num: number): string {
  if (!num) return '-';
  if (num >= 1e12) return (num / 1e12).toFixed(1) + ' Trillion';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + ' Billion';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + ' Million';
  return num.toLocaleString();
}

function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'undervalued':
    case 'strong_buy':
    case 'buy':
      return 'Undervalued';
    case 'overvalued':
    case 'strong_sell':
    case 'sell':
      return 'Overvalued';
    case 'fair':
    case 'hold':
      return 'Fair Value';
    default:
      return verdict;
  }
}

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'undervalued':
    case 'strong_buy':
    case 'buy':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'overvalued':
    case 'strong_sell':
    case 'sell':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-amber-600 dark:text-amber-400';
  }
}

function getVerdictBg(verdict: string): string {
  switch (verdict) {
    case 'undervalued':
    case 'strong_buy':
    case 'buy':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'overvalued':
    case 'strong_sell':
    case 'sell':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  }
}

function getOverallVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'strong_buy': return 'Strong Buy';
    case 'buy': return 'Buy';
    case 'hold': return 'Hold';
    case 'sell': return 'Sell';
    case 'strong_sell': return 'Strong Sell';
    default: return '—';
  }
}

// ============================================================
// API Hooks
// ============================================================

function useStocks() {
  return useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      const res = await fetch('/api/stocks');
      if (!res.ok) throw new Error('Failed to load stocks');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useStockDetail(ticker: string | null) {
  return useQuery({
    queryKey: ['stock', ticker],
    queryFn: async () => {
      if (!ticker) return null;
      const res = await fetch(`/api/stocks/${ticker}`);
      if (!res.ok) throw new Error('Failed to load stock data');
      return res.json();
    },
    enabled: !!ticker,
    staleTime: 2 * 60 * 1000,
  });
}

function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const res = await fetch('/api/sectors');
      if (!res.ok) throw new Error('Failed to load sectors');
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

function useRefreshData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/refresh', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to refresh data');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success(`Data refreshed: ${data.prices?.refreshed || 0} stocks updated`);
    },
    onError: () => {
      toast.error('Failed to refresh data');
    },
  });
}

// ============================================================
// Theme Toggle Component
// ============================================================

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="sm" className="h-9 w-9 p-0"><Sun className="h-4 w-4" /></Button>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function EGXProPlatform() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { data: stocksData, isLoading: stocksLoading } = useStocks();
  const { data: detailData, isLoading: detailLoading } = useStockDetail(selectedTicker);
  const { data: sectorsData } = useSectors();
  const refreshMutation = useRefreshData();

  const stocks: StockData[] = stocksData?.stocks || [];
  const sectors: SectorData[] = sectorsData?.sectors || [];
  const stockDetail: StockDetail | null = detailData || null;

  // Filtered and sorted stocks
  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }

    if (selectedSector !== 'all') {
      result = result.filter(s => s.sector === selectedSector);
    }

    result.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy] as number || 0;
      const bVal = (b as Record<string, unknown>)[sortBy] as number || 0;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [stocks, searchQuery, selectedSector, sortBy, sortDir]);

  // Stats
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

  // Sector distribution for pie chart
  const sectorDistribution = useMemo(() => {
    const sectorMap = new Map<string, number>();
    stocks.forEach(s => {
      const current = sectorMap.get(s.sector) || 0;
      sectorMap.set(s.sector, current + (s.marketCap || 1));
    });
    return Array.from(sectorMap.entries())
      .map(([sector, value]) => ({
        name: sector,
        sector,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [stocks]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  // Unique sectors for filter
  const uniqueSectors = useMemo(() => {
    const s = new Set(stocks.map(st => st.sector));
    return Array.from(s).sort();
  }, [stocks]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">EGX Pro</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Egyptian Stock Valuation Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                <span>{stats.stocksCount} Stocks</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>{stats.sectorsCount} Sectors</span>
              </div>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="dashboard" className="gap-2 text-xs sm:text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="stocks" className="gap-2 text-xs sm:text-sm">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Stocks</span>
            </TabsTrigger>
            <TabsTrigger value="sectors" className="gap-2 text-xs sm:text-sm">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Sectors</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== DASHBOARD TAB ==================== */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Market Cap</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {stats.totalMarketCap > 0 ? formatMarketCap(stats.totalMarketCap) : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <List className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Stocks</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.stocksCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sectors</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.sectorsCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Avg P/E Ratio</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.avgPE > 0 ? stats.avgPE.toFixed(1) : '—'}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Gainers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Top Gainers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topGainers.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topGainers.map(s => (
                        <button
                          key={s.ticker}
                          onClick={() => { setSelectedTicker(s.ticker); }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                              {s.ticker.slice(0, 2)}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">{s.name}</p>
                              <p className="text-xs text-slate-500">{s.ticker}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(s.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Info className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Click &quot;Refresh&quot; to fetch prices</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Losers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    Top Losers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topLosers.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topLosers.map(s => (
                        <button
                          key={s.ticker}
                          onClick={() => { setSelectedTicker(s.ticker); }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 dark:text-red-400 text-xs font-bold">
                              {s.ticker.slice(0, 2)}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">{s.name}</p>
                              <p className="text-xs text-slate-500">{s.ticker}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatPrice(s.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Info className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Click &quot;Refresh&quot; to fetch prices</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sector Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    Sector Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sectorDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <RechartsPie>
                        <Pie
                          data={sectorDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sectorDistribution.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatMarketCap(value)} />
                        <Legend formatter={(value: string) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Info className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stock Grid */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Featured Stocks</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('stocks')}>
                    View All <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stocksLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {stocks.slice(0, 18).map(s => (
                      <button
                        key={s.ticker}
                        onClick={() => setSelectedTicker(s.ticker)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
                            {s.ticker.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{s.ticker}</p>
                            <p className="text-[10px] text-slate-500 truncate">{s.name}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold">{s.price > 0 ? formatPrice(s.price) : '—'}</p>
                        {s.sector && (
                          <p className="text-[10px] text-slate-400 mt-1">{s.sector}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== STOCKS TAB ==================== */}
          <TabsContent value="stocks" className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or ticker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Sectors</option>
                {uniqueSectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Showing {filteredStocks.length} of {stocks.length} stocks
            </div>

            {/* Stock Table */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('ticker')}>
                          Ticker {sortBy === 'ticker' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />)}
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                          Price {sortBy === 'price' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />)}
                        </TableHead>
                        <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort('peRatio')}>
                          P/E {sortBy === 'peRatio' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />)}
                        </TableHead>
                        <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort('pbRatio')}>
                          P/B {sortBy === 'pbRatio' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />)}
                        </TableHead>
                        <TableHead className="cursor-pointer hidden lg:table-cell" onClick={() => handleSort('marketCap')}>
                          Market Cap {sortBy === 'marketCap' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />)}
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">Sector</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stocksLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 8 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : filteredStocks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                            No results found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStocks.map(s => (
                          <TableRow
                            key={s.ticker}
                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            onClick={() => setSelectedTicker(s.ticker)}
                          >
                            <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">
                              {s.ticker}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{s.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">
                              {s.price > 0 ? formatPrice(s.price) : '—'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{s.peRatio > 0 ? s.peRatio.toFixed(1) : '—'}</TableCell>
                            <TableCell className="hidden md:table-cell">{s.pbRatio > 0 ? s.pbRatio.toFixed(2) : '—'}</TableCell>
                            <TableCell className="hidden lg:table-cell">{s.marketCap > 0 ? formatMarketCap(s.marketCap) : '—'}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline" className="text-[10px]">
                                {s.sector}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== SECTORS TAB ==================== */}
          <TabsContent value="sectors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueSectors.map(sectorName => {
                const sectorStocks = stocks.filter(s => s.sector === sectorName);
                const sectorStat = sectors.find(s => s.sector === sectorName);
                const sectorMcap = sectorStocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);

                return (
                  <Card key={sectorName} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-lg">
                          {SECTOR_ICONS[sectorName] || '📊'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{sectorName}</p>
                          <p className="text-xs text-slate-400">{sectorStocks.length} stocks</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400">Avg P/E</p>
                          <p className="font-bold">{sectorStat?.avgPE ? sectorStat.avgPE.toFixed(1) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Avg P/B</p>
                          <p className="font-bold">{sectorStat?.avgPB ? sectorStat.avgPB.toFixed(2) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Market Cap</p>
                          <p className="font-bold">{sectorMcap > 0 ? formatMarketCap(sectorMcap) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Avg ROE</p>
                          <p className="font-bold">{sectorStat?.avgROE ? (sectorStat.avgROE * 100).toFixed(1) + '%' : '—'}</p>
                        </div>
                      </div>
                      {sectorStocks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex flex-wrap gap-1">
                            {sectorStocks.slice(0, 5).map(s => (
                              <Badge
                                key={s.ticker}
                                variant="secondary"
                                className="text-[10px] cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                onClick={() => setSelectedTicker(s.ticker)}
                              >
                                {s.ticker}
                              </Badge>
                            ))}
                            {sectorStocks.length > 5 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{sectorStocks.length - 5}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Stock Detail Dialog */}
      <Dialog open={!!selectedTicker} onOpenChange={(open) => !open && setSelectedTicker(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
            </div>
          ) : stockDetail ? (
            <StockDetailPanel detail={stockDetail} onClose={() => setSelectedTicker(null)} />
          ) : (
            <div className="py-8 text-center text-slate-400">
              <p>No data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          <p>EGX Pro — Egyptian Stock Valuation Platform | All data for educational purposes only</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Stock Detail Panel Component
// ============================================================

function StockDetailPanel({ detail, onClose }: { detail: StockDetail; onClose: () => void }) {
  const { stock, valuation, sectorAvg } = detail;
  const priceHistory = stock.priceHistory || [];

  const chartData = useMemo(() => {
    return priceHistory
      .slice(0, 180)
      .reverse()
      .map(p => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        close: p.close,
        volume: p.volume,
      }));
  }, [priceHistory]);

  const latestFinancial = stock.financialData?.[0];
  const latestTech = stock.technicalIndicators?.[0];

  // Helper for safe toFixed on potentially undefined/null values
  const safeToFixed = (val: number | undefined | null, digits: number = 2): string => {
    if (val == null || !isFinite(val)) return '—';
    return val.toFixed(digits);
  };

  // Get MACD histogram from either field name
  const macdHistValue = latestTech?.macdHist ?? latestTech?.macdHistogram;

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg">
              {stock.ticker.slice(0, 3)}
            </div>
            <div>
              <p className="text-lg font-bold">{stock.name}</p>
              <p className="text-sm text-slate-500">{stock.ticker} • {stock.sector}</p>
            </div>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </DialogHeader>

      {/* Price & Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-3">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Current Price</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatPrice(stock.price)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">P/E Ratio</p>
            <p className="text-xl font-bold">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-slate-400">Sector: {safeToFixed(sectorAvg?.avgPE, 1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">P/B Ratio</p>
            <p className="text-xl font-bold">{stock.pbRatio > 0 ? stock.pbRatio.toFixed(2) : '—'}</p>
            <p className="text-[10px] text-slate-400">Sector: {safeToFixed(sectorAvg?.avgPB, 2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Market Cap</p>
            <p className="text-xl font-bold">{formatMarketCap(stock.marketCap)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Calculated Fair Value Section */}
      {valuation && (
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Fair Value Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500">Average Fair Value</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(valuation.averageFairValue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Median Fair Value</p>
                <p className="text-2xl font-bold">{formatPrice(valuation.medianFairValue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Upside / Downside</p>
                <p className={`text-2xl font-bold ${getVerdictColor(valuation.overallVerdict)}`}>
                  {valuation.averageUpside > 0 ? '+' : ''}{safeToFixed(valuation.averageUpside, 1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Verdict</p>
                <Badge className={`text-sm px-3 py-1 ${getVerdictBg(valuation.overallVerdict)}`}>
                  {getOverallVerdictLabel(valuation.overallVerdict)}
                </Badge>
                <p className="text-[10px] text-slate-400 mt-1">Confidence: {safeToFixed(valuation.confidenceScore * 100, 0)}%</p>
              </div>
            </div>

            {/* Model Results Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Fair Value</TableHead>
                    <TableHead>Upside</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead className="hidden md:table-cell">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuation.models.map((m) => (
                    <TableRow key={m.model}>
                      <TableCell className="font-medium text-sm">{m.modelName}</TableCell>
                      <TableCell className="font-bold">{formatPrice(m.fairValue)}</TableCell>
                      <TableCell className={getVerdictColor(m.verdict)}>
                        <span className="flex items-center gap-1">
                          {m.upsideDownside > 0 ? <ArrowUpRight className="w-3 h-3" /> : m.upsideDownside < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {m.upsideDownside > 0 ? '+' : ''}{safeToFixed(m.upsideDownside, 1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${getVerdictBg(m.verdict)}`}>
                          {getVerdictLabel(m.verdict)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${m.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{safeToFixed(m.confidence * 100, 0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Price History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={false} name="Close" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics & Technical Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">EPS</span>
                <span className="font-bold">{stock.eps > 0 ? safeToFixed(stock.eps, 2) : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">Book Value/Share</span>
                <span className="font-bold">{stock.bookValuePerShare > 0 ? safeToFixed(stock.bookValuePerShare, 2) : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">Dividend Yield</span>
                <span className="font-bold">{stock.dividendYield > 0 ? safeToFixed(stock.dividendYield, 1) + '%' : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">Beta</span>
                <span className="font-bold">{stock.beta > 0 ? safeToFixed(stock.beta, 2) : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">52-Week High</span>
                <span className="font-bold text-red-600 dark:text-red-400">{stock.fiftyTwoWeekHigh > 0 ? formatPrice(stock.fiftyTwoWeekHigh) : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">52-Week Low</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{stock.fiftyTwoWeekLow > 0 ? formatPrice(stock.fiftyTwoWeekLow) : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">Shares Outstanding</span>
                <span className="font-bold">{stock.sharesOutstanding > 0 ? formatNumber(stock.sharesOutstanding) : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">Avg Volume</span>
                <span className="font-bold">{stock.avgVolume > 0 ? formatNumber(stock.avgVolume) : '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Indicators */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              Technical Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestTech ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">RSI (14)</span>
                  <span className={`font-bold ${(latestTech.rsi14 ?? 0) > 70 ? 'text-red-600' : (latestTech.rsi14 ?? 0) < 30 ? 'text-emerald-600' : ''}`}>
                    {safeToFixed(latestTech.rsi14, 1)}
                    {(latestTech.rsi14 ?? 0) > 70 ? ' (Overbought)' : (latestTech.rsi14 ?? 0) < 30 ? ' (Oversold)' : ''}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">MACD Line</span>
                  <span className="font-bold">{safeToFixed(latestTech.macdLine, 2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">MACD Signal</span>
                  <span className="font-bold">{safeToFixed(latestTech.macdSignal, 2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">MACD Histogram</span>
                  <span className={`font-bold ${(macdHistValue ?? 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {safeToFixed(macdHistValue, 2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">Bollinger Upper</span>
                  <span className="font-bold">{safeToFixed(latestTech.bbUpper, 2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">Bollinger Lower</span>
                  <span className="font-bold">{safeToFixed(latestTech.bbLower, 2)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No technical data available</p>
                <p className="text-xs mt-1">Refresh data to compute indicators</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Data */}
      {latestFinancial && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Financial Data (FY {latestFinancial.year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Revenue</p>
                <p className="font-bold">{formatMarketCap(latestFinancial.revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Net Income</p>
                <p className="font-bold">{formatMarketCap(latestFinancial.netIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Assets</p>
                <p className="font-bold">{formatMarketCap(latestFinancial.totalAssets)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Equity</p>
                <p className="font-bold">{formatMarketCap(latestFinancial.totalEquity)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Debt</p>
                <p className="font-bold">{formatMarketCap(latestFinancial.totalDebt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">ROE</p>
                <p className="font-bold">{latestFinancial.roe > 0 ? safeToFixed(latestFinancial.roe * 100, 1) + '%' : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Gross Margin</p>
                <p className="font-bold">{latestFinancial.grossMargin > 0 ? safeToFixed(latestFinancial.grossMargin * 100, 1) + '%' : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Profit Margin</p>
                <p className="font-bold">{latestFinancial.profitMargin > 0 ? safeToFixed(latestFinancial.profitMargin * 100, 1) + '%' : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {stock.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{stock.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
