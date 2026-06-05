import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efohhtmyguxxbfcxjegh.supabase.co';
const supabaseKey = 'sb_publishable_XaBRmFpzo2niyDpMN_UP_w_MnXxE6v3';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkSchema() {
  // Get one stock to see the actual columns
  const { data, error } = await supabase.from('Stock').select('*').limit(1).single();
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log('Stock columns:', Object.keys(data));
  console.log('Sample stock:', JSON.stringify(data, null, 2));
}

checkSchema();
