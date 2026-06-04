'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe2,
  Landmark,
  ChevronLeft,
  Triangle,
  Activity,
  Star,
} from 'lucide-react';
import DashboardView from '@/components/egx/dashboard-view';
import StockDetailView from '@/components/egx/stock-detail-view';

// ─── Types ───────────────────────────────────────────────
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

type ViewMode = 'dashboard' | 'stock';

// ─── Format Helpers ──────────────────────────────────────
export const formatEGP = (n: number) => {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(2);
};

export const formatPercent = (n: number) =>
  `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

export const formatPrice = (n: number) => `EGP ${n.toFixed(2)}`;

export const formatMarketCap = (n: number) => {
  if (n >= 1e12) return `EGP ${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `EGP ${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `EGP ${(n / 1e6).toFixed(1)}M`;
  return `EGP ${n.toFixed(0)}`;
};

// ─── Main Page Component ─────────────────────────────────
export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarView, setSidebarView] = useState<
    'watchlist' | 'sectors' | 'economic'
  >('watchlist');
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch stocks list
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/stocks');
        const data = await res.json();
        setStocks(data.stocks || []);

        // If most stocks don't have valuations, trigger batch computation
        const stocksMissingValuations = (data.stocks || []).filter((s: Stock) => s.fairValue === null);
        if (stocksMissingValuations.length > (data.stocks || []).length * 0.5) {
          fetch('/api/valuation/compute-all', { method: 'POST' })
            .then(() => {
              // Re-fetch stocks after computation
              fetch('/api/stocks')
                .then(r => r.json())
                .then(d => setStocks(d.stocks || []))
                .catch(() => {});
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectStock = useCallback((ticker: string) => {
    setSelectedTicker(ticker);
    setCurrentView('stock');
    setSearchQuery('');
    setShowSearch(false);
  }, []);

  const goBack = useCallback(() => {
    setCurrentView('dashboard');
    setSelectedTicker('');
  }, []);

  // Filtered stocks for search
  const filteredStocks = stocks.filter(
    (s) =>
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameAr.includes(searchQuery)
  );

  // Top gainers / losers for ticker
  const topMovers = [...stocks]
    .filter((s) => s.upside !== null)
    .sort((a, b) => (b.upside ?? 0) - (a.upside ?? 0));

  // Unique sectors
  const sectors = [...new Set(stocks.map((s) => s.sector))];

  return (
    <div className='egx-dark min-h-screen flex flex-col' style={{ backgroundColor: '#0a0e17' }}>
      {/* ─── Header ──────────────────────────────────────── */}
      <header
        className='flex items-center gap-4 px-4 h-12 border-b shrink-0'
        style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
      >
        {/* Logo */}
        <div className='flex items-center gap-2 cursor-pointer' onClick={goBack}>
          <div className='w-7 h-7 flex items-center justify-center rounded bg-cyan-500/20'>
            <Triangle className='w-4 h-4 text-cyan-400 fill-cyan-400' />
          </div>
          <span className='font-bold text-lg tracking-tight text-white'>
            EGX <span className='text-cyan-400'>Pro</span>
          </span>
        </div>

        <Separator orientation='vertical' className='h-6 bg-slate-700' />

        {/* Search */}
        <div className='relative flex-1 max-w-md' ref={searchRef}>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <Input
            placeholder='Search stocks... (e.g. COMI, CIB)'
            className='pl-9 h-8 text-sm bg-slate-800/60 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
          />
          {showSearch && searchQuery.length > 0 && (
            <div
              className='absolute top-full mt-1 left-0 right-0 z-50 max-h-80 overflow-y-auto rounded-lg border shadow-2xl egx-scrollbar'
              style={{
                backgroundColor: '#111827',
                borderColor: '#1e293b',
              }}
            >
              {filteredStocks.slice(0, 10).map((stock) => (
                <div
                  key={stock.ticker}
                  className='flex items-center gap-3 px-3 py-2 hover:bg-slate-800 cursor-pointer transition-colors'
                  onClick={() => selectStock(stock.ticker)}
                >
                  <span className='mono-num font-semibold text-cyan-400 text-sm w-16'>
                    {stock.ticker}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm text-slate-200 truncate'>
                      {stock.name}
                    </div>
                    <div className='text-xs text-slate-400 truncate' dir='rtl'>
                      {stock.nameAr}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='mono-num text-sm text-slate-200'>
                      {formatPrice(stock.price)}
                    </div>
                    {stock.upside !== null && (
                      <div
                        className={`mono-num text-xs ${
                          stock.upside >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {formatPercent(stock.upside)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredStocks.length === 0 && (
                <div className='px-3 py-4 text-center text-sm text-slate-500'>
                  No stocks found
                </div>
              )}
            </div>
          )}
        </div>

        <div className='flex-1' />

        {/* Market Ticker */}
        <div className='hidden lg:flex items-center gap-1 overflow-hidden max-w-xl'>
          <Activity className='w-3 h-3 text-cyan-400 egx-pulse shrink-0' />
          <div className='overflow-hidden'>
            <div className='flex gap-4 ticker-animate whitespace-nowrap'>
              {[...topMovers.slice(0, 8), ...topMovers.slice(0, 8)].map(
                (s, i) => (
                  <span
                    key={`${s.ticker}-${i}`}
                    className='inline-flex items-center gap-1.5 text-xs cursor-pointer hover:text-cyan-400 transition-colors'
                    onClick={() => selectStock(s.ticker)}
                  >
                    <span className='font-semibold text-slate-300'>
                      {s.ticker}
                    </span>
                    <span className='mono-num text-slate-400'>
                      {s.price.toFixed(2)}
                    </span>
                    {s.upside !== null && (
                      <span
                        className={`mono-num ${
                          s.upside >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {formatPercent(s.upside)}
                      </span>
                    )}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <Separator orientation='vertical' className='h-6 bg-slate-700 hidden lg:block' />

        {/* Status */}
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-emerald-400 egx-pulse' />
          <span className='text-xs text-slate-400 hidden sm:inline'>Market Open</span>
        </div>
      </header>

      {/* ─── Body ────────────────────────────────────────── */}
      <div className='flex flex-1 overflow-hidden'>
        {/* ─── Sidebar ───────────────────────────────────── */}
        <aside
          className='hidden md:flex flex-col w-56 border-r shrink-0'
          style={{
            backgroundColor: '#0f172a',
            borderColor: '#1e293b',
          }}
        >
          {/* Nav Items */}
          <div className='p-2'>
            <button
              onClick={goBack}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <BarChart3 className='w-4 h-4' />
              Market Overview
            </button>
            <button
              onClick={() => setSidebarView('sectors')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                sidebarView === 'sectors' && currentView === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Globe2 className='w-4 h-4' />
              Sectors
            </button>
            <button
              onClick={() => setSidebarView('economic')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                sidebarView === 'economic' && currentView === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Landmark className='w-4 h-4' />
              Economic Data
            </button>
          </div>

          <Separator className='bg-slate-700/50' />

          {/* Watchlist / Sectors / Economic */}
          <div className='flex-1 overflow-hidden'>
            <div className='px-3 py-2'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  {sidebarView === 'watchlist'
                    ? 'All Stocks'
                    : sidebarView === 'sectors'
                    ? 'Sectors'
                    : 'Quick Stats'}
                </span>
                <Star className='w-3 h-3 text-slate-600' />
              </div>
            </div>

            <ScrollArea className='h-[calc(100vh-200px)] egx-scrollbar'>
              {sidebarView === 'watchlist' && (
                <div className='px-1'>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className='px-2 py-1.5'>
                        <Skeleton className='h-8 w-full bg-slate-800' />
                      </div>
                    ))
                  ) : (
                    stocks.map((stock) => (
                      <button
                        key={stock.ticker}
                        onClick={() => selectStock(stock.ticker)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors hover:bg-slate-800 ${
                          selectedTicker === stock.ticker
                            ? 'bg-cyan-500/10'
                            : ''
                        }`}
                      >
                        <div className='flex items-center gap-2 min-w-0'>
                          <span
                            className={`mono-num font-semibold w-12 ${
                              selectedTicker === stock.ticker
                                ? 'text-cyan-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {stock.ticker}
                          </span>
                          <span className='text-slate-500 truncate'>
                            {stock.name}
                          </span>
                        </div>
                        <div className='flex items-center gap-1.5 shrink-0'>
                          {stock.upside !== null && (
                            <span
                              className={`mono-num ${
                                stock.upside >= 0
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {stock.upside >= 0 ? (
                                <TrendingUp className='w-3 h-3' />
                              ) : (
                                <TrendingDown className='w-3 h-3' />
                              )}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {sidebarView === 'sectors' && (
                <div className='px-2'>
                  {sectors.map((sector) => {
                    const sectorStocks = stocks.filter(
                      (s) => s.sector === sector
                    );
                    const avgUpside =
                      sectorStocks.filter((s) => s.upside !== null).length > 0
                        ? sectorStocks
                            .filter((s) => s.upside !== null)
                            .reduce((sum, s) => sum + (s.upside ?? 0), 0) /
                          sectorStocks.filter((s) => s.upside !== null).length
                        : 0;
                    return (
                      <button
                        key={sector}
                        className='w-full flex items-center justify-between px-2 py-2 rounded text-xs transition-colors hover:bg-slate-800'
                        onClick={goBack}
                      >
                        <span className='text-slate-300'>{sector}</span>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='outline'
                            className='text-[10px] h-4 bg-slate-800 border-slate-700 text-slate-400'
                          >
                            {sectorStocks.length}
                          </Badge>
                          <span
                            className={`mono-num ${
                              avgUpside >= 0
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                          >
                            {avgUpside.toFixed(1)}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {sidebarView === 'economic' && (
                <div className='px-2 space-y-2'>
                  {[
                    { label: 'CBE Rate', value: '27.25%', dir: 'up' },
                    { label: 'USD/EGP', value: '50.85', dir: 'up' },
                    { label: 'Inflation', value: '23.4%', dir: 'down' },
                    { label: 'GDP Growth', value: '3.8%', dir: 'up' },
                    { label: 'Reserves', value: '$47.2B', dir: 'up' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className='flex items-center justify-between px-2 py-1.5 text-xs'
                    >
                      <span className='text-slate-400'>{item.label}</span>
                      <span
                        className={`mono-num ${
                          item.dir === 'up'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </aside>

        {/* ─── Main Content ──────────────────────────────── */}
        <main className='flex-1 overflow-y-auto egx-scrollbar'>
          {currentView === 'stock' && selectedTicker && (
            <div className='p-2'>
              <button
                onClick={goBack}
                className='flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-3'
              >
                <ChevronLeft className='w-3 h-3' />
                Back to Market Overview
              </button>
            </div>
          )}

          {currentView === 'dashboard' ? (
            <DashboardView
              stocks={stocks}
              loading={loading}
              onSelectStock={selectStock}
            />
          ) : (
            <StockDetailView ticker={selectedTicker} onBack={goBack} />
          )}
        </main>
      </div>
    </div>
  );
}
