import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';
import { runAllModels, type StockFundamentals, type SectorAverages, DEFAULT_MARKET_PARAMS } from '@/lib/valuation-engine';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    // Get stock from DB
    let stock = null;
    try {
      stock = await db.stock.findUnique({
        where: { ticker: ticker.toUpperCase() },
        include: {
          financialData: { orderBy: { year: 'desc' }, take: 5 },
          priceHistory: { orderBy: { date: 'desc' }, take: 365 },
          technicalIndicators: { orderBy: { date: 'desc' }, take: 30 },
          valuationResults: true,
        },
      });
    } catch {
      stock = null;
    }

    // Fallback to master list
    if (!stock) {
      const masterStock = EGX_STOCKS.find(s => s.ticker === ticker.toUpperCase());
      if (!masterStock) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
      }
      stock = {
        id: masterStock.ticker,
        ticker: masterStock.ticker,
        name: masterStock.name,
        nameAr: masterStock.nameAr,
        sector: masterStock.sector,
        industry: masterStock.industry,
        price: 0,
        marketCap: 0,
        peRatio: 0,
        pbRatio: 0,
        eps: 0,
        bookValuePerShare: 0,
        dividendYield: 0,
        beta: 1.0,
        sharesOutstanding: 0,
        fiftyTwoWeekHigh: 0,
        fiftyTwoWeekLow: 0,
        avgVolume: 0,
        description: masterStock.description,
        descriptionAr: masterStock.descriptionAr,
        financialData: [],
        priceHistory: [],
        technicalIndicators: [],
        valuationResults: [],
      };
    }

    // Get sector averages for valuation
    let sectorAvg: SectorAverages = {
      avgPE: 8.5, avgPB: 1.2, avgROE: 0.14, avgEVEbitda: 6.5, avgDividendYield: 5.0,
    };
    try {
      const sectorStats = await db.sectorStats.findUnique({ where: { sector: stock.sector } });
      if (sectorStats) {
        sectorAvg = {
          avgPE: sectorStats.avgPE || 8.5,
          avgPB: sectorStats.avgPB || 1.2,
          avgROE: sectorStats.avgROE || 0.14,
          avgEVEbitda: sectorStats.avgEVEbitda || 6.5,
          avgDividendYield: sectorStats.avgDividendYield || 5.0,
        };
      }
    } catch {
      // Use defaults
    }

    // Run valuation if we have enough data
    let valuation = null;
    const latestFinancial = stock.financialData?.[0];
    if (stock.price > 0 || (latestFinancial && latestFinancial.eps > 0)) {
      const fundamentals: StockFundamentals = {
        ticker: stock.ticker,
        price: stock.price,
        eps: stock.eps || latestFinancial?.eps || 0,
        bookValuePerShare: stock.bookValuePerShare || latestFinancial?.bookValuePerShare || 0,
        sharesOutstanding: stock.sharesOutstanding,
        marketCap: stock.marketCap,
        dividendYield: stock.dividendYield,
        peRatio: stock.peRatio || latestFinancial?.eps ? stock.price / latestFinancial.eps : 0,
        pbRatio: stock.pbRatio || latestFinancial?.bookValuePerShare ? stock.price / latestFinancial.bookValuePerShare : 0,
        beta: stock.beta,
        roe: latestFinancial?.roe || 0,
        roa: latestFinancial?.roa || 0,
        debtToEquity: latestFinancial?.debtToEquity || 0,
        evToEbitda: latestFinancial?.evToEbitda || 0,
        revenue: latestFinancial?.revenue || 0,
        netIncome: latestFinancial?.netIncome || 0,
        totalAssets: latestFinancial?.totalAssets || 0,
        totalEquity: latestFinancial?.totalEquity || 0,
        totalDebt: latestFinancial?.totalDebt || 0,
        operatingCashflow: latestFinancial?.operatingCashflow || 0,
        freeCashflow: latestFinancial?.freeCashflow || 0,
        grossMargin: latestFinancial?.grossMargin || 0,
        operatingMargin: latestFinancial?.operatingMargin || 0,
        profitMargin: latestFinancial?.profitMargin || 0,
        revenueGrowth: latestFinancial?.revenueGrowth || 0,
        earningsGrowth: latestFinancial?.earningsGrowth || 0,
      };

      valuation = runAllModels(fundamentals, sectorAvg, DEFAULT_MARKET_PARAMS);
    }

    return NextResponse.json({
      stock,
      valuation,
      sectorAvg,
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
