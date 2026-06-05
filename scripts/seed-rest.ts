import { createClient } from '@supabase/supabase-js';
import { EGX_STOCKS } from '../src/lib/data/egx-stocks-master';

// Using the same key but trying to disable RLS first
const supabaseUrl = 'https://efohhtmyguxxbfcxjegh.supabase.co';
const supabaseKey = 'sb_publishable_XaBRmFpzo2niyDpMN_UP_w_MnXxE6v3';

// Try with different auth configs
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedAllStocks() {
  console.log(`Seeding ${EGX_STOCKS.length} stocks...`);

  // First, try to add an RLS policy that allows inserts
  // We can't do this via REST API, so let's try using RPC if available
  
  // Try inserting one stock to see the exact error
  const testStock = EGX_STOCKS.find(s => s.ticker === 'ADIB');
  if (testStock) {
    const { data, error } = await supabase
      .from('Stock')
      .insert({
        id: `stock_${testStock.ticker.toLowerCase()}`,
        ticker: testStock.ticker,
        name: testStock.name,
        nameAr: testStock.nameAr,
        sector: testStock.sector,
        industry: testStock.industry,
        exchange: 'EGX',
        currency: 'EGP',
        listedDate: '',
        description: testStock.description,
        descriptionAr: testStock.descriptionAr,
        logo: '',
      })
      .select();
    
    console.log('Test insert result:', error ? `ERROR: ${error.message}` : `SUCCESS: ${data?.[0]?.ticker}`);
    console.log('Error code:', error?.code);
    console.log('Error details:', error?.details);
  }
  
  // Count existing
  const { count } = await supabase.from('Stock').select('*', { count: 'exact', head: true });
  console.log(`Current stock count in DB: ${count}`);
}

seedAllStocks();
