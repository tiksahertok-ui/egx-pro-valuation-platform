-- =============================================
-- Remove temporary anon write policies after seeding
-- Run this AFTER seeding is complete
-- =============================================

DROP POLICY IF EXISTS "Temp anon insert Stock" ON "Stock";
DROP POLICY IF EXISTS "Temp anon update Stock" ON "Stock";
DROP POLICY IF EXISTS "Temp anon insert FinancialData" ON "FinancialData";
DROP POLICY IF EXISTS "Temp anon insert SectorStats" ON "SectorStats";
DROP POLICY IF EXISTS "Temp anon update SectorStats" ON "SectorStats";
DROP POLICY IF EXISTS "Temp anon insert EconomicIndicator" ON "EconomicIndicator";
DROP POLICY IF EXISTS "Temp anon update EconomicIndicator" ON "EconomicIndicator";
DROP POLICY IF EXISTS "Temp anon insert MarketParams" ON "MarketParams";
DROP POLICY IF EXISTS "Temp anon insert PriceHistory" ON "PriceHistory";
DROP POLICY IF EXISTS "Temp anon insert TechnicalIndicator" ON "TechnicalIndicator";
DROP POLICY IF EXISTS "Temp anon insert ValuationResult" ON "ValuationResult";
DROP POLICY IF EXISTS "Temp anon insert AnalystReport" ON "AnalystReport";
