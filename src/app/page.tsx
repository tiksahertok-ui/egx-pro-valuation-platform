'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, TrendingDown, Search, RefreshCw,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus,
  LayoutDashboard, List, PieChart, Calculator, Loader2,
  Building2, Eye, X, CheckCircle, AlertCircle, Info
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  modelNameAr: string;
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
      rsi14: number;
      macdLine: number;
      macdSignal: number;
      macdHist: number;
      bbUpper: number;
      bbMiddle: number;
      bbLower: number;
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

const SECTOR_NAMES_AR: Record<string, string> = {
  'Banking': 'البنوك',
  'Real Estate': 'العقارات',
  'Financial Services': 'الخدمات المالية',
  'Telecommunications': 'الاتصالات',
  'Food & Beverages': 'الأغذية والمشروبات',
  'Construction & Engineering': 'التشييد والهندسة',
  'Energy': 'الطاقة',
  'Chemicals & Fertilizers': 'الكيمياويات والأسمدة',
  'Tobacco': 'التبغ',
  'Technology': 'التكنولوجيا',
  'Tourism': 'السياحة',
  'Healthcare & Pharma': 'الرعاية الصحية',
  'Textiles & Retail': 'المنسوجات والتجزئة',
  'Mining & Materials': 'التعدين والمواد',
  'Insurance': 'التأمين',
  'Other & Investment': 'أخرى واستثمار',
  'Transport & Logistics': 'النقل واللوجستيات',
  'Media & Entertainment': 'الإعلام والترفيه',
  'Automotive': 'السيارات',
  'Paper & Packaging': 'الورق والتغليف',
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// ============================================================
// Helper Functions
// ============================================================

function formatNumber(num: number): string {
  if (!num && num !== 0) return '-';
  if (num >= 1e12) return (num / 1e12).toFixed(1) + ' ت';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + ' ب';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + ' م';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + ' ك';
  return num.toFixed(2);
}

function formatPrice(num: number): string {
  if (!num) return '-';
  return num.toFixed(2) + ' ج.م';
}

function formatMarketCap(num: number): string {
  if (!num) return '-';
  if (num >= 1e12) return (num / 1e12).toFixed(1) + ' تريليون';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + ' مليار';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + ' مليون';
  return num.toLocaleString();
}

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'undervalued':
    case 'strong_buy':
    case 'buy':
      return 'text-emerald-600';
    case 'overvalued':
    case 'strong_sell':
    case 'sell':
      return 'text-red-600';
    default:
      return 'text-amber-600';
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

function getVerdictAr(verdict: string): string {
  switch (verdict) {
    case 'undervalued': return 'مقيمة بأقل';
    case 'overvalued': return 'مقيمة بأعلى';
    case 'fair': return 'عادلة';
    case 'strong_buy': return 'شراء قوي';
    case 'buy': return 'شراء';
    case 'hold': return 'احتفاظ';
    case 'sell': return 'بيع';
    case 'strong_sell': return 'بيع قوي';
    default: return verdict;
  }
}

function getOverallVerdictAr(verdict: string): string {
  switch (verdict) {
    case 'strong_buy': return 'شراء قوي';
    case 'buy': return 'شراء';
    case 'hold': return 'احتفاظ';
    case 'sell': return 'بيع';
    case 'strong_sell': return 'بيع قوي';
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
      if (!res.ok) throw new Error('فشل تحميل الأسهم');
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
      if (!res.ok) throw new Error('فشل تحميل بيانات السهم');
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
      if (!res.ok) throw new Error('فشل تحميل القطاعات');
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
      if (!res.ok) throw new Error('فشل تحديث البيانات');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success(`تم التحديث: ${data.prices?.refreshed || 0} سهم`);
    },
    onError: () => {
      toast.error('فشل تحديث البيانات');
    },
  });
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

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }

    // Sector filter
    if (selectedSector !== 'all') {
      result = result.filter(s => s.sector === selectedSector);
    }

    // Sort
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
    const avgPE = stocks.filter(s => s.peRatio > 0).reduce((sum, s) => sum + s.peRatio, 0) / (stocks.filter(s => s.peRatio > 0).length || 1);
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
        name: SECTOR_NAMES_AR[sector] || sector,
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

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
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
                <p className="text-xs text-slate-500 dark:text-slate-400">منصة تقييم الأسهم المصرية</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                <span>{stats.stocksCount} سهم</span>
                <span className="text-slate-300">|</span>
                <span>{stats.sectorsCount} قطاع</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                تحديث البيانات
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
            <TabsTrigger value="dashboard" className="gap-2 text-xs sm:text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </TabsTrigger>
            <TabsTrigger value="stocks" className="gap-2 text-xs sm:text-sm">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">الأسهم</span>
            </TabsTrigger>
            <TabsTrigger value="sectors" className="gap-2 text-xs sm:text-sm">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">القطاعات</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2 text-xs sm:text-sm">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">الحاسبة</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== DASHBOARD TAB ==================== */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">إجمالي القيمة السوقية</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {stats.totalMarketCap > 0 ? formatMarketCap(stats.totalMarketCap) : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">عدد الأسهم</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{stats.stocksCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">القطاعات</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{stats.sectorsCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">متوسط م/ر</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{stats.avgPE > 0 ? stats.avgPE.toFixed(1) : '—'}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Gainers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    الأكثر ارتفاعاً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topGainers.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topGainers.map(s => (
                        <button
                          key={s.ticker}
                          onClick={() => { setSelectedTicker(s.ticker); setActiveTab('stocks'); }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                              {s.ticker.slice(0, 2)}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{s.nameAr || s.name}</p>
                              <p className="text-xs text-slate-500">{s.ticker}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold">{formatPrice(s.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Info className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">اضغط &quot;تحديث البيانات&quot; لجلب الأسعار</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Losers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    الأكثر انخفاضاً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topLosers.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topLosers.map(s => (
                        <button
                          key={s.ticker}
                          onClick={() => { setSelectedTicker(s.ticker); setActiveTab('stocks'); }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 dark:text-red-400 text-xs font-bold">
                              {s.ticker.slice(0, 2)}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{s.nameAr || s.name}</p>
                              <p className="text-xs text-slate-500">{s.ticker}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold">{formatPrice(s.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Info className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">اضغط &quot;تحديث البيانات&quot; لجلب الأسعار</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sector Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    توزيع القطاعات
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
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Info className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">لا توجد بيانات</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stock Grid */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">أبرز الأسهم</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('stocks')}>
                    عرض الكل <ArrowUpRight className="w-4 h-4 mr-1" />
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
                        onClick={() => { setSelectedTicker(s.ticker); setActiveTab('stocks'); }}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-right"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
                            {s.ticker.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{s.ticker}</p>
                            <p className="text-[10px] text-slate-500 truncate">{s.nameAr || s.name}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold">{s.price > 0 ? formatPrice(s.price) : '—'}</p>
                        {s.sector && (
                          <p className="text-[10px] text-slate-400 mt-1">{SECTOR_NAMES_AR[s.sector] || s.sector}</p>
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
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="بحث بالاسم أو الرمز..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="all">جميع القطاعات</option>
                {Object.entries(SECTOR_NAMES_AR).map(([en, ar]) => (
                  <option key={en} value={en}>{ar}</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-slate-500 mb-2">
              عرض {filteredStocks.length} من أصل {stocks.length} سهم
            </div>

            {/* Stock Table */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort('ticker')}>
                          الرمز <SortIcon field="ticker" />
                        </TableHead>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort('price')}>
                          السعر <SortIcon field="price" />
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort('peRatio')}>
                          م/ر <SortIcon field="peRatio" />
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort('pbRatio')}>
                          م/ق <SortIcon field="pbRatio" />
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort('marketCap')}>
                          القيمة السوقية <SortIcon field="marketCap" />
                        </TableHead>
                        <TableHead className="text-right">القطاع</TableHead>
                        <TableHead className="text-right"></TableHead>
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
                            لا توجد نتائج
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
                                <p className="text-sm font-medium">{s.nameAr || s.name}</p>
                                <p className="text-xs text-slate-400">{s.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">
                              {s.price > 0 ? formatPrice(s.price) : '—'}
                            </TableCell>
                            <TableCell>{s.peRatio > 0 ? s.peRatio.toFixed(1) : '—'}</TableCell>
                            <TableCell>{s.pbRatio > 0 ? s.pbRatio.toFixed(2) : '—'}</TableCell>
                            <TableCell>{s.marketCap > 0 ? formatMarketCap(s.marketCap) : '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {SECTOR_NAMES_AR[s.sector] || s.sector}
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
              {Object.entries(SECTOR_NAMES_AR).map(([sectorEn, sectorAr]) => {
                const sectorStocks = stocks.filter(s => s.sector === sectorEn);
                const sectorStat = sectors.find(s => s.sector === sectorEn);
                const sectorMcap = sectorStocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);

                return (
                  <Card key={sectorEn} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{sectorAr}</p>
                          <p className="text-xs text-slate-400">{sectorStocks.length} سهم</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400">متوسط م/ر</p>
                          <p className="font-bold">{sectorStat?.avgPE ? sectorStat.avgPE.toFixed(1) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">متوسط م/ق</p>
                          <p className="font-bold">{sectorStat?.avgPB ? sectorStat.avgPB.toFixed(2) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">القيمة السوقية</p>
                          <p className="font-bold">{sectorMcap > 0 ? formatMarketCap(sectorMcap) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">العائد على حقوق الملكية</p>
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
                                className="text-[10px] cursor-pointer hover:bg-emerald-100"
                                onClick={() => { setSelectedTicker(s.ticker); setActiveTab('stocks'); }}
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

          {/* ==================== CALCULATOR TAB ==================== */}
          <TabsContent value="calculator" className="space-y-6">
            <CalculatorPanel stocks={stocks} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Stock Detail Dialog */}
      <Dialog open={!!selectedTicker} onOpenChange={(open) => !open && setSelectedTicker(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <p>لا توجد بيانات</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          <p>EGX Pro - منصة تقييم الأسهم المصرية | جميع البيانات للأغراض التعليمية فقط</p>
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

  // Chart data for price history
  const chartData = useMemo(() => {
    return priceHistory
      .slice(0, 180)
      .reverse()
      .map(p => ({
        date: new Date(p.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
        close: p.close,
        volume: p.volume,
      }));
  }, [priceHistory]);

  const latestFinancial = stock.financialData?.[0];
  const latestTech = stock.technicalIndicators?.[0];

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
              {stock.ticker.slice(0, 3)}
            </div>
            <div>
              <p className="text-lg font-bold">{stock.nameAr || stock.name}</p>
              <p className="text-sm text-slate-500">{stock.ticker} • {SECTOR_NAMES_AR[stock.sector] || stock.sector}</p>
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
            <p className="text-xs text-emerald-600 dark:text-emerald-400">السعر الحالي</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatPrice(stock.price)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">مكرر الربحية</p>
            <p className="text-xl font-bold">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-slate-400">القطاع: {sectorAvg?.avgPE?.toFixed(1) || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">مكرر القيمة الدفترية</p>
            <p className="text-xl font-bold">{stock.pbRatio > 0 ? stock.pbRatio.toFixed(2) : '—'}</p>
            <p className="text-[10px] text-slate-400">القطاع: {sectorAvg?.avgPB?.toFixed(2) || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">القيمة السوقية</p>
            <p className="text-xl font-bold">{formatMarketCap(stock.marketCap)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Valuation Summary */}
      {valuation && (
        <Card className="border-2 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              نتيجة التقييم الشامل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-xs text-slate-400">القيمة العادلة (متوسط)</p>
                <p className="text-lg font-bold text-emerald-600">{formatPrice(valuation.averageFairValue)}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-xs text-slate-400">القيمة العادلة (وسيط)</p>
                <p className="text-lg font-bold">{formatPrice(valuation.medianFairValue)}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-xs text-slate-400">التفوق المتوقع</p>
                <p className={`text-lg font-bold ${valuation.averageUpside > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {valuation.averageUpside > 0 ? '+' : ''}{valuation.averageUpside.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-xs text-slate-400">التوصية</p>
                <Badge className={`text-sm ${getVerdictBg(valuation.overallVerdict)}`}>
                  {getOverallVerdictAr(valuation.overallVerdict)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-3 h-3" />
              <span>مستوى الثقة: {(valuation.confidenceScore * 100).toFixed(0)}% | بناءً على {valuation.models.filter(m => m.fairValue > 0).length} نماذج</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Models */}
      {valuation && valuation.models.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">تفاصيل نماذج التقييم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {valuation.models.map(model => (
                <div
                  key={model.model}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold">{model.modelNameAr}</p>
                      <p className="text-[10px] text-slate-400">{model.modelName}</p>
                    </div>
                    <Badge className={`text-[10px] ${getVerdictBg(model.verdict)}`}>
                      {getVerdictAr(model.verdict)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">القيمة العادلة</p>
                      <p className="font-bold">{model.fairValue > 0 ? formatPrice(model.fairValue) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">التفوق</p>
                      <p className={`font-bold ${model.upsideDownside > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {model.upsideDownside > 0 ? '+' : ''}{model.upsideDownside.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">الثقة</p>
                      <p className="font-bold">{(model.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  {model.confidence > 0 && (
                    <Progress value={model.confidence * 100} className="h-1 mt-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">السعر التاريخي</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={false} name="السعر" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Financial Metrics */}
      {latestFinancial && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">المؤشرات المالية ({latestFinancial.year})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs">الإيرادات</p>
                <p className="font-bold">{formatMarketCap(latestFinancial.revenue)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">صافي الربح</p>
                <p className="font-bold">{formatMarketCap(latestFinancial.netIncome)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">هامش الربح</p>
                <p className="font-bold">{(latestFinancial.profitMargin * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">العائد على حقوق الملكية</p>
                <p className="font-bold">{(latestFinancial.roe * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">العائد على الأصول</p>
                <p className="font-bold">{(latestFinancial.roa * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">الدين/حقوق الملكية</p>
                <p className="font-bold">{latestFinancial.debtToEquity.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">هامش مجمل</p>
                <p className="font-bold">{(latestFinancial.grossMargin * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">هامش التشغيل</p>
                <p className="font-bold">{(latestFinancial.operatingMargin * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Indicators */}
      {latestTech && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">المؤشرات الفنية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs">RSI (14)</p>
                <p className={`font-bold ${latestTech.rsi14 > 70 ? 'text-red-600' : latestTech.rsi14 < 30 ? 'text-emerald-600' : ''}`}>
                  {latestTech.rsi14.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">MACD</p>
                <p className={`font-bold ${latestTech.macdHist > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {latestTech.macdLine.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">بولينجر (أعلى)</p>
                <p className="font-bold">{latestTech.bbUpper.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">بولينجر (أسفل)</p>
                <p className="font-bold">{latestTech.bbLower.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {(stock.descriptionAr || stock.description) && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {stock.descriptionAr || stock.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Calculator Panel Component
// ============================================================

function CalculatorPanel({ stocks }: { stocks: StockData[] }) {
  const [selectedStock, setSelectedStock] = useState('');
  const [growthRate, setGrowthRate] = useState('5');
  const [discountRate, setDiscountRate] = useState('18');
  const [terminalGrowth, setTerminalGrowth] = useState('2');
  const [results, setResults] = useState<ValuationModelResult[] | null>(null);
  const [calculating, setCalculating] = useState(false);

  const stock = stocks.find(s => s.ticker === selectedStock);

  const handleCalculate = useCallback(async () => {
    if (!selectedStock) {
      toast.error('اختر سهماً أولاً');
      return;
    }

    setCalculating(true);
    try {
      const res = await fetch(`/api/stocks/${selectedStock}`);
      if (!res.ok) throw new Error('فشل تحميل البيانات');
      const data = await res.json();

      if (data.valuation) {
        setResults(data.valuation.models);
      } else {
        toast.info('لا توجد بيانات كافية للتقييم. اضغط تحديث البيانات أولاً.');
        setResults([]);
      }
    } catch (error) {
      toast.error('فشل حساب التقييم');
    } finally {
      setCalculating(false);
    }
  }, [selectedStock]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            حاسبة التقييم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-500 mb-1 block">اختر السهم</label>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="">-- اختر سهم --</option>
              {stocks.map(s => (
                <option key={s.ticker} value={s.ticker}>
                  {s.ticker} - {s.nameAr || s.name}
                </option>
              ))}
            </select>
          </div>

          {stock && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div>
                <p className="text-xs text-slate-400">السعر</p>
                <p className="font-bold">{stock.price > 0 ? formatPrice(stock.price) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">م/ر</p>
                <p className="font-bold">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">ربحية السهم</p>
                <p className="font-bold">{stock.eps > 0 ? stock.eps.toFixed(2) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">القيمة الدفترية</p>
                <p className="font-bold">{stock.bookValuePerShare > 0 ? stock.bookValuePerShare.toFixed(2) : '—'}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-500 mb-1 block">معدل النمو (%)</label>
              <Input
                type="number"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                placeholder="5"
              />
            </div>
            <div>
              <label className="text-sm text-slate-500 mb-1 block">معدل الخصم (%)</label>
              <Input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                placeholder="18"
              />
            </div>
            <div>
              <label className="text-sm text-slate-500 mb-1 block">النمو النهائي (%)</label>
              <Input
                type="number"
                value={terminalGrowth}
                onChange={(e) => setTerminalGrowth(e.target.value)}
                placeholder="2"
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={calculating || !selectedStock}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {calculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                جاري الحساب...
              </>
            ) : (
              'حساب القيمة العادلة'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نتائج التقييم - {selectedStock}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map(model => (
                <div
                  key={model.model}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold">{model.modelNameAr}</p>
                      <p className="text-xs text-slate-400">{model.modelName}</p>
                    </div>
                    <Badge className={getVerdictBg(model.verdict)}>
                      {getVerdictAr(model.verdict)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">القيمة العادلة</p>
                      <p className="text-lg font-bold">{model.fairValue > 0 ? formatPrice(model.fairValue) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">التفوق/النقص</p>
                      <p className={`text-lg font-bold ${model.upsideDownside > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {model.upsideDownside > 0 ? '+' : ''}{model.upsideDownside.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Progress value={model.confidence * 100} className="h-1.5 mt-3" />
                  <p className="text-[10px] text-slate-400 mt-1">مستوى الثقة: {(model.confidence * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-emerald-600">متوسط القيمة العادلة</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {formatPrice(results.filter(m => m.fairValue > 0).reduce((s, m) => s + m.fairValue, 0) / results.filter(m => m.fairValue > 0).length)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600">متوسط التفوق</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {(results.filter(m => m.fairValue > 0).reduce((s, m) => s + m.upsideDownside, 0) / results.filter(m => m.fairValue > 0).length).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600">التوصية</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {results.filter(m => m.upsideDownside > 10).length > results.filter(m => m.upsideDownside < -10).length ? 'شراء' :
                     results.filter(m => m.upsideDownside < -10).length > results.filter(m => m.upsideDownside > 10).length ? 'بيع' : 'احتفاظ'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-bold mb-1">نماذج التقييم المستخدمة</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li><strong>DCF</strong> - التدفق النقدي المخصوم: توقع التدفقات النقدية الحرة وخصمها بمعدل WACC</li>
                <li><strong>DDM</strong> - نموذج توزيعات الأرباح: نموذج جوردون للنمو للأسهم الموزعة</li>
                <li><strong>Graham</strong> - رقم جراهام: sqrt(15 × EPS × BVPS) معدّل للأسواق الناشئة</li>
                <li><strong>Relative</strong> - التقييم النسبي: مقارنة م/ر وم/ق بمتوسط القطاع</li>
                <li><strong>Residual Income</strong> - الدخل المتبقي: القيمة الدفترية + القيمة الحالية للدخل المتبقي</li>
                <li><strong>EV/EBITDA</strong> - القيمة المؤسسية/الربحية: باستخدام مضاعفات القطاع</li>
                <li><strong>NAV</strong> - صافي قيمة الأصول: مع تعديل العائد على حقوق الملكية</li>
                <li><strong>EPV</strong> - قيمة القوة الكسبية: رسملة الأرباح المعيارية</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
