'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SECTOR_ICONS, formatMarketCap } from '@/lib/helpers';
import type { StockData, SectorData } from '@/lib/types';

interface SectorsPageProps {
  stocks: StockData[];
  sectors: SectorData[];
  isLoading: boolean;
  onSelectStock: (ticker: string) => void;
}

export function SectorsPage({ stocks, sectors, isLoading, onSelectStock }: SectorsPageProps) {
  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(stocks.map(st => st.sector))).sort();
  }, [stocks]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Sectors</h2>
          <p className="text-xs text-muted-foreground">{uniqueSectors.length} sectors in the EGX market</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueSectors.map(sectorName => {
          const sectorStocks = stocks.filter(s => s.sector === sectorName);
          const sectorStat = sectors.find(s => s.sector === sectorName);
          const sectorMcap = sectorStocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
          const pricedStocks = sectorStocks.filter(s => s.price > 0);
          const avgPE = pricedStocks.length > 0
            ? pricedStocks.reduce((sum, s) => sum + s.peRatio, 0) / pricedStocks.length
            : 0;

          return (
            <Card
              key={sectorName}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-emerald-500/20 transition-all group"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-lg shrink-0">
                    {SECTOR_ICONS[sectorName] || '📊'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{sectorName}</p>
                    <p className="text-[10px] text-muted-foreground">{sectorStocks.length} stocks{pricedStocks.length < sectorStocks.length ? ` (${pricedStocks.length} priced)` : ''}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Avg P/E</p>
                    <p className="font-bold font-mono">{sectorStat?.avgPE ? sectorStat.avgPE.toFixed(1) : avgPE > 0 ? avgPE.toFixed(1) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Avg P/B</p>
                    <p className="font-bold font-mono">{sectorStat?.avgPB ? sectorStat.avgPB.toFixed(2) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Market Cap</p>
                    <p className="font-bold font-mono">{sectorMcap > 0 ? formatMarketCap(sectorMcap) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Avg ROE</p>
                    <p className="font-bold font-mono">{sectorStat?.avgROE ? (sectorStat.avgROE * 100).toFixed(1) + '%' : '—'}</p>
                  </div>
                </div>

                {sectorStocks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <div className="flex flex-wrap gap-1">
                      {sectorStocks.slice(0, 6).map(s => (
                        <Badge
                          key={s.ticker}
                          variant="secondary"
                          className="text-[10px] cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-mono"
                          onClick={() => onSelectStock(s.ticker)}
                        >
                          {s.ticker}
                        </Badge>
                      ))}
                      {sectorStocks.length > 6 && (
                        <Badge variant="outline" className="text-[10px] border-border/30">
                          +{sectorStocks.length - 6}
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
    </div>
  );
}
