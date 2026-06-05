-- =============================================
-- TEMPORARY: Allow anon writes for seeding
-- Run this FIRST in Supabase SQL Editor, then seed via API, then run remove-temp-anon-writes.sql
-- =============================================

-- Allow anon to insert/update all tables temporarily
CREATE POLICY "Temp anon insert Stock" ON "Stock" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp anon update Stock" ON "Stock" FOR UPDATE TO anon USING (true);
CREATE POLICY "Temp anon insert FinancialData" ON "FinancialData" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp anon insert SectorStats" ON "SectorStats" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp anon update SectorStats" ON "SectorStats" FOR UPDATE TO anon USING (true);
CREATE POLICY "Temp anon insert EconomicIndicator" ON "EconomicIndicator" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp anon update EconomicIndicator" ON "EconomicIndicator" FOR UPDATE TO anon USING (true);
CREATE POLICY "Temp anon insert MarketParams" ON "MarketParams" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp anon insert PriceHistory" ON "PriceHistory" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp anon insert TechnicalIndicator" ON "TechnicalIndicator" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp anon insert ValuationResult" ON "ValuationResult" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp anon insert AnalystReport" ON "AnalystReport" FOR INSERT TO anon WITH CHECK (true);
