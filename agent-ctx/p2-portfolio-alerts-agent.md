# P2.1 Portfolio-Level Valuation Module & P2.4 Alerting System

## Task Summary
Implemented P2.1 (Portfolio-Level Valuation Module) and P2.4 (Alerting System) with API routes and an alert worker.

## Files Created

### API Routes (Using Supabase client)
1. **`src/app/api/portfolio/route.ts`** - Portfolio CRUD
   - GET: List all portfolios with holdings
   - POST: Create portfolio (Zod validation: name required, description optional)

2. **`src/app/api/portfolio/[id]/route.ts`** - Single portfolio operations
   - GET: Portfolio with holdings + computed valuation metrics (total value, total cost, P&L, weighted PE/PB/dividend yield, per-holding fair value via `runAllModels`)
   - DELETE: Delete portfolio (cascades holdings)

3. **`src/app/api/portfolio/[id]/holdings/route.ts`** - Holdings management
   - POST: Add holding (validates stockId, shares, avgCost; merges shares if stock already in portfolio)
   - DELETE: Remove holding (validates stockId)

4. **`src/app/api/alerts/route.ts`** - Alert CRUD
   - GET: List alerts with optional filters (stockId, type, isActive)
   - POST: Create alert (validates stockId, type enum, threshold; validates stock exists)

5. **`src/app/api/alerts/[id]/route.ts`** - Single alert operations
   - PATCH: Update alert (isActive, threshold; resets triggered when threshold changed)
   - DELETE: Delete alert

### Alert Worker (Mini Service)
6. **`mini-services/alert-worker/check-alerts.ts`** - Alert checking worker
   - Fetches active untriggered alerts from Supabase
   - Checks 4 alert types: price_target, support_breach, resistance_break, fair_value_hit
   - price_target: checks if price crossed threshold (upward or downward)
   - support_breach: checks if price <= support level (from SupportResistance table or alert threshold)
   - resistance_break: checks if price >= resistance level
   - fair_value_hit: checks if price within 5% of average fair value (from ValuationResult table)
   - Updates triggered alerts (triggered=true, isActive=false)
   - Runs every 60 seconds

7. **`mini-services/alert-worker/package.json`** - Worker package config
8. **`mini-services/alert-worker/tsconfig.json`** - Worker TypeScript config

### Modified Files
9. **`src/lib/rate-limit.ts`** - Added portfolio and alerts rate limits (30 req/min each)

## Design Decisions
- All routes use Supabase client (not Prisma), following project patterns
- Zod v4 validation on all inputs
- Rate limiting on every endpoint
- `export const dynamic = 'force-dynamic'` on all routes
- Holdings merge shares when adding an existing stock (recalculates average cost)
- Portfolio valuation computes per-holding fair values using the full 8-model valuation engine
- Alert worker uses Supabase directly (not the Next.js API) for efficiency
- Alert worker validates thresholds make sense (support below current price, resistance above)
