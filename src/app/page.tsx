'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, TrendingDown, Search, RefreshCw,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus,
  LayoutDashboard, List, PieChart, Loader2,
  Building2, Eye, X, Info, Sun, Moon, DollarSign,
  Activity, Shield, Target, Calculator, ArrowRight, ArrowLeft,
  AlertTriangle, BarChart2, TrendingUp as TrendingUpIcon
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
      stochasticK?: number;
      stochasticD?: number;
      atr14?: number;
      adx14?: number;
    }>;
  } | null;
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
  error?: string;
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

const CONFIDENCE_THRESHOLD = 0.5;

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
      // The API always returns 200 with error info, so we parse the JSON
      const data = await res.json();
      // If there's an error field but no stock, we still return the data
      // so the UI can show the error gracefully
      return data;
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

      {/* ==================== Stock Detail Full-Page Overlay ==================== */}
      {selectedTicker && (
        <StockDetailOverlay
          ticker={selectedTicker}
          detailData={detailData}
          detailLoading={detailLoading}
          onClose={() => setSelectedTicker(null)}
        />
      )}

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
// Stock Detail Full-Page Overlay
// ============================================================

function StockDetailOverlay({
  ticker,
  detailData,
  detailLoading,
  onClose,
}: {
  ticker: string;
  detailData: StockDetail | null | undefined;
  detailLoading: boolean;
  onClose: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 overflow-y-auto">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
              {ticker.slice(0, 3)}
            </div>
            <span className="font-bold text-lg truncate">{ticker}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {detailLoading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : !detailData || detailData.error || !detailData.stock ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {detailData?.error === 'Stock not found' ? 'Stock Not Found' : 'Unable to Load Stock Data'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
              {detailData?.error === 'Stock not found'
                ? `The stock with ticker "${ticker}" could not be found in our database or master list.`
                : detailData?.details || detailData?.error || 'An error occurred while loading stock data. This may be due to a database connectivity issue. Please try again later.'}
            </p>
            <Button onClick={onClose} variant="outline">
              Go Back
            </Button>
          </div>
        ) : (
          <StockDetailContent detail={detailData} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Stock Detail Content (the actual detail view)
// ============================================================

function StockDetailContent({ detail }: { detail: StockDetail }) {
  const { stock, valuation, sectorAvg } = detail;
  const [detailTab, setDetailTab] = useState('overview');

  // All hooks must be called before any early returns
  const priceHistory = stock?.priceHistory || [];
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

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Stock Data Available</h2>
        <p className="text-slate-500">The stock data could not be loaded.</p>
      </div>
    );
  }

  const latestFinancial = stock.financialData?.[0];
  const latestTech = stock.technicalIndicators?.[0];

  const safeToFixed = (val: number | undefined | null, digits: number = 2): string => {
    if (val == null || !isFinite(val)) return '—';
    return val.toFixed(digits);
  };

  const macdHistValue = latestTech?.macdHist ?? latestTech?.macdHistogram;

  const isConfident = valuation && valuation.confidenceScore > CONFIDENCE_THRESHOLD;

  // Get technical signal interpretation
  const getTechSignal = (name: string, value: number | undefined | null): { label: string; color: string } => {
    if (value == null || !isFinite(value)) return { label: 'N/A', color: 'text-slate-400' };
    switch (name) {
      case 'rsi':
        if (value > 70) return { label: 'Overbought', color: 'text-red-500' };
        if (value < 30) return { label: 'Oversold', color: 'text-emerald-500' };
        return { label: 'Neutral', color: 'text-amber-500' };
      case 'macd':
        if (value > 0) return { label: 'Bullish', color: 'text-emerald-500' };
        return { label: 'Bearish', color: 'text-red-500' };
      case 'adx':
        if (value > 25) return { label: 'Strong Trend', color: 'text-emerald-500' };
        return { label: 'Weak Trend', color: 'text-amber-500' };
      default:
        return { label: '—', color: 'text-slate-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* ========== Header Section ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xl shrink-0">
            {stock.ticker.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{stock.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="font-mono font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                {stock.ticker}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {SECTOR_ICONS[stock.sector] || '📊'} {stock.sector}
              </Badge>
              {stock.industry && (
                <Badge variant="outline" className="text-xs text-slate-500">
                  {stock.industry}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stock.price > 0 ? formatPrice(stock.price) : '—'}
            </p>
            {valuation && (
              <div className="flex items-center gap-2 justify-end mt-1">
                {valuation.averageUpside > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : valuation.averageUpside < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4 text-amber-500" />
                )}
                <span className={`text-lg font-bold ${getVerdictColor(valuation.overallVerdict)}`}>
                  {valuation.averageUpside > 0 ? '+' : ''}{safeToFixed(valuation.averageUpside, 1)}%
                </span>
                {isConfident && (
                  <Badge className={`text-xs px-2 py-0.5 ${getVerdictBg(valuation.overallVerdict)}`}>
                    {getOverallVerdictLabel(valuation.overallVerdict)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== Quick Stats Row ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">P/E Ratio</p>
            <p className="text-lg font-bold">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-slate-400">Sector: {safeToFixed(sectorAvg?.avgPE, 1)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">P/B Ratio</p>
            <p className="text-lg font-bold">{stock.pbRatio > 0 ? stock.pbRatio.toFixed(2) : '—'}</p>
            <p className="text-[10px] text-slate-400">Sector: {safeToFixed(sectorAvg?.avgPB, 2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Market Cap</p>
            <p className="text-lg font-bold">{formatMarketCap(stock.marketCap)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">EPS</p>
            <p className="text-lg font-bold">{stock.eps > 0 ? safeToFixed(stock.eps) : '—'}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Dividend Yield</p>
            <p className="text-lg font-bold">{stock.dividendYield > 0 ? safeToFixed(stock.dividendYield * 100, 1) + '%' : '—'}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Beta</p>
            <p className="text-lg font-bold">{stock.beta > 0 ? safeToFixed(stock.beta) : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* ========== Fair Value Highlight (if confident) ========== */}
      {valuation && isConfident && (
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-slate-950">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Fair Value Estimate</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatPrice(valuation.averageFairValue)}
                  </span>
                  <span className={`text-2xl font-bold ${getVerdictColor(valuation.overallVerdict)}`}>
                    {valuation.averageUpside > 0 ? '+' : ''}{safeToFixed(valuation.averageUpside, 1)}%
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className={`px-3 py-1 text-sm ${getVerdictBg(valuation.overallVerdict)}`}>
                    {getOverallVerdictLabel(valuation.overallVerdict)}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    Median: {formatPrice(valuation.medianFairValue)}
                  </span>
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-500">Confidence</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {safeToFixed(valuation.confidenceScore * 100, 0)}%
                  </span>
                </div>
                <Progress value={valuation.confidenceScore * 100} className="h-3" />
                <p className="text-xs text-slate-400 mt-1">Based on {valuation.models.filter(m => m.fairValue > 0).length} of 8 valuation models</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== Low Confidence Warning ========== */}
      {valuation && !isConfident && (
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/80 to-white dark:from-amber-900/20 dark:to-slate-950">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-lg">
                  Insufficient data for reliable valuation
                </h3>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  Confidence: {safeToFixed(valuation.confidenceScore * 100, 0)}% (minimum 50% required)
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {!stock.price && <p>• No current price data available</p>}
                  {!stock.eps && !latestFinancial?.eps && <p>• No earnings per share data — required for PE, Graham, and EPV models</p>}
                  {!stock.bookValuePerShare && !latestFinancial?.bookValuePerShare && <p>• No book value data — required for PB, NAV, and Residual Income models</p>}
                  {(!latestFinancial?.revenue || latestFinancial.revenue === 0) && <p>• No revenue data — required for DCF and EV/EBITDA models</p>}
                  {(!stock.dividendYield || stock.dividendYield === 0) && <p>• No dividend data — required for DDM model</p>}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Try clicking &quot;Refresh&quot; to fetch the latest financial data from external sources.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== No Valuation at All ========== */}
      {!valuation && (
        <Card className="border-2 border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Info className="w-8 h-8 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-lg">
                  Valuation Unavailable
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Insufficient financial data to compute valuation. This stock needs at least price and earnings or book value data.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Click &quot;Refresh&quot; on the main page to fetch the latest data from external sources.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== Detail Tabs ========== */}
      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="technicals">Technicals</TabsTrigger>
        </TabsList>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Price Chart */}
          {chartData.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Price History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-background, white)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={false} name="Close (EGP)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3" />
                <p>No price history available</p>
                <p className="text-xs mt-1">Click &quot;Refresh&quot; to fetch price data</p>
              </CardContent>
            </Card>
          )}

          {/* Description & Key Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-5 h-5 text-slate-500" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stock.description ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{stock.description}</p>
                ) : (
                  <p className="text-sm text-slate-400">No description available.</p>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Book Value/Share</span>
                    <span className="font-bold">{stock.bookValuePerShare > 0 ? safeToFixed(stock.bookValuePerShare) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">52W High</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{stock.fiftyTwoWeekHigh > 0 ? formatPrice(stock.fiftyTwoWeekHigh) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shares Out.</span>
                    <span className="font-bold">{stock.sharesOutstanding > 0 ? formatNumber(stock.sharesOutstanding) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">52W Low</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{stock.fiftyTwoWeekLow > 0 ? formatPrice(stock.fiftyTwoWeekLow) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg Volume</span>
                    <span className="font-bold">{stock.avgVolume > 0 ? formatNumber(stock.avgVolume) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sector Avg P/E</span>
                    <span className="font-bold">{safeToFixed(sectorAvg?.avgPE, 1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Financial Snapshot */}
          {latestFinancial && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Latest Financial Snapshot (FY {latestFinancial.year})
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
                    <p className="text-xs text-slate-500">ROE</p>
                    <p className="font-bold">{latestFinancial.roe > 0 ? safeToFixed(latestFinancial.roe * 100, 1) + '%' : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Profit Margin</p>
                    <p className="font-bold">{latestFinancial.profitMargin > 0 ? safeToFixed(latestFinancial.profitMargin * 100, 1) + '%' : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== VALUATION TAB ========== */}
        <TabsContent value="valuation" className="space-y-6 mt-4">
          {valuation && isConfident ? (
            <>
              {/* Valuation Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Avg Fair Value</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatPrice(valuation.averageFairValue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500">Median Fair Value</p>
                    <p className="text-2xl font-bold">{formatPrice(valuation.medianFairValue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500">Upside / Downside</p>
                    <p className={`text-2xl font-bold ${getVerdictColor(valuation.overallVerdict)}`}>
                      {valuation.averageUpside > 0 ? '+' : ''}{safeToFixed(valuation.averageUpside, 1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="text-2xl font-bold">{safeToFixed(valuation.confidenceScore * 100, 0)}%</p>
                    <Progress value={valuation.confidenceScore * 100} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Model Results Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    8-Model Valuation Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                            <TableCell className="font-bold">{m.fairValue > 0 ? formatPrice(m.fairValue) : '—'}</TableCell>
                            <TableCell className={getVerdictColor(m.verdict)}>
                              <span className="flex items-center gap-1">
                                {m.upsideDownside > 0 ? <ArrowUpRight className="w-3 h-3" /> : m.upsideDownside < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                {m.fairValue > 0 ? `${m.upsideDownside > 0 ? '+' : ''}${safeToFixed(m.upsideDownside, 1)}%` : '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${m.fairValue > 0 ? getVerdictBg(m.verdict) : 'text-slate-400'}`}>
                                {m.fairValue > 0 ? getVerdictLabel(m.verdict) : 'N/A'}
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

              {/* Sector Comparison */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-purple-600" />
                    Sector Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">P/E Ratio</p>
                      <p className="font-bold text-lg">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'}</p>
                      <p className="text-xs text-slate-400">Sector: {safeToFixed(sectorAvg?.avgPE, 1)}</p>
                      {stock.peRatio > 0 && sectorAvg?.avgPE > 0 && (
                        <p className={`text-xs mt-1 ${stock.peRatio < sectorAvg.avgPE ? 'text-emerald-500' : 'text-red-500'}`}>
                          {stock.peRatio < sectorAvg.avgPE ? 'Below' : 'Above'} sector average
                        </p>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">P/B Ratio</p>
                      <p className="font-bold text-lg">{stock.pbRatio > 0 ? stock.pbRatio.toFixed(2) : '—'}</p>
                      <p className="text-xs text-slate-400">Sector: {safeToFixed(sectorAvg?.avgPB, 2)}</p>
                      {stock.pbRatio > 0 && sectorAvg?.avgPB > 0 && (
                        <p className={`text-xs mt-1 ${stock.pbRatio < sectorAvg.avgPB ? 'text-emerald-500' : 'text-red-500'}`}>
                          {stock.pbRatio < sectorAvg.avgPB ? 'Below' : 'Above'} sector average
                        </p>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">ROE</p>
                      <p className="font-bold text-lg">{latestFinancial?.roe ? safeToFixed(latestFinancial.roe * 100, 1) + '%' : '—'}</p>
                      <p className="text-xs text-slate-400">Sector: {safeToFixed((sectorAvg?.avgROE || 0) * 100, 1)}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">EV/EBITDA</p>
                      <p className="font-bold text-lg">{latestFinancial?.evToEbitda ? safeToFixed(latestFinancial.evToEbitda, 1) : '—'}</p>
                      <p className="text-xs text-slate-400">Sector: {safeToFixed(sectorAvg?.avgEVEbitda, 1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : valuation && !isConfident ? (
            <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/80 to-white dark:from-amber-900/20 dark:to-slate-950">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-amber-800 dark:text-amber-300 mb-2">
                  Insufficient data for reliable valuation
                </h3>
                <p className="text-amber-700 dark:text-amber-400 mb-4">
                  Confidence: {safeToFixed(valuation.confidenceScore * 100, 0)}% (minimum 50% required)
                </p>
                <div className="max-w-md mx-auto text-left space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {!stock.price && <p>• No current price data available</p>}
                  {!stock.eps && !latestFinancial?.eps && <p>• No earnings per share data</p>}
                  {!stock.bookValuePerShare && !latestFinancial?.bookValuePerShare && <p>• No book value data</p>}
                  {(!latestFinancial?.revenue || latestFinancial.revenue === 0) && <p>• No revenue data</p>}
                  {(!stock.dividendYield || stock.dividendYield === 0) && <p>• No dividend data</p>}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-slate-400">
                <Calculator className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">No Valuation Available</p>
                <p className="text-sm mt-1">Financial data is required to compute fair value estimates.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== FINANCIALS TAB ========== */}
        <TabsContent value="financials" className="space-y-6 mt-4">
          {stock.financialData && stock.financialData.length > 0 ? (
            <>
              {/* Latest Financial Highlights */}
              {latestFinancial && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      Financial Highlights (FY {latestFinancial.year})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Revenue</p>
                        <p className="font-bold text-lg">{formatMarketCap(latestFinancial.revenue)}</p>
                        {latestFinancial.revenueGrowth ? (
                          <p className={`text-xs ${latestFinancial.revenueGrowth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {latestFinancial.revenueGrowth > 0 ? '+' : ''}{safeToFixed(latestFinancial.revenueGrowth * 100, 1)}% YoY
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Net Income</p>
                        <p className="font-bold text-lg">{formatMarketCap(latestFinancial.netIncome)}</p>
                        {latestFinancial.earningsGrowth ? (
                          <p className={`text-xs ${latestFinancial.earningsGrowth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {latestFinancial.earningsGrowth > 0 ? '+' : ''}{safeToFixed(latestFinancial.earningsGrowth * 100, 1)}% YoY
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total Assets</p>
                        <p className="font-bold text-lg">{formatMarketCap(latestFinancial.totalAssets)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total Equity</p>
                        <p className="font-bold text-lg">{formatMarketCap(latestFinancial.totalEquity)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Margins & Returns */}
              {latestFinancial && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUpIcon className="w-5 h-5 text-blue-600" />
                      Margins & Returns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Gross Margin', value: latestFinancial.grossMargin },
                        { label: 'Operating Margin', value: latestFinancial.operatingMargin },
                        { label: 'Profit Margin', value: latestFinancial.profitMargin },
                        { label: 'ROE', value: latestFinancial.roe },
                        { label: 'ROA', value: latestFinancial.roa },
                        { label: 'Debt/Equity', value: latestFinancial.debtToEquity },
                        { label: 'EPS', value: latestFinancial.eps, isAbsolute: true },
                        { label: 'Book Value/Share', value: latestFinancial.bookValuePerShare, isAbsolute: true },
                      ].map(({ label, value, isAbsolute }) => (
                        <div key={label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500">{label}</p>
                          <p className="font-bold text-lg">
                            {value && value > 0
                              ? isAbsolute
                                ? safeToFixed(value)
                                : safeToFixed(value * 100, 1) + '%'
                              : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Multi-Year Table */}
              {stock.financialData.length > 1 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Multi-Year Financial Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Net Income</TableHead>
                            <TableHead>ROE</TableHead>
                            <TableHead>Margin</TableHead>
                            <TableHead>EPS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stock.financialData.map((fd) => (
                            <TableRow key={fd.year}>
                              <TableCell className="font-medium">{fd.year}</TableCell>
                              <TableCell>{formatMarketCap(fd.revenue)}</TableCell>
                              <TableCell>{formatMarketCap(fd.netIncome)}</TableCell>
                              <TableCell>{fd.roe > 0 ? safeToFixed(fd.roe * 100, 1) + '%' : '—'}</TableCell>
                              <TableCell>{fd.profitMargin > 0 ? safeToFixed(fd.profitMargin * 100, 1) + '%' : '—'}</TableCell>
                              <TableCell>{fd.eps > 0 ? safeToFixed(fd.eps) : '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-slate-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">No Financial Data Available</p>
                <p className="text-sm mt-1">Click &quot;Refresh&quot; on the main page to fetch financial data from external sources.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== TECHNICALS TAB ========== */}
        <TabsContent value="technicals" className="space-y-6 mt-4">
          {latestTech ? (
            <>
              {/* Signal Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-600" />
                    Technical Signal Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* RSI Signal */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">RSI (14)</p>
                      <p className={`text-2xl font-bold ${getTechSignal('rsi', latestTech.rsi14).color}`}>
                        {safeToFixed(latestTech.rsi14, 1)}
                      </p>
                      <Badge variant="outline" className={`text-xs mt-1 ${getTechSignal('rsi', latestTech.rsi14).color}`}>
                        {getTechSignal('rsi', latestTech.rsi14).label}
                      </Badge>
                    </div>
                    {/* MACD Signal */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">MACD Histogram</p>
                      <p className={`text-2xl font-bold ${getTechSignal('macd', macdHistValue).color}`}>
                        {safeToFixed(macdHistValue, 2)}
                      </p>
                      <Badge variant="outline" className={`text-xs mt-1 ${getTechSignal('macd', macdHistValue).color}`}>
                        {getTechSignal('macd', macdHistValue).label}
                      </Badge>
                    </div>
                    {/* ADX Signal */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">ADX (14)</p>
                      <p className={`text-2xl font-bold ${getTechSignal('adx', latestTech.adx14).color}`}>
                        {safeToFixed(latestTech.adx14, 1)}
                      </p>
                      <Badge variant="outline" className={`text-xs mt-1 ${getTechSignal('adx', latestTech.adx14).color}`}>
                        {getTechSignal('adx', latestTech.adx14).label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Indicators */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Detailed Technical Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {/* Momentum */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500" /> Momentum
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">RSI (14)</span>
                          <span className={`font-bold ${getTechSignal('rsi', latestTech.rsi14).color}`}>
                            {safeToFixed(latestTech.rsi14, 1)}
                            <span className="text-xs ml-1">({getTechSignal('rsi', latestTech.rsi14).label})</span>
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Stochastic %K</span>
                          <span className="font-bold">{safeToFixed(latestTech.stochasticK, 1)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Stochastic %D</span>
                          <span className="font-bold">{safeToFixed(latestTech.stochasticD, 1)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">Williams %R</span>
                          <span className="font-bold">{safeToFixed(latestTech.williamsR, 1)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">CCI (14)</span>
                          <span className="font-bold">{safeToFixed(latestTech.cci14, 1)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Trend */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Trend
                      </h4>
                      <div className="space-y-2 text-sm">
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
                          <span className="text-slate-500">ADX (14)</span>
                          <span className={`font-bold ${getTechSignal('adx', latestTech.adx14).color}`}>
                            {safeToFixed(latestTech.adx14, 1)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-slate-500">ATR (14)</span>
                          <span className="font-bold">{safeToFixed(latestTech.atr14, 2)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Moving Averages */}
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-blue-500" /> Moving Averages & Bollinger
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'SMA 20', value: latestTech.sma20 },
                          { label: 'SMA 50', value: latestTech.sma50 },
                          { label: 'SMA 200', value: latestTech.sma200 },
                          { label: 'BB Upper', value: latestTech.bbUpper },
                          { label: 'BB Middle', value: latestTech.bbMiddle },
                          { label: 'BB Lower', value: latestTech.bbLower },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="font-bold">{safeToFixed(value, 2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">No Technical Indicators Available</p>
                <p className="text-sm mt-1">Click &quot;Refresh&quot; on the main page to compute technical indicators from price data.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
