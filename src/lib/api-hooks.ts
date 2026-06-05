// ============================================================
// EGX Pro - API Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { StockData, StockDetail, SectorData } from './types';

interface StocksResponse {
  stocks: StockData[];
  total: number;
  dbCount: number;
  masterCount: number;
  source: string;
}

interface SectorsResponse {
  sectors: SectorData[];
  total: number;
}

export function useStocks() {
  return useQuery<StocksResponse>({
    queryKey: ['stocks'],
    queryFn: async () => {
      const res = await fetch('/api/stocks');
      if (!res.ok) throw new Error('Failed to load stocks');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStockDetail(ticker: string | null) {
  return useQuery<StockDetail>({
    queryKey: ['stock', ticker],
    queryFn: async () => {
      if (!ticker) return null as unknown as StockDetail;
      const res = await fetch(`/api/stocks/${ticker}`);
      if (!res.ok) throw new Error('Failed to load stock data');
      return res.json();
    },
    enabled: !!ticker,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSectors() {
  return useQuery<SectorsResponse>({
    queryKey: ['sectors'],
    queryFn: async () => {
      const res = await fetch('/api/sectors');
      if (!res.ok) throw new Error('Failed to load sectors');
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useRefreshData() {
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
