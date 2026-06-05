import { createClient } from '@supabase/supabase-js';
import { EGX_STOCKS } from '../src/lib/data/egx-stocks-master';

const supabaseUrl = 'https://efohhtmyguxxbfcxjegh.supabase.co';
const supabaseKey = 'sb_publishable_XaBRmFpzo2niyDpMN_UP_w_MnXxE6v3';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedAllStocks() {
  console.log(`Seeding ${EGX_STOCKS.length} stocks...`);
  
  let created = 0;
  let existed = 0;
  let failed = 0;

  for (const stock of EGX_STOCKS) {
    try {
      const { data: existing } = await supabase
        .from('Stock')
        .select('ticker')
        .eq('ticker', stock.ticker)
        .single();

      if (existing) {
        existed++;
        continue;
      }

      // Only insert columns that exist in the actual schema:
      // id, ticker, name, nameAr, sector, industry, marketCap, price, sharesOutstanding,
      // beta, egx30Beta, dividendYield, peRatio, pbRatio, eps, bookValuePerShare,
      // fiftyTwoWeekHigh, fiftyTwoWeekLow, avgVolume, exchange, currency, listedDate,
      // description, descriptionAr, logo, lastPriceAt, lastFinancialsAt
      const { error } = await supabase
        .from('Stock')
        .insert({
          id: `stock_${stock.ticker.toLowerCase()}`,
          ticker: stock.ticker,
          name: stock.name,
          nameAr: stock.nameAr,
          sector: stock.sector,
          industry: stock.industry,
          exchange: 'EGX',
          currency: 'EGP',
          listedDate: '',
          description: stock.description,
          descriptionAr: stock.descriptionAr,
          logo: '',
        });

      if (error) {
        console.error(`Failed ${stock.ticker}: ${error.message}`);
        failed++;
      } else {
        created++;
        if (created % 20 === 0) console.log(`  Created ${created} stocks so far...`);
      }
    } catch (err: any) {
      console.error(`Error ${stock.ticker}: ${err?.message || err}`);
      failed++;
    }
  }

  console.log(`Done! Created: ${created}, Existed: ${existed}, Failed: ${failed}`);
  console.log(`Total stocks in DB should now be: ${existed + created}`);
}

seedAllStocks();
