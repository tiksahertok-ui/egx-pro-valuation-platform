---
Task ID: 1
Agent: Main
Task: Fix stock detail page errors, valuation engine, UI/UX, seed all stocks

Work Log:
- Diagnosed stock detail errors: macdHistogram vs macdHist field mismatch, null/undefined crashes with .toFixed(), sector icon mismatches
- Fixed StockDetailPanel with safeToFixed() helper and macdHistogram compatibility
- Fixed valuation engine: DCF zero-division, dividend yield decimal handling, English verdicts
- Updated SECTOR_ICONS to include all actual DB sector names (Food, Construction, Chemicals, etc.)
- Added dark mode consistency fixes for Dialog and select elements
- Fixed all API routes to match actual Supabase schema (removed isin, yahooSymbol columns)
- Added exchange/currency fields to stock inserts
- Expanded price refresh from 20 to 50 tickers
- Created SQL script for RLS INSERT policy (required for seeding new stocks)
- Build passes, pushed to GitHub

Stage Summary:
- All code fixes applied and committed
- Stock detail page should now work without crashes
- Fair value calculations fixed for edge cases
- All 21 existing stocks in DB work correctly
- 186 additional stocks from master list can't be seeded yet due to RLS policy
- User needs to run add-stock-insert-policy.sql in Supabase SQL Editor to enable seeding
- Key: sb_publishable_XaBRmFpzo2niyDpMN_UP_w_MnXxE6v3 is anon key, not service role
