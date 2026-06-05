'use client';

import { useState, useCallback } from 'react';
import { Star, Trash2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPrice, formatMarketCap } from '@/lib/helpers';
import type { StockData } from '@/lib/types';

const WATCHLIST_KEY = 'egx-pro-watchlist';

function getWatchlistFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWatchlistToStorage(tickers: string[]) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(tickers));
  } catch {
    // ignore
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToWatchlist = useCallback((ticker: string) => {
    setWatchlist(prev => {
      if (prev.includes(ticker)) return prev;
      const next = [...prev, ticker];
      saveWatchlistToStorage(next);
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((ticker: string) => {
    setWatchlist(prev => {
      const next = prev.filter(t => t !== ticker);
      saveWatchlistToStorage(next);
      return next;
    });
  }, []);

  const isInWatchlist = useCallback((ticker: string) => {
    return watchlist.includes(ticker);
  }, [watchlist]);

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist };
}

interface WatchlistPageProps {
  stocks: StockData[];
  isLoading: boolean;
  watchlist: string[];
  onRemoveFromWatchlist: (ticker: string) => void;
  onSelectStock: (ticker: string) => void;
}

export function WatchlistPage({ stocks, isLoading, watchlist, onRemoveFromWatchlist, onSelectStock }: WatchlistPageProps) {
  const watchlistStocks = stocks.filter(s => watchlist.includes(s.ticker));

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Watchlist</h2>
          <p className="text-xs text-muted-foreground">{watchlist.length} stocks in your watchlist</p>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Your watchlist is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Add stocks from the Stocks page by clicking the star icon</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-240px)]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-xs h-9">Ticker</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Price</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">P/E</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">P/B</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Market Cap</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Sector</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlistStocks.length > 0 ? watchlistStocks.map(s => (
                    <TableRow
                      key={s.ticker}
                      className="cursor-pointer hover:bg-accent/30 transition-colors border-border/30 group"
                      onClick={() => onSelectStock(s.ticker)}
                    >
                      <TableCell className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                        {s.ticker}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono font-medium text-xs">
                        {s.price > 0 ? formatPrice(s.price) : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">
                        {s.peRatio > 0 ? s.peRatio.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">
                        {s.pbRatio > 0 ? s.pbRatio.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs">
                        {s.marketCap > 0 ? formatMarketCap(s.marketCap) : '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px] font-normal border-border/50">
                          {s.sector}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600"
                          onClick={(e) => { e.stopPropagation(); onRemoveFromWatchlist(s.ticker); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                        <Info className="w-5 h-5 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Watchlist tickers not found in current stock data</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
