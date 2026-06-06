'use client';

import { useState, useMemo } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { BarChart3, Star } from 'lucide-react';
import { useStocks, useStockDetail, useSectors, useRefreshData } from '@/lib/api-hooks';
import { AppSidebar } from '@/components/app-sidebar';
import { DashboardPage } from '@/components/dashboard-page';
import { StocksPage } from '@/components/stocks-page';
import { StockDetailPage, StockDetailSkeleton } from '@/components/stock-detail-page';
import { SectorsPage } from '@/components/sectors-page';
import { WatchlistPage, useWatchlist } from '@/components/watchlist-page';
import type { StockData, SectorData, PageView } from '@/lib/types';

export default function EGXProPlatform() {
  const [activeView, setActiveView] = useState<PageView>('dashboard');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const { data: stocksData, isLoading: stocksLoading } = useStocks();
  const { data: detailData, isLoading: detailLoading } = useStockDetail(selectedTicker);
  const { data: sectorsData } = useSectors();
  const refreshMutation = useRefreshData();
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const stocks: StockData[] = stocksData?.stocks || [];
  const sectors: SectorData[] = sectorsData?.sectors || [];
  const stockDetail = detailData || null;

  const sectorsCount = useMemo(() => new Set(stocks.map(s => s.sector)).size, [stocks]);

  const handleSelectStock = (ticker: string) => {
    setSelectedTicker(ticker);
    setActiveView('stock-detail');
  };

  const handleBack = () => {
    setSelectedTicker(null);
    setActiveView('dashboard');
  };

  const handleViewChange = (view: PageView) => {
    setActiveView(view);
    if (view !== 'stock-detail') {
      setSelectedTicker(null);
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        activeView={activeView === 'stock-detail' ? 'stocks' : activeView}
        onViewChange={handleViewChange}
        onRefresh={() => refreshMutation.mutate()}
        isRefreshing={refreshMutation.isPending}
        stocksCount={stocks.length}
        sectorsCount={sectorsCount}
      />
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="-ml-1 h-7 w-7" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>EGX</span>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground capitalize">
              {activeView === 'stock-detail' ? stockDetail?.stock?.name || selectedTicker : activeView}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {selectedTicker && activeView === 'stock-detail' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  if (isInWatchlist(selectedTicker)) {
                    removeFromWatchlist(selectedTicker);
                  } else {
                    addToWatchlist(selectedTicker);
                  }
                }}
              >
                <Star className={`w-4 h-4 ${isInWatchlist(selectedTicker) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
              </Button>
            )}
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {activeView === 'dashboard' && (
            <DashboardPage
              stocks={stocks}
              sectors={sectors}
              isLoading={stocksLoading}
              onSelectStock={handleSelectStock}
              onNavigate={handleViewChange}
            />
          )}

          {activeView === 'stocks' && (
            <StocksPage
              stocks={stocks}
              isLoading={stocksLoading}
              onSelectStock={handleSelectStock}
            />
          )}

          {activeView === 'sectors' && (
            <SectorsPage
              stocks={stocks}
              sectors={sectors}
              isLoading={stocksLoading}
              onSelectStock={handleSelectStock}
            />
          )}

          {activeView === 'watchlist' && (
            <WatchlistPage
              stocks={stocks}
              isLoading={stocksLoading}
              watchlist={watchlist}
              onRemoveFromWatchlist={removeFromWatchlist}
              onSelectStock={handleSelectStock}
            />
          )}

          {activeView === 'stock-detail' && (
            detailLoading ? <StockDetailSkeleton /> :
            stockDetail ? (
              <StockDetailPage detail={stockDetail} onBack={handleBack} />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a stock to view details</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-border/50 py-3 px-4">
          <div className="text-center text-xs text-muted-foreground/60">
            EGX Pro - Egyptian Stock Valuation Platform | All data for educational purposes only
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
