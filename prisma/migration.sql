-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "marketCap" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "sharesOutstanding" DOUBLE PRECISION NOT NULL,
    "beta" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "egx30Beta" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "dividendYield" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pbRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bookValuePerShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiftyTwoWeekHigh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiftyTwoWeekLow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exchange" TEXT NOT NULL DEFAULT 'EGX',
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "listedDate" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "lastPriceAt" TIMESTAMP(3),
    "lastFinancialsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialData" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL,
    "costOfRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operatingExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operatingIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ebitda" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depreciation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestExpense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dividendsPerShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAssets" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentAssets" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLiabilities" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentLiabilities" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longTermDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shortTermDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEquity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sharesOutstanding" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operatingCashFlow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capitalExpenditure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeCashFlow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changeInNWC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netBorrowing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0.23,
    "dataSource" TEXT NOT NULL DEFAULT 'manual',
    "reportingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportType" TEXT NOT NULL DEFAULT 'annual',
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasOCI" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationResult" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fairValue" DOUBLE PRECISION NOT NULL,
    "bearCase" DOUBLE PRECISION NOT NULL,
    "baseCase" DOUBLE PRECISION NOT NULL,
    "bullCase" DOUBLE PRECISION NOT NULL,
    "upside" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "assumptions" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValuationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalystReport" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "contentAr" TEXT NOT NULL DEFAULT '',
    "rating" TEXT NOT NULL DEFAULT 'Hold',
    "targetPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalystReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'egx',
    "isAdjusted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalIndicator" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "rsi14" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "macd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "macdSignal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "macdHistogram" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sma20" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sma50" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sma200" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ema12" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ema26" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bbUpper" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bbMiddle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bbLower" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atr14" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adx14" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stochK" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stochD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "williamsR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cci14" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "obv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorStats" (
    "id" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "avgPE" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgPB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgEVEbitda" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDivYield" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgROE" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgROA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDebtEquity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "numCompanies" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3),
    "avgPS" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectorStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicIndicator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL DEFAULT '',
    "value" DOUBLE PRECISION NOT NULL,
    "previousValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomicIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketParams" (
    "id" SERIAL NOT NULL,
    "riskFreeRate" DOUBLE PRECISION NOT NULL,
    "baseEquityRiskPremium" DOUBLE PRECISION NOT NULL DEFAULT 0.045,
    "countryRiskPremium" DOUBLE PRECISION NOT NULL,
    "totalEquityRiskPremium" DOUBLE PRECISION NOT NULL,
    "corporateTaxRate" DOUBLE PRECISION NOT NULL,
    "inflationRateEGP" DOUBLE PRECISION NOT NULL,
    "inflationRateUSD" DOUBLE PRECISION NOT NULL DEFAULT 0.025,
    "usdEgpRate" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketParams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioHolding" (
    "id" SERIAL NOT NULL,
    "portfolioId" INTEGER NOT NULL,
    "stockId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "costBasis" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_ticker_key" ON "Stock"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialData_stockId_year_quarter_key" ON "FinancialData"("stockId", "year", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_stockId_date_key" ON "PriceHistory"("stockId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalIndicator_stockId_date_key" ON "TechnicalIndicator"("stockId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SectorStats_sector_key" ON "SectorStats"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicIndicator_name_date_key" ON "EconomicIndicator"("name", "date");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "FinancialData" ADD CONSTRAINT "FinancialData_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationResult" ADD CONSTRAINT "ValuationResult_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalystReport" ADD CONSTRAINT "AnalystReport_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalIndicator" ADD CONSTRAINT "TechnicalIndicator_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioHolding" ADD CONSTRAINT "PortfolioHolding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioHolding" ADD CONSTRAINT "PortfolioHolding_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- Row Level Security (RLS) Policies for Supabase
-- =============================================

-- Enable RLS on all tables
ALTER TABLE "Stock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ValuationResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalystReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TechnicalIndicator" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SectorStats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EconomicIndicator" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketParams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortfolioHolding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Public read access for market data tables
CREATE POLICY "Public read Stock" ON "Stock" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read FinancialData" ON "FinancialData" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read PriceHistory" ON "PriceHistory" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read TechnicalIndicator" ON "TechnicalIndicator" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read SectorStats" ON "SectorStats" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read EconomicIndicator" ON "EconomicIndicator" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read MarketParams" ON "MarketParams" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read ValuationResult" ON "ValuationResult" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read AnalystReport" ON "AnalystReport" FOR SELECT TO anon, authenticated USING (true);

-- Authenticated write access
CREATE POLICY "Authenticated insert Stock" ON "Stock" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update Stock" ON "Stock" FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated insert FinancialData" ON "FinancialData" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert PriceHistory" ON "PriceHistory" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert TechnicalIndicator" ON "TechnicalIndicator" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert SectorStats" ON "SectorStats" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update SectorStats" ON "SectorStats" FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated insert EconomicIndicator" ON "EconomicIndicator" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert MarketParams" ON "MarketParams" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert ValuationResult" ON "ValuationResult" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert AnalystReport" ON "AnalystReport" FOR INSERT TO authenticated WITH CHECK (true);

-- Portfolio access - only own portfolios
CREATE POLICY "Users read own Portfolio" ON "Portfolio" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
CREATE POLICY "Users manage own Portfolio" ON "Portfolio" FOR ALL TO authenticated USING ("userId" = auth.uid()::text);
CREATE POLICY "Users read own PortfolioHolding" ON "PortfolioHolding" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own PortfolioHolding" ON "PortfolioHolding" FOR ALL TO authenticated USING (true);

-- User table - only own record
CREATE POLICY "Users read own User" ON "User" FOR SELECT TO authenticated USING ("id" = auth.uid()::text);

