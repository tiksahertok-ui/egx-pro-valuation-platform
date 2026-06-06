import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';
import { EGX_FINANCIAL_DATA } from '@/lib/data/egx-financial-data';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Step 1: Seed ALL stocks to Supabase using upsert for efficiency
    let created = 0;
    let skipped = 0;

    // Build upsert payload for all stocks
    const upsertPayload = EGX_STOCKS.map(stock => ({
      ticker: stock.ticker,
      name: stock.name,
      nameAr: stock.nameAr,
      sector: stock.sector,
      industry: stock.industry,
      exchange: 'EGX',
      currency: 'EGP',
      description: stock.description,
      descriptionAr: stock.descriptionAr,
    }));

    // Upsert all stocks in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < upsertPayload.length; i += BATCH_SIZE) {
      const batch = upsertPayload.slice(i, i + BATCH_SIZE);
      try {
        const { error } = await supabase
          .from('Stock')
          .upsert(batch, { onConflict: 'ticker', ignoreDuplicates: false });

        if (error) {
          console.warn(`Batch upsert failed at offset ${i}:`, error.message);
          skipped += batch.length;
        } else {
          created += batch.length;
        }
      } catch {
        skipped += batch.length;
      }
    }

    // Step 2: Update hardcoded financial data into Supabase
    let financialsUpdated = 0;
    for (const fd of EGX_FINANCIAL_DATA) {
      try {
        const updateData: Record<string, unknown> = {
          price: fd.price,
          eps: fd.eps,
          bookValuePerShare: fd.bookValuePerShare,
          peRatio: fd.peRatio,
          pbRatio: fd.pbRatio,
          marketCap: fd.marketCap,
          dividendYield: fd.dividendYield,
          beta: fd.beta,
          sharesOutstanding: fd.sharesOutstanding,
          fiftyTwoWeekHigh: fd.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: fd.fiftyTwoWeekLow,
          avgVolume: fd.avgVolume,
          lastPriceAt: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('Stock')
          .update(updateData)
          .eq('ticker', fd.ticker);

        if (!error) {
          financialsUpdated++;
        }
      } catch {
        // Continue
      }
    }

    // Step 3: Try to refresh prices from Yahoo Finance (top 30)
    let pricesRefreshed = 0;
    let pricesFailed = 0;
    const topTickers = [
      'COMI', 'TMGH', 'ORAS', 'SWDY', 'EAST', 'ETEL', 'HRHO', 'ABUK',
      'PHDC', 'MNHD', 'OCDI', 'FWRY', 'CIRA', 'ADIB', 'JUFO', 'EKRI',
      'SKPC', 'ALUM', 'ESRS', 'CCAP', 'AMOC', 'FAIT', 'MISR', 'NBEA',
      'ORHD', 'BTFH', 'SAUD', 'CIEB', 'RAYA', 'EFLS',
    ];

    for (const ticker of topTickers) {
      try {
        const yahooSymbol = `${ticker}.CA`;

        const { data: stockData } = await supabase
          .from('Stock')
          .select('id')
          .eq('ticker', ticker)
          .single();

        if (!stockData?.id) continue;

        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
        const response = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          const json = await response.json();
          const meta = json?.chart?.result?.[0]?.meta;
          if (meta?.regularMarketPrice) {
            const updateData: Record<string, unknown> = {
              price: meta.regularMarketPrice,
              lastPriceAt: new Date().toISOString(),
            };
            if (meta.fiftyTwoWeekHigh) updateData.fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh;
            if (meta.fiftyTwoWeekLow) updateData.fiftyTwoWeekLow = meta.fiftyTwoWeekLow;

            // Recalculate PE/PB if we have financial data
            const finData = EGX_FINANCIAL_DATA.find(d => d.ticker === ticker);
            if (finData) {
              updateData.peRatio = finData.eps > 0 ? meta.regularMarketPrice / finData.eps : 0;
              updateData.pbRatio = finData.bookValuePerShare > 0 ? meta.regularMarketPrice / finData.bookValuePerShare : 0;
              updateData.marketCap = finData.sharesOutstanding * meta.regularMarketPrice;
            }

            await supabase
              .from('Stock')
              .update(updateData)
              .eq('ticker', ticker);

            pricesRefreshed++;
          } else {
            pricesFailed++;
          }
        } else {
          pricesFailed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch {
        pricesFailed++;
      }
    }

    // Step 4: Update market params
    try {
      const { data: existingParams } = await supabase
        .from('MarketParams')
        .select('id')
        .eq('id', 'default')
        .single();

      if (!existingParams) {
        await supabase.from('MarketParams').insert({
          id: 'default',
          riskFreeRate: 0.18,
          equityRiskPremium: 0.08,
          inflationRate: 0.30,
          gdpGrowthRate: 0.05,
        });
      }
    } catch {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      seed: { created, skipped },
      financials: { updated: financialsUpdated, total: EGX_FINANCIAL_DATA.length },
      prices: { refreshed: pricesRefreshed, failed: pricesFailed },
      totalStocks: EGX_STOCKS.length,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Refresh failed', details: (error as Error).message }, { status: 500 });
  }
}
