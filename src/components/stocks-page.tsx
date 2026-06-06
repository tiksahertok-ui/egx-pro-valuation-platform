'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Eye, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice, formatMarketCap } from '@/lib/helpers';
import type { StockData } from '@/lib/types';

interface StocksPageProps {
  stocks: StockData[];
  isLoading: boolean;
  onSelectStock: (ticker: string) => void;
}

// Compute Graham Number from stock data
function computeGrahamNumber(stock: StockData): { graham: number; upside: number; verdict: string } {
  const eps = stock.eps || 0;
  const bvps = stock.bookValuePerShare || 0;
  const price = stock.price || 0;

  // Graham Number = sqrt(15 × EPS × BVPS) for Egypt
  const graham = (eps > 0 && bvps > 0) ? Math.sqrt(15 * eps * bvps) : 0;
  const upside = price > 0 && graham > 0 ? ((graham - price) / price) * 100 : 0;

  let verdict = 'Fair';
  if (upside > 15) verdict = 'Undervalued';
  else if (upside < -15) verdict = 'Overvalued';

  return { graham, upside, verdict };
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === 'Undervalued') {
    return (
      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 border font-medium">
        Undervalued
      </Badge>
    );
  }
  if (verdict === 'Overvalued') {
    return (
      <Badge className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 border font-medium">
        Overvalued
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 border font-medium">
      Fair
    </Badge>
  );
}

export function StocksPage({ stocks, isLoading, onSelectStock }: StocksPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const uniqueSectors = useMemo(() => {
    const s = new Set(stocks.map(st => st.sector));
    return Array.from(s).sort();
  }, [stocks]);

  // Precompute Graham numbers for all stocks
  const grahamMap = useMemo(() => {
    const map = new Map<string, { graham: number; upside: number; verdict: string }>();
    stocks.forEach(s => {
      map.set(s.ticker, computeGrahamNumber(s));
    });
    return map;
  }, [stocks]);

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
      let aVal: number, bVal: number;
      if (sortBy === 'graham') {
        aVal = grahamMap.get(a.ticker)?.graham || 0;
        bVal = grahamMap.get(b.ticker)?.graham || 0;
      } else if (sortBy === 'upside') {
        aVal = grahamMap.get(a.ticker)?.upside || 0;
        bVal = grahamMap.get(b.ticker)?.upside || 0;
      } else {
        aVal = (a as Record<string, unknown>)[sortBy] as number || 0;
        bVal = (b as Record<string, unknown>)[sortBy] as number || 0;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [stocks, searchQuery, selectedSector, sortBy, sortDir, grahamMap]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />;
  };

  return (
    <div className="space-y-4 p-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-card/50 border-border/50"
          />
        </div>
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm bg-card/50 border-border/50">
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {uniqueSectors.map(sector => (
              <SelectItem key={sector} value={sector}>{sector}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-mono font-medium">{filteredStocks.length}</span> of <span className="font-mono font-medium">{stocks.length}</span> stocks
        </p>
        {(searchQuery || selectedSector !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => { setSearchQuery(''); setSelectedSector('all'); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Stock Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[calc(100vh-240px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="cursor-pointer text-xs h-9" onClick={() => handleSort('ticker')}>
                    Ticker {renderSortIcon('ticker')}
                  </TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="cursor-pointer text-xs h-9" onClick={() => handleSort('price')}>
                    Price {renderSortIcon('price')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs hidden md:table-cell" onClick={() => handleSort('peRatio')}>
                    P/E {renderSortIcon('peRatio')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs hidden md:table-cell" onClick={() => handleSort('pbRatio')}>
                    P/B {renderSortIcon('pbRatio')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs hidden lg:table-cell" onClick={() => handleSort('marketCap')}>
                    Mkt Cap {renderSortIcon('marketCap')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs hidden sm:table-cell" onClick={() => handleSort('graham')}>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-500" />
                      Graham FV {renderSortIcon('graham')}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs hidden sm:table-cell" onClick={() => handleSort('upside')}>
                    Verdict {renderSortIcon('upside')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs hidden lg:table-cell" onClick={() => handleSort('dividendYield')}>
                    Div Yield {renderSortIcon('dividendYield')}
                  </TableHead>
                  <TableHead className="text-xs hidden xl:table-cell">Sector</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <TableRow key={i} className="border-border/30">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-muted-foreground text-sm">
                      No stocks found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStocks.map(s => {
                    const g = grahamMap.get(s.ticker);
                    return (
                      <TableRow
                        key={s.ticker}
                        className="cursor-pointer hover:bg-accent/30 transition-colors border-border/30 group"
                        onClick={() => onSelectStock(s.ticker)}
                      >
                        <TableCell className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                          {s.ticker}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium truncate max-w-[140px]">{s.name}</p>
                        </TableCell>
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
                        <TableCell className="hidden sm:table-cell font-mono text-xs font-medium">
                          {g && g.graham > 0 ? (
                            <span className={g.upside > 0 ? 'text-emerald-500' : g.upside < -15 ? 'text-red-500' : 'text-amber-500'}>
                              {formatPrice(g.graham)}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {g && g.graham > 0 ? <VerdictBadge verdict={g.verdict} /> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-xs">
                          {s.dividendYield > 0 ? (s.dividendYield * 100).toFixed(1) + '%' : '—'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge variant="outline" className="text-[10px] font-normal border-border/50">
                            {s.sector}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
