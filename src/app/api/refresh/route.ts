import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EGX_STOCKS } from '@/lib/data/egx-stocks-master';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Step 1: Seed stocks to Supabase
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const stock of EGX_STOCKS) {
      try {
        // Check if stock exists
        const { data: existing } = await supabase
          .from('Stock')
          .select('id, ticker')
          .eq('ticker', stock.ticker)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('Stock')
            .insert({
              ticker: stock.ticker,
              name: stock.name,
              nameAr: stock.nameAr,
              sector: stock.sector,
              industry: stock.industry,
              isin: '',
              yahooSymbol: stock.yahooSymbol,
              description: stock.description,
              descriptionAr: stock.descriptionAr,
            });

          if (!error) {
            created++;
          } else {
            console.warn(`Failed to create ${stock.ticker}:`, error.message);
            skipped++;
          }
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    // Step 2: Try to refresh some prices from Yahoo Finance (top 20 by liquidity)
    let pricesRefreshed = 0;
    let pricesFailed = 0;
    const topTickers = ['COMI', 'ORAS', 'SWDY', 'HRHO', 'ETEL', 'EAST', 'JUFO', 'PHDC', 'TMGH', 'CCAP',
                        'FWRY', 'AMOC', 'SPMD', 'ABUK', 'EKRI', 'BNQA', 'CIRA', 'OCDI', 'ORHD', 'MHMD'];

    for (const ticker of topTickers) {
      try {
        // Get stock from Supabase to find yahooSymbol
        const { data: stockData } = await supabase
          .from('Stock')
          .select('id, yahooSymbol, fiftyTwoWeekHigh, fiftyTwoWeekLow')
          .eq('ticker', ticker)
          .single();

        if (!stockData?.yahooSymbol) continue;

        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(stockData.yahooSymbol)}?range=1d&interval=1d`;
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

    // Step 3: Update market params
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
      seed: { created, updated, skipped },
      prices: { refreshed: pricesRefreshed, failed: pricesFailed },
      totalStocks: EGX_STOCKS.length,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Refresh failed', details: (error as Error).message }, { status: 500 });
  }
}
