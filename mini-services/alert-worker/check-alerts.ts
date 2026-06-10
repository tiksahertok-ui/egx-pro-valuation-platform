/**
 * P2.4: Alert Worker - Checks active alerts against current market data
 *
 * This script:
 * 1. Connects to Supabase
 * 2. Fetches all active, untriggered alerts
 * 3. For each alert, checks if the condition is met:
 *    - price_target: current price >= threshold (upward) or <= threshold (downward)
 *    - support_breach: current price <= support level
 *    - resistance_break: current price >= resistance level
 *    - fair_value_hit: current price is within 5% of average fair value
 * 4. When triggered, updates the alert record (triggered=true, isActive=false)
 * 5. Logs results to console
 *
 * Run: bun run check-alerts.ts
 * Or as a service: bun --hot index.ts
 */

import { createClient } from '@supabase/supabase-js';

// ── Configuration ───────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const CHECK_INTERVAL_MS = 60_000; // Check every 60 seconds
const FAIR_VALUE_TOLERANCE = 0.05; // 5% tolerance for fair_value_hit

// ── Types ───────────────────────────────────────────────────

interface AlertRow {
  id: string;
  stockId: string;
  type: 'price_target' | 'support_breach' | 'resistance_break' | 'fair_value_hit';
  threshold: number;
  isActive: boolean;
  triggered: boolean;
  createdAt: string;
}

interface StockRow {
  id: string;
  ticker: string;
  name: string;
  price: number;
  sector: string;
  eps: number;
  bookValuePerShare: number;
  sharesOutstanding: number;
  marketCap: number;
  dividendYield: number;
  peRatio: number;
  pbRatio: number;
  beta: number;
}

interface SupportResistanceRow {
  stockId: string;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  pivot: number;
  date: string;
}

interface ValuationResultRow {
  stockId: string;
  model: string;
  fairValue: number;
  upsideDownside: number;
  confidence: number;
}

// ── Supabase Client ─────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ── Alert Checking Logic ────────────────────────────────────

/**
 * Check if a price_target alert condition is met.
 * If threshold > stock price at creation, it's an upward target (price >= threshold).
 * If threshold < stock price at creation, it's a downward target (price <= threshold).
 */
function checkPriceTarget(currentPrice: number, threshold: number, stock: StockRow): { triggered: boolean; reason: string } {
  // Heuristic: if threshold is above current price, it's an upward target
  // If threshold is below current price, it's a downward target
  // We check both directions - the simpler approach: check if price crossed the threshold
  if (currentPrice >= threshold) {
    return { triggered: true, reason: `Price ${currentPrice.toFixed(2)} reached upward target ${threshold.toFixed(2)}` };
  }
  if (currentPrice <= threshold) {
    return { triggered: true, reason: `Price ${currentPrice.toFixed(2)} fell to downward target ${threshold.toFixed(2)}` };
  }
  return { triggered: false, reason: '' };
}

/**
 * Check if a support_breach alert condition is met.
 * Triggered when current price <= threshold (support level).
 */
function checkSupportBreach(currentPrice: number, threshold: number): { triggered: boolean; reason: string } {
  if (currentPrice <= threshold) {
    return { triggered: true, reason: `Price ${currentPrice.toFixed(2)} breached support level ${threshold.toFixed(2)}` };
  }
  return { triggered: false, reason: '' };
}

/**
 * Check if a resistance_break alert condition is met.
 * Triggered when current price >= threshold (resistance level).
 */
function checkResistanceBreak(currentPrice: number, threshold: number): { triggered: boolean; reason: string } {
  if (currentPrice >= threshold) {
    return { triggered: true, reason: `Price ${currentPrice.toFixed(2)} broke resistance level ${threshold.toFixed(2)}` };
  }
  return { triggered: false, reason: '' };
}

/**
 * Check if a fair_value_hit alert condition is met.
 * Triggered when current price is within FAIR_VALUE_TOLERANCE (5%) of average fair value.
 */
function checkFairValueHit(currentPrice: number, valuationResults: ValuationResultRow[]): { triggered: boolean; reason: string } {
  if (valuationResults.length === 0) {
    return { triggered: false, reason: 'No valuation results available' };
  }

  // Calculate average fair value from all models
  const validResults = valuationResults.filter(v => v.fairValue > 0);
  if (validResults.length === 0) {
    return { triggered: false, reason: 'No valid fair value estimates' };
  }

  const avgFairValue = validResults.reduce((sum, v) => sum + v.fairValue, 0) / validResults.length;
  const lowerBound = avgFairValue * (1 - FAIR_VALUE_TOLERANCE);
  const upperBound = avgFairValue * (1 + FAIR_VALUE_TOLERANCE);

  if (currentPrice >= lowerBound && currentPrice <= upperBound) {
    return {
      triggered: true,
      reason: `Price ${currentPrice.toFixed(2)} is within 5% of fair value ${avgFairValue.toFixed(2)} (range: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
    };
  }

  return { triggered: false, reason: `Price ${currentPrice.toFixed(2)} outside fair value range (${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})` };
}

// ── Main Check Cycle ────────────────────────────────────────

async function checkAlerts(): Promise<{
  checked: number;
  triggered: number;
  errors: number;
  results: Array<{ alertId: string; stockTicker: string; type: string; triggered: boolean; reason: string }>;
}> {
  const results: Array<{ alertId: string; stockTicker: string; type: string; triggered: boolean; reason: string }> = [];
  let triggeredCount = 0;
  let errorCount = 0;

  console.log(`\n[${new Date().toISOString()}] Starting alert check cycle...`);

  try {
    // 1. Fetch all active, untriggered alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('Alert')
      .select('*')
      .eq('isActive', true)
      .eq('triggered', false);

    if (alertsError) {
      console.error('Failed to fetch alerts:', alertsError.message);
      return { checked: 0, triggered: 0, errors: 1, results: [] };
    }

    if (!alerts || alerts.length === 0) {
      console.log('No active untriggered alerts found.');
      return { checked: 0, triggered: 0, errors: 0, results: [] };
    }

    console.log(`Found ${alerts.length} active untriggered alert(s).`);

    // 2. Collect unique stockIds
    const stockIds = [...new Set(alerts.map((a: AlertRow) => a.stockId))];

    // 3. Fetch stock data for all relevant stocks
    const { data: stocks } = await supabase
      .from('Stock')
      .select('*')
      .in('id', stockIds);

    const stockMap = new Map<string, StockRow>();
    if (stocks) {
      for (const s of stocks as StockRow[]) {
        stockMap.set(s.id, s);
      }
    }

    // 4. Fetch support/resistance data for support_breach and resistance_break alerts
    const needsSR = alerts.some((a: AlertRow) => a.type === 'support_breach' || a.type === 'resistance_break');
    let srMap = new Map<string, SupportResistanceRow>();
    if (needsSR) {
      const { data: srData } = await supabase
        .from('SupportResistance')
        .select('*')
        .in('stockId', stockIds)
        .order('date', { ascending: false });

      if (srData) {
        for (const row of srData as SupportResistanceRow[]) {
          // Keep only the most recent per stock
          if (!srMap.has(row.stockId)) {
            srMap.set(row.stockId, row);
          }
        }
      }
    }

    // 5. Fetch valuation results for fair_value_hit alerts
    const needsValuation = alerts.some((a: AlertRow) => a.type === 'fair_value_hit');
    let valuationMap = new Map<string, ValuationResultRow[]>();
    if (needsValuation) {
      const { data: valData } = await supabase
        .from('ValuationResult')
        .select('stockId, model, fairValue, upsideDownside, confidence')
        .in('stockId', stockIds);

      if (valData) {
        for (const row of valData as ValuationResultRow[]) {
          if (!valuationMap.has(row.stockId)) {
            valuationMap.set(row.stockId, []);
          }
          valuationMap.get(row.stockId)!.push(row);
        }
      }
    }

    // 6. Check each alert
    for (const alert of alerts as AlertRow[]) {
      const stock = stockMap.get(alert.stockId);
      if (!stock) {
        console.warn(`  Alert ${alert.id}: Stock ${alert.stockId} not found, skipping.`);
        errorCount++;
        results.push({ alertId: alert.id, stockTicker: 'UNKNOWN', type: alert.type, triggered: false, reason: 'Stock not found' });
        continue;
      }

      const currentPrice = stock.price;
      if (!currentPrice || currentPrice <= 0) {
        console.warn(`  Alert ${alert.id}: ${stock.ticker} has no valid price (${currentPrice}), skipping.`);
        errorCount++;
        results.push({ alertId: alert.id, stockTicker: stock.ticker, type: alert.type, triggered: false, reason: 'No valid price' });
        continue;
      }

      let checkResult: { triggered: boolean; reason: string };

      switch (alert.type) {
        case 'price_target':
          checkResult = checkPriceTarget(currentPrice, alert.threshold, stock);
          break;

        case 'support_breach': {
          // Use threshold from alert; also check against S/R data if available
          const srData = srMap.get(alert.stockId);
          const supportLevel = srData ? Math.min(srData.support1, srData.support2) : alert.threshold;
          // If the alert threshold is different from S/R data, use the more conservative (lower) value
          const effectiveThreshold = srData ? Math.min(alert.threshold, supportLevel) : alert.threshold;
          checkResult = checkSupportBreach(currentPrice, effectiveThreshold);
          break;
        }

        case 'resistance_break': {
          const srData = srMap.get(alert.stockId);
          const resistanceLevel = srData ? Math.max(srData.resistance1, srData.resistance2) : alert.threshold;
          const effectiveThreshold = srData ? Math.max(alert.threshold, resistanceLevel) : alert.threshold;
          checkResult = checkResistanceBreak(currentPrice, effectiveThreshold);
          break;
        }

        case 'fair_value_hit': {
          const valResults = valuationMap.get(alert.stockId) ?? [];
          checkResult = checkFairValueHit(currentPrice, valResults);
          break;
        }

        default:
          checkResult = { triggered: false, reason: `Unknown alert type: ${alert.type}` };
          console.warn(`  Alert ${alert.id}: Unknown type "${alert.type}"`);
          errorCount++;
      }

      if (checkResult.triggered) {
        console.log(`  ✅ TRIGGERED: ${stock.ticker} - ${alert.type} - ${checkResult.reason}`);

        // Update alert in database
        const { error: updateError } = await supabase
          .from('Alert')
          .update({
            triggered: true,
            isActive: false,
          })
          .eq('id', alert.id);

        if (updateError) {
          console.error(`  ❌ Failed to update alert ${alert.id}:`, updateError.message);
          errorCount++;
        } else {
          triggeredCount++;
        }
      } else {
        console.log(`  ⏳ Not triggered: ${stock.ticker} - ${alert.type} - ${checkResult.reason || 'Condition not met'}`);
      }

      results.push({
        alertId: alert.id,
        stockTicker: stock.ticker,
        type: alert.type,
        triggered: checkResult.triggered,
        reason: checkResult.reason,
      });
    }
  } catch (err) {
    console.error('Fatal error in alert check cycle:', err);
    errorCount++;
  }

  console.log(`\nAlert check complete: ${results.length} checked, ${triggeredCount} triggered, ${errorCount} errors`);
  return { checked: results.length, triggered: triggeredCount, errors: errorCount, results };
}

// ── Entrypoint ──────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   EGX Pro Alert Worker - P2.4            ║');
  console.log('║   Checking alerts every 60 seconds        ║');
  console.log('╚══════════════════════════════════════════╝');

  // Run immediately on start
  await checkAlerts();

  // Then run on interval
  setInterval(async () => {
    await checkAlerts();
  }, CHECK_INTERVAL_MS);
}

main().catch((err) => {
  console.error('Alert worker failed to start:', err);
  process.exit(1);
});
