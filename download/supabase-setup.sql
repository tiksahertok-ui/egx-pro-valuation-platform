-- EGX Pro Valuation Platform - Supabase Database Setup
-- Run this SQL in the Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stocks table
CREATE TABLE IF NOT EXISTS "Stock" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticker" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "sector" TEXT NOT NULL,
  "industry" TEXT NOT NULL,
  "isin" TEXT DEFAULT '',
  "yahooSymbol" TEXT DEFAULT '',
  "marketCap" DOUBLE PRECISION DEFAULT 0,
  "price" DOUBLE PRECISION DEFAULT 0,
  "sharesOutstanding" DOUBLE PRECISION DEFAULT 0,
  "beta" DOUBLE PRECISION DEFAULT 1.0,
  "egx30Beta" DOUBLE PRECISION DEFAULT 1.0,
  "dividendYield" DOUBLE PRECISION DEFAULT 0,
  "peRatio" DOUBLE PRECISION DEFAULT 0,
  "pbRatio" DOUBLE PRECISION DEFAULT 0,
  "eps" DOUBLE PRECISION DEFAULT 0,
  "bookValuePerShare" DOUBLE PRECISION DEFAULT 0,
  "fiftyTwoWeekHigh" DOUBLE PRECISION DEFAULT 0,
  "fiftyTwoWeekLow" DOUBLE PRECISION DEFAULT 0,
  "avgVolume" DOUBLE PRECISION DEFAULT 0,
  "description" TEXT DEFAULT '',
  "descriptionAr" TEXT DEFAULT '',
  "lastPriceAt" TIMESTAMP,
  "lastFinancialsAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- FinancialData table
CREATE TABLE IF NOT EXISTS "FinancialData" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "stockId" TEXT NOT NULL REFERENCES "Stock"("id") ON DELETE CASCADE,
  "year" INTEGER NOT NULL,
  "revenue" DOUBLE PRECISION DEFAULT 0,
  "netIncome" DOUBLE PRECISION DEFAULT 0,
  "totalAssets" DOUBLE PRECISION DEFAULT 0,
  "totalEquity" DOUBLE PRECISION DEFAULT 0,
  "totalDebt" DOUBLE PRECISION DEFAULT 0,
  "operatingCashflow" DOUBLE PRECISION DEFAULT 0,
  "freeCashflow" DOUBLE PRECISION DEFAULT 0,
  "grossMargin" DOUBLE PRECISION DEFAULT 0,
  "operatingMargin" DOUBLE PRECISION DEFAULT 0,
  "profitMargin" DOUBLE PRECISION DEFAULT 0,
  "roe" DOUBLE PRECISION DEFAULT 0,
  "roa" DOUBLE PRECISION DEFAULT 0,
  "debtToEquity" DOUBLE PRECISION DEFAULT 0,
  "evToEbitda" DOUBLE PRECISION DEFAULT 0,
  "dividendPerShare" DOUBLE PRECISION DEFAULT 0,
  "eps" DOUBLE PRECISION DEFAULT 0,
  "bookValuePerShare" DOUBLE PRECISION DEFAULT 0,
  "revenueGrowth" DOUBLE PRECISION DEFAULT 0,
  "earningsGrowth" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("stockId", "year")
);

-- PriceHistory table
CREATE TABLE IF NOT EXISTS "PriceHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "stockId" TEXT NOT NULL REFERENCES "Stock"("id") ON DELETE CASCADE,
  "date" TIMESTAMP NOT NULL,
  "open" DOUBLE PRECISION NOT NULL,
  "high" DOUBLE PRECISION NOT NULL,
  "low" DOUBLE PRECISION NOT NULL,
  "close" DOUBLE PRECISION NOT NULL,
  "volume" DOUBLE PRECISION NOT NULL,
  "adjClose" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("stockId", "date")
);

-- TechnicalIndicator table
CREATE TABLE IF NOT EXISTS "TechnicalIndicator" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "stockId" TEXT NOT NULL REFERENCES "Stock"("id") ON DELETE CASCADE,
  "date" TIMESTAMP NOT NULL,
  "rsi14" DOUBLE PRECISION DEFAULT 0,
  "macdLine" DOUBLE PRECISION DEFAULT 0,
  "macdSignal" DOUBLE PRECISION DEFAULT 0,
  "macdHist" DOUBLE PRECISION DEFAULT 0,
  "bbUpper" DOUBLE PRECISION DEFAULT 0,
  "bbMiddle" DOUBLE PRECISION DEFAULT 0,
  "bbLower" DOUBLE PRECISION DEFAULT 0,
  "sma20" DOUBLE PRECISION DEFAULT 0,
  "sma50" DOUBLE PRECISION DEFAULT 0,
  "sma200" DOUBLE PRECISION DEFAULT 0,
  "ema12" DOUBLE PRECISION DEFAULT 0,
  "ema26" DOUBLE PRECISION DEFAULT 0,
  "atr14" DOUBLE PRECISION DEFAULT 0,
  "adx14" DOUBLE PRECISION DEFAULT 0,
  "stochasticK" DOUBLE PRECISION DEFAULT 0,
  "stochasticD" DOUBLE PRECISION DEFAULT 0,
  "williamsR" DOUBLE PRECISION DEFAULT 0,
  "cci14" DOUBLE PRECISION DEFAULT 0,
  "obv" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("stockId", "date")
);

-- ValuationResult table
CREATE TABLE IF NOT EXISTS "ValuationResult" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "stockId" TEXT NOT NULL REFERENCES "Stock"("id") ON DELETE CASCADE,
  "model" TEXT NOT NULL,
  "fairValue" DOUBLE PRECISION DEFAULT 0,
  "upsideDownside" DOUBLE PRECISION DEFAULT 0,
  "confidence" DOUBLE PRECISION DEFAULT 0,
  "assumptions" TEXT DEFAULT '{}',
  "calculatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("stockId", "model")
);

-- SectorStats table
CREATE TABLE IF NOT EXISTS "SectorStats" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "sector" TEXT UNIQUE NOT NULL,
  "sectorAr" TEXT DEFAULT '',
  "avgPE" DOUBLE PRECISION DEFAULT 0,
  "avgPB" DOUBLE PRECISION DEFAULT 0,
  "avgROE" DOUBLE PRECISION DEFAULT 0,
  "avgROA" DOUBLE PRECISION DEFAULT 0,
  "avgDebtEquity" DOUBLE PRECISION DEFAULT 0,
  "avgEVEbitda" DOUBLE PRECISION DEFAULT 0,
  "avgDividendYield" DOUBLE PRECISION DEFAULT 0,
  "totalMarketCap" DOUBLE PRECISION DEFAULT 0,
  "stockCount" INTEGER DEFAULT 0,
  "weightedPE" DOUBLE PRECISION DEFAULT 0,
  "weightedPB" DOUBLE PRECISION DEFAULT 0,
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- EconomicIndicator table
CREATE TABLE IF NOT EXISTS "EconomicIndicator" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "nameAr" TEXT DEFAULT '',
  "value" DOUBLE PRECISION DEFAULT 0,
  "previous" DOUBLE PRECISION DEFAULT 0,
  "change" DOUBLE PRECISION DEFAULT 0,
  "unit" TEXT DEFAULT '',
  "source" TEXT DEFAULT '',
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- MarketParams table
CREATE TABLE IF NOT EXISTS "MarketParams" (
  "id" TEXT PRIMARY KEY DEFAULT 'default',
  "riskFreeRate" DOUBLE PRECISION DEFAULT 0.18,
  "equityRiskPremium" DOUBLE PRECISION DEFAULT 0.08,
  "egx30PE" DOUBLE PRECISION DEFAULT 0,
  "inflationRate" DOUBLE PRECISION DEFAULT 0.30,
  "gdpGrowthRate" DOUBLE PRECISION DEFAULT 0.05,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- DataRefreshLog table
CREATE TABLE IF NOT EXISTS "DataRefreshLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "scope" TEXT NOT NULL,
  "stocksUpdated" INTEGER DEFAULT 0,
  "stocksFailed" INTEGER DEFAULT 0,
  "errors" TEXT DEFAULT '[]',
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP
);

-- Disable RLS (for now - enable in production with proper policies)
ALTER TABLE "Stock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TechnicalIndicator" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ValuationResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SectorStats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EconomicIndicator" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketParams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataRefreshLog" ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on Stock" ON "Stock" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on FinancialData" ON "FinancialData" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on PriceHistory" ON "PriceHistory" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on TechnicalIndicator" ON "TechnicalIndicator" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on ValuationResult" ON "ValuationResult" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on SectorStats" ON "SectorStats" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on EconomicIndicator" ON "EconomicIndicator" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on MarketParams" ON "MarketParams" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on DataRefreshLog" ON "DataRefreshLog" FOR SELECT TO anon, authenticated USING (true);

-- Allow service role full access (for API routes using service key)
CREATE POLICY "Service role full access on Stock" ON "Stock" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on FinancialData" ON "FinancialData" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on PriceHistory" ON "PriceHistory" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on TechnicalIndicator" ON "TechnicalIndicator" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on ValuationResult" ON "ValuationResult" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on SectorStats" ON "SectorStats" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on EconomicIndicator" ON "EconomicIndicator" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on MarketParams" ON "MarketParams" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on DataRefreshLog" ON "DataRefreshLog" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Insert default market params
INSERT INTO "MarketParams" ("id", "riskFreeRate", "equityRiskPremium", "inflationRate", "gdpGrowthRate")
VALUES ('default', 0.18, 0.08, 0.30, 0.05)
ON CONFLICT ("id") DO NOTHING;
