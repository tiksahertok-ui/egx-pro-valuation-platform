/**
 * Macro Data Access Layer
 * Reads economic indicators from the EconomicIndicator table via Supabase.
 * Provides live macro inputs (risk-free rate, USD/EGP, inflation) to valuation models.
 */

import { supabase } from '@/lib/supabase';

export interface MacroData {
  rf: number;          // Risk-free rate (CBE overnight deposit rate)
  usdegp: number;      // USD/EGP exchange rate
  inflation: number;   // Annual CPI inflation rate
  erp: number;         // Equity risk premium for Egypt
  fetchedAt: Date | null;
}

const DEFAULT_MACRO: MacroData = {
  rf: 0.19,          // CBE overnight deposit rate = 19.0% (May 2026)
  usdegp: 51.89,     // USD/EGP
  inflation: 0.134,  // Annual CPI inflation = 13.4% (Feb 2026)
  erp: 0.085,        // Egypt equity risk premium = 8.5%
  fetchedAt: null,
};

let _cachedMacro: MacroData | null = null;
let _cacheTimestamp: number = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function getLatestMacro(): Promise<MacroData> {
  // Check in-memory cache
  if (_cachedMacro && Date.now() - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedMacro;
  }

  try {
    const { data, error } = await supabase
      .from('EconomicIndicator')
      .select('*');

    if (error || !data || data.length === 0) {
      return DEFAULT_MACRO;
    }

    const indicators = data as Array<Record<string, unknown>>;
    const findIndicator = (name: string) => {
      const ind = indicators.find(i =>
        (i.name as string)?.toLowerCase().includes(name.toLowerCase())
      );
      return ind ? { value: (ind.value as number) ?? 0, fetchedAt: (ind.fetchedAt as string) ?? null } : null;
    };

    const rfData = findIndicator('cbe') || findIndicator('risk free') || findIndicator('overnight');
    const fxData = findIndicator('usd/egp') || findIndicator('exchange') || findIndicator('usd');
    const infData = findIndicator('inflation') || findIndicator('cpi');
    const erpData = findIndicator('equity risk') || findIndicator('erp') || findIndicator('risk premium');

    const macro: MacroData = {
      rf: rfData?.value ? rfData.value / 100 : DEFAULT_MACRO.rf,
      usdegp: fxData?.value || DEFAULT_MACRO.usdegp,
      inflation: infData?.value ? infData.value / 100 : DEFAULT_MACRO.inflation,
      erp: erpData?.value ? erpData.value / 100 : DEFAULT_MACRO.erp,
      fetchedAt: rfData?.fetchedAt ? new Date(rfData.fetchedAt) : null,
    };

    _cachedMacro = macro;
    _cacheTimestamp = Date.now();
    return macro;
  } catch {
    return DEFAULT_MACRO;
  }
}

export function getMacroSync(): MacroData {
  return _cachedMacro || DEFAULT_MACRO;
}

/**
 * Check if macro data is stale (>7 days old)
 */
export function isMacroStale(macro: MacroData): boolean {
  if (!macro.fetchedAt) return true;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(macro.fetchedAt) < sevenDaysAgo;
}
