import { EGX_STOCKS } from '../src/lib/data/egx-stocks-master';
import pg from 'pg';

async function tryConnect(config: pg.ConnectionConfig): Promise<pg.Client> {
  const c = new pg.Client(config);
  await c.connect();
  return c;
}

async function seedAllStocks() {
  let client: pg.Client;
  
  // Try different connection configs
  const configs: pg.ConnectionConfig[] = [
    {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.efohhtmyguxxbfcxjegh',
      password: 'yfoJQXnZIP3FIXWM',
      ssl: { rejectUnauthorized: false },
    },
    {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.efohhtmyguxxbfcxjegh',
      password: 'yfoJQXnZIP3FIXWM',
      ssl: { rejectUnauthorized: false },
    },
    {
      connectionString: 'postgresql://postgres.efohhtmyguxxbfcxjegh:yfoJQXnZIP3FIXWM@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false },
    },
  ];

  for (const config of configs) {
    try {
      client = await tryConnect(config);
      console.log('Connected successfully!');
      break;
    } catch (err: any) {
      console.log(`Config failed: ${err.message?.substring(0, 80)}`);
      continue;
    }
  }

  if (!client!) {
    console.error('All connection attempts failed!');
    return;
  }

  console.log(`Seeding ${EGX_STOCKS.length} stocks...`);

  let created = 0;
  let existed = 0;
  let failed = 0;

  for (const stock of EGX_STOCKS) {
    try {
      const res = await client!.query('SELECT ticker FROM "Stock" WHERE ticker = $1', [stock.ticker]);
      if (res.rows.length > 0) {
        existed++;
        continue;
      }

      await client!.query(`
        INSERT INTO "Stock" (id, ticker, name, "nameAr", sector, industry, exchange, currency, "listedDate", description, "descriptionAr", logo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        `stock_${stock.ticker.toLowerCase()}`,
        stock.ticker,
        stock.name,
        stock.nameAr,
        stock.sector,
        stock.industry,
        'EGX',
        'EGP',
        '',
        stock.description,
        stock.descriptionAr,
        '',
      ]);

      created++;
      if (created % 50 === 0) console.log(`  Created ${created} stocks...`);
    } catch (err: any) {
      console.error(`Failed ${stock.ticker}: ${err?.message || err}`);
      failed++;
    }
  }

  console.log(`Done! Created: ${created}, Existed: ${existed}, Failed: ${failed}`);
  console.log(`Total in DB: ${existed + created}`);

  await client!.end();
}

seedAllStocks();
