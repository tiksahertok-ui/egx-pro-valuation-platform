-- =============================================
-- EGX Pro Valuation Platform - Seed Data
-- Run this in Supabase SQL Editor after migration.sql
-- =============================================

-- Step 1: Insert Stocks
INSERT INTO "Stock" ("id", "ticker", "name", "nameAr", "sector", "industry", "marketCap", "price", "sharesOutstanding", "beta", "egx30Beta", "dividendYield", "peRatio", "pbRatio", "eps", "bookValuePerShare", "fiftyTwoWeekHigh", "fiftyTwoWeekLow", "avgVolume", "exchange", "currency", "listedDate", "description", "descriptionAr", "logo", "lastPriceAt", "lastFinancialsAt", "createdAt", "updatedAt")
VALUES
,
,
,
,
,
,
,
,
,
,
,
,
,
,
,
,
,
,
,
,

ON CONFLICT ("ticker") DO UPDATE SET
  "price" = EXCLUDED."price",
  "marketCap" = EXCLUDED."marketCap",
  "updatedAt" = NOW();

-- Step 2: Insert Sector Stats
INSERT INTO "SectorStats" ("id", "sector", "avgPE", "avgPB", "avgEVEbitda", "avgDivYield", "avgROE", "avgROA", "avgDebtEquity", "totalMarketCap", "numCompanies", "computedAt", "avgPS", "createdAt", "updatedAt")
VALUES
,
,
,
,
,
,
,
,
,
,
,
,

ON CONFLICT ("sector") DO UPDATE SET
  "avgPE" = EXCLUDED."avgPE",
  "updatedAt" = NOW();

-- Step 3: Insert Economic Indicators
INSERT INTO "EconomicIndicator" ("id", "name", "nameAr", "value", "previousValue", "change", "unit", "source", "date", "createdAt", "updatedAt")
VALUES
,
,
,
,
,
,
,
,

ON CONFLICT ("name", "date") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = NOW();

-- Step 4: Insert Market Params
INSERT INTO "MarketParams" ("riskFreeRate", "baseEquityRiskPremium", "countryRiskPremium", "totalEquityRiskPremium", "corporateTaxRate", "inflationRateEGP", "inflationRateUSD", "usdEgpRate", "effectiveDate", "source", "createdAt")
VALUES
(0.19, 0.045, 0.085, 0.13, 0.225, 0.149, 0.025, 51.82, NOW(), 'CBE/Damodaran', NOW());

-- Step 5: Insert Financial Data (3 years × 21 stocks)
INSERT INTO "FinancialData" ("id", "stockId", "year", "quarter", "revenue", "costOfRevenue", "grossProfit", "operatingExpenses", "operatingIncome", "ebitda", "depreciation", "interestExpense", "netIncome", "eps", "dividendsPerShare", "totalAssets", "currentAssets", "cash", "totalLiabilities", "currentLiabilities", "longTermDebt", "shortTermDebt", "totalEquity", "sharesOutstanding", "operatingCashFlow", "capitalExpenditure", "freeCashFlow", "changeInNWC", "netBorrowing", "taxRate", "dataSource", "reportingDate", "reportType", "currency", "isVerified", "lastUpdatedAt", "hasOCI", "createdAt")
VALUES

ON CONFLICT ("stockId", "year", "quarter") DO UPDATE SET
  "revenue" = EXCLUDED."revenue",
  "lastUpdatedAt" = NOW();

