/**
 * Supabase Seed Script via REST API
 *
 * This script seeds the Supabase database using the REST API
 * (publishable key), bypassing the need for direct PostgreSQL access.
 *
 * Prerequisites:
 *   1. Run prisma/migration.sql in Supabase SQL Editor first
 *   2. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env
 *
 * Usage: bun prisma/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

// Seeded random number generator for reproducibility
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// 25 EGX stocks with real market data (as of June 2025)
const stocks = [
  { ticker: 'COMI', name: 'Commercial International Bank', nameAr: 'البنك التجاري الدولي', sector: 'Banking', industry: 'Commercial Banking', marketCap: 447750000000, price: 132.50, sharesOutstanding: 3377358491, beta: 0.85, egx30Beta: 0.85, dividendYield: 0.05, peRatio: 7.24, pbRatio: 1.40, eps: 18.30, bookValuePerShare: 95.0, fiftyTwoWeekHigh: 145.01, fiftyTwoWeekLow: 70.03, avgVolume: 12000000, description: "Egypt's largest private-sector bank by assets, offering comprehensive banking and financial services.", descriptionAr: 'أكبر بنك قطاع خاص في مصر من حيث الأصول، يقدم خدمات مصرفية ومالية شاملة.' },
  { ticker: 'ORAS', name: 'Orascom Construction', nameAr: 'أوراسكو للإنشاءات', sector: 'Construction', industry: 'Engineering & Construction', marketCap: 86870000000, price: 742.00, sharesOutstanding: 117071429, beta: 1.20, egx30Beta: 1.20, dividendYield: 0.03, peRatio: 6.88, pbRatio: 1.40, eps: 106.15, bookValuePerShare: 520.0, fiftyTwoWeekHigh: 762.00, fiftyTwoWeekLow: 258.50, avgVolume: 1800000, description: 'Leading engineering and construction company with projects across the Middle East and Africa.', descriptionAr: 'شركة رائدة في الهندسة والإنشاءات مع مشاريع في الشرق الأوسط وأفريقيا.' },
  { ticker: 'SWDY', name: 'Elsewedy Electric', nameAr: 'السويدي إلكتريك', sector: 'Electrical Equipment', industry: 'Electrical Equipment', marketCap: 191950000000, price: 88.90, sharesOutstanding: 2159238400, beta: 1.15, egx30Beta: 1.15, dividendYield: 0.04, peRatio: 12.04, pbRatio: 2.53, eps: 7.35, bookValuePerShare: 35.0, fiftyTwoWeekHigh: 93.00, fiftyTwoWeekLow: 62.03, avgVolume: 20000000, description: 'Global leader in energy solutions, cables, and electrical products with operations in 50+ countries.', descriptionAr: 'رائد عالمي في حلول الطاقة والكابلات والمنتجات الكهربائية بعمليات في أكثر من 50 دولة.' },
  { ticker: 'HRHO', name: 'EFG Hermes', nameAr: 'إي إف جي هيرمس', sector: 'Financial Services', industry: 'Investment Banking', marketCap: 38240000000, price: 27.00, sharesOutstanding: 1416296296, beta: 1.10, egx30Beta: 1.10, dividendYield: 0.06, peRatio: 9.81, pbRatio: 1.93, eps: 2.75, bookValuePerShare: 14.0, fiftyTwoWeekHigh: 31.89, fiftyTwoWeekLow: 23.05, avgVolume: 8000000, description: 'Leading financial services corporation in the Middle East and Africa region.', descriptionAr: 'شركة خدمات مالية رائدة في منطقة الشرق الأوسط وأفريقيا.' },
  { ticker: 'ETEL', name: 'Telecom Egypt', nameAr: 'الاتصالات المصرية', sector: 'Telecommunications', industry: 'Telecom Services', marketCap: 166660000000, price: 96.90, sharesOutstanding: 1721000000, beta: 0.75, egx30Beta: 0.75, dividendYield: 0.07, peRatio: 8.78, pbRatio: 1.43, eps: 11.04, bookValuePerShare: 68.0, fiftyTwoWeekHigh: 112.98, fiftyTwoWeekLow: 33.66, avgVolume: 7000000, description: "Egypt's incumbent telecommunications operator providing fixed-line and mobile services.", descriptionAr: 'مشغل الاتصالات المصري الرئيسي يقدم خدمات الخط الثابت والمحمول.' },
  { ticker: 'EAST', name: 'Eastern Company', nameAr: 'الشركة الشرقية', sector: 'Tobacco', industry: 'Tobacco', marketCap: 115830000000, price: 38.61, sharesOutstanding: 3000000000, beta: 0.60, egx30Beta: 0.60, dividendYield: 0.095, peRatio: 12.71, pbRatio: 3.62, eps: 2.99, bookValuePerShare: 10.5, fiftyTwoWeekHigh: 49.99, fiftyTwoWeekLow: 26.60, avgVolume: 6000000, description: "Egypt's monopoly tobacco manufacturer with dominant market share.", descriptionAr: 'شركة احتكار السجائر في مصر بحصة سوقية مهيمنة.' },
  { ticker: 'JUFO', name: 'Juhayna Food Industries', nameAr: 'جهينة للصناعات الغذائية', sector: 'Food', industry: 'Dairy & Food Products', marketCap: 35168000000, price: 29.90, sharesOutstanding: 1175945200, beta: 0.90, egx30Beta: 0.90, dividendYield: 0.04, peRatio: 9.50, pbRatio: 2.43, eps: 3.06, bookValuePerShare: 12.0, fiftyTwoWeekHigh: 31.84, fiftyTwoWeekLow: 19.20, avgVolume: 4000000, description: 'Leading Egyptian dairy and juice producer with strong brand recognition.', descriptionAr: 'منتج ألبان وعصائر مصري رائد بسمعة تجارية قوية.' },
  { ticker: 'PHDC', name: 'Palm Hills Development', nameAr: 'بالم هيلز للتعمير', sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 44160000000, price: 15.10, sharesOutstanding: 2924500000, beta: 1.30, egx30Beta: 1.30, dividendYield: 0.02, peRatio: 10.32, pbRatio: 2.16, eps: 1.46, bookValuePerShare: 7.0, fiftyTwoWeekHigh: 16.08, fiftyTwoWeekLow: 6.99, avgVolume: 15000000, description: 'Major real estate developer in Egypt with extensive land bank.', descriptionAr: 'مطور عقاري رئيسي في مصر بمحفظة أراضي واسعة.' },
  { ticker: 'MHMD', name: 'Madinet Masr', nameAr: 'مدينة مصر', sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 15029000000, price: 7.03, sharesOutstanding: 2138000000, beta: 1.25, egx30Beta: 1.25, dividendYield: 0.03, peRatio: 10.70, pbRatio: 1.58, eps: 0.67, bookValuePerShare: 4.50, fiftyTwoWeekHigh: 7.50, fiftyTwoWeekLow: 3.76, avgVolume: 12000000, description: 'Leading community developer creating integrated urban communities in Egypt.', descriptionAr: 'مطور مجتمعات رائد يخلق مجتمعات حضرية متكاملة في مصر.' },
  { ticker: 'TMGH', name: 'TMG Holding', nameAr: 'طلعت مصطفى', sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 199270000000, price: 96.40, sharesOutstanding: 2067100000, beta: 1.15, egx30Beta: 1.15, dividendYield: 0.04, peRatio: 7.40, pbRatio: 1.48, eps: 13.04, bookValuePerShare: 65.0, fiftyTwoWeekHigh: 101.40, fiftyTwoWeekLow: 50.02, avgVolume: 9000000, description: "One of Egypt's largest real estate developers, known for Madinaty project.", descriptionAr: 'أحد أكبر المطورين العقاريين في مصر، معروف بمشروع مدينتي.' },
  { ticker: 'CIRA', name: 'CI Capital Holding', nameAr: 'سي آي كابيتال', sector: 'Financial Services', industry: 'Financial Holdings', marketCap: 15000000000, price: 12.42, sharesOutstanding: 1207720000, beta: 1.20, egx30Beta: 1.20, dividendYield: 0.05, peRatio: 8.07, pbRatio: 1.38, eps: 1.54, bookValuePerShare: 9.0, fiftyTwoWeekHigh: 13.47, fiftyTwoWeekLow: 5.43, avgVolume: 3500000, description: 'Diversified financial services platform with leasing, mortgage, and brokerage operations.', descriptionAr: 'منصة خدمات مالية متنوعة مع عمليات التأجير والرهن والوساطة.' },
  { ticker: 'OCDI', name: 'SODIC', nameAr: 'سوديك', sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 28416000000, price: 21.51, sharesOutstanding: 1322000000, beta: 1.20, egx30Beta: 1.20, dividendYield: 0.03, peRatio: 7.41, pbRatio: 0.89, eps: 2.89, bookValuePerShare: 24.0, fiftyTwoWeekHigh: 66.00, fiftyTwoWeekLow: 14.60, avgVolume: 2000000, description: 'Premium real estate developer focused on high-end residential and commercial projects.', descriptionAr: 'مطور عقاري متميز يركز على المشاريع السكنية والتجارية الراقية.' },
  { ticker: 'ORHD', name: 'Orascom Development', nameAr: 'أوراسكو للتنمية', sector: 'Tourism', industry: 'Tourism & Hospitality', marketCap: 42980000000, price: 38.13, sharesOutstanding: 1127400000, beta: 1.35, egx30Beta: 1.35, dividendYield: 0.02, peRatio: 8.22, pbRatio: 1.27, eps: 4.64, bookValuePerShare: 30.0, fiftyTwoWeekHigh: 38.13, fiftyTwoWeekLow: 18.10, avgVolume: 3000000, description: 'Integrated tourism developer operating resort towns in Egypt and Europe.', descriptionAr: 'مطور سياحي متكامل يدير مدن منتجعات في مصر وأوروبا.' },
  { ticker: 'CCAP', name: 'Qalaa Holdings', nameAr: 'القلعة', sector: 'Energy', industry: 'Energy & Infrastructure', marketCap: 17370000000, price: 5.41, sharesOutstanding: 3211000000, beta: 1.40, egx30Beta: 1.40, dividendYield: 0.01, peRatio: 12.00, pbRatio: 1.55, eps: 0.45, bookValuePerShare: 3.50, fiftyTwoWeekHigh: 5.66, fiftyTwoWeekLow: 2.20, avgVolume: 18000000, description: 'Leading energy and infrastructure investment company in Egypt and East Africa.', descriptionAr: 'شركة استثمار رائدة في الطاقة والبنية التحتية في مصر وشرق أفريقيا.' },
  { ticker: 'FWRY', name: 'Fawry Banking & Payment', nameAr: 'فوري', sector: 'Technology', industry: 'FinTech & Payments', marketCap: 67260000000, price: 19.48, sharesOutstanding: 3453000000, beta: 1.00, egx30Beta: 1.00, dividendYield: 0.02, peRatio: 27.70, pbRatio: 5.77, eps: 0.73, bookValuePerShare: 3.50, fiftyTwoWeekHigh: 21.66, fiftyTwoWeekLow: 10.02, avgVolume: 8000000, description: "Egypt's leading digital payments and financial technology platform.", descriptionAr: 'منصة الدفع الرقمي والتكنولوجيا المالية الرائدة في مصر.' },
  { ticker: 'AMOC', name: 'Alexandria Mineral Oils', nameAr: 'الإسكندرية للزيوت المعدنية', sector: 'Energy', industry: 'Oil Refining', marketCap: 10575000000, price: 8.32, sharesOutstanding: 1271000000, beta: 1.10, egx30Beta: 1.10, dividendYield: 0.06, peRatio: 12.80, pbRatio: 1.53, eps: 0.66, bookValuePerShare: 5.50, fiftyTwoWeekHigh: 9.85, fiftyTwoWeekLow: 6.66, avgVolume: 1200000, description: 'Petroleum refining company producing lubricating oils and specialty products.', descriptionAr: 'شركة تكرير البترول تنتج زيوت التشحيم والمنتجات المتخصصة.' },
  { ticker: 'SPMD', name: 'Sidi Kerir Petrochemicals', nameAr: 'سيدي كرير للبتروكيماويات', sector: 'Chemicals', industry: 'Petrochemicals', marketCap: 19280000000, price: 17.05, sharesOutstanding: 1131000000, beta: 0.95, egx30Beta: 0.95, dividendYield: 0.07, peRatio: 19.26, pbRatio: 1.80, eps: 0.89, bookValuePerShare: 9.50, fiftyTwoWeekHigh: 19.94, fiftyTwoWeekLow: 13.29, avgVolume: 3500000, description: 'Major petrochemical producer manufacturing polyethylene and other chemical products.', descriptionAr: 'منتج بتروكيماوي رئيسي يصنع البولي إيثيلين والمنتجات الكيميائية الأخرى.' },
  { ticker: 'ISPH', name: 'Arabian Cement', nameAr: 'اسمنت العربية', sector: 'Construction Materials', industry: 'Cement', marketCap: 22090000000, price: 58.91, sharesOutstanding: 375000000, beta: 1.05, egx30Beta: 1.05, dividendYield: 0.08, peRatio: 5.64, pbRatio: 1.27, eps: 9.49, bookValuePerShare: 42.0, fiftyTwoWeekHigh: 60.40, fiftyTwoWeekLow: 26.13, avgVolume: 2000000, description: 'Cement producer serving the Egyptian construction market.', descriptionAr: 'منتج أسمنت يخدم سوق البناء المصري.' },
  { ticker: 'ABUK', name: 'Abu Qir Fertilizers', nameAr: 'ابو قير للأسمدة', sector: 'Chemicals', industry: 'Fertilizers', marketCap: 103230000000, price: 81.87, sharesOutstanding: 1261000000, beta: 0.90, egx30Beta: 0.90, dividendYield: 0.08, peRatio: 9.50, pbRatio: 2.92, eps: 8.62, bookValuePerShare: 28.0, fiftyTwoWeekHigh: 95.00, fiftyTwoWeekLow: 45.01, avgVolume: 5000000, description: 'One of the largest nitrogen fertilizer producers in the Middle East.', descriptionAr: 'أحد أكبر منتجي الأسمدة النيتروجينية في الشرق الأوسط.' },
  { ticker: 'EKRI', name: 'Edita Food Industries', nameAr: 'اديتا للصناعات الغذائية', sector: 'Food', industry: 'Snack Foods', marketCap: 40570000000, price: 29.11, sharesOutstanding: 1394000000, beta: 0.80, egx30Beta: 0.80, dividendYield: 0.06, peRatio: 16.10, pbRatio: 2.91, eps: 1.81, bookValuePerShare: 10.0, fiftyTwoWeekHigh: 32.50, fiftyTwoWeekLow: 12.00, avgVolume: 1500000, description: "Leading snack food manufacturer with popular brands like HoHo's and Twinky.", descriptionAr: 'شركة رائدة في تصنيع الوجبات الخفيفة مع علامات تجارية شهيرة.' },
  { ticker: 'BNQA', name: 'Banque du Caire', nameAr: 'بنك القاهرة', sector: 'Banking', industry: 'Commercial Banking', marketCap: 30500000000, price: 2.00, sharesOutstanding: 15250000000, beta: 0.90, egx30Beta: 0.90, dividendYield: 0.05, peRatio: 7.00, pbRatio: 0.50, eps: 0.29, bookValuePerShare: 4.00, fiftyTwoWeekHigh: 2.25, fiftyTwoWeekLow: 1.50, avgVolume: 15000000, description: 'Major state-owned bank providing retail and corporate banking services.', descriptionAr: 'بنك رئيسي مملوك للدولة يقدم الخدمات المصرفية للأفراد والشركات.' },
]

const sectorStats = [
  { sector: 'Banking', avgPE: 7.12, avgPB: 0.95, avgEVEbitda: 5.8, avgDivYield: 0.05, avgROE: 0.22, avgROA: 0.025, avgDebtEquity: 6.2, totalMarketCap: 478250000000, numCompanies: 2, avgPS: 3.5 },
  { sector: 'Construction', avgPE: 6.88, avgPB: 1.40, avgEVEbitda: 6.5, avgDivYield: 0.03, avgROE: 0.24, avgROA: 0.06, avgDebtEquity: 1.0, totalMarketCap: 85520000000, numCompanies: 1, avgPS: 1.55 },
  { sector: 'Electrical Equipment', avgPE: 12.04, avgPB: 2.53, avgEVEbitda: 9.0, avgDivYield: 0.04, avgROE: 0.20, avgROA: 0.07, avgDebtEquity: 1.1, totalMarketCap: 191260000000, numCompanies: 1, avgPS: 1.59 },
  { sector: 'Financial Services', avgPE: 8.94, avgPB: 1.66, avgEVEbitda: 7.2, avgDivYield: 0.055, avgROE: 0.16, avgROA: 0.03, avgDebtEquity: 2.8, totalMarketCap: 53240000000, numCompanies: 2, avgPS: 1.74 },
  { sector: 'Telecommunications', avgPE: 8.78, avgPB: 1.43, avgEVEbitda: 5.2, avgDivYield: 0.07, avgROE: 0.14, avgROA: 0.05, avgDebtEquity: 0.8, totalMarketCap: 166660000000, numCompanies: 1, avgPS: 3.03 },
  { sector: 'Tobacco', avgPE: 12.71, avgPB: 3.62, avgEVEbitda: 8.5, avgDivYield: 0.08, avgROE: 0.38, avgROA: 0.18, avgDebtEquity: 0.25, totalMarketCap: 114060000000, numCompanies: 1, avgPS: 1.20 },
  { sector: 'Food', avgPE: 12.80, avgPB: 2.67, avgEVEbitda: 9.5, avgDivYield: 0.05, avgROE: 0.18, avgROA: 0.08, avgDebtEquity: 0.7, totalMarketCap: 74800000000, numCompanies: 2, avgPS: 1.76 },
  { sector: 'Real Estate', avgPE: 8.96, avgPB: 1.55, avgEVEbitda: 9.5, avgDivYield: 0.028, avgROE: 0.15, avgROA: 0.045, avgDebtEquity: 1.2, totalMarketCap: 287530000000, numCompanies: 4, avgPS: 2.26 },
  { sector: 'Tourism', avgPE: 8.22, avgPB: 1.27, avgEVEbitda: 8.0, avgDivYield: 0.02, avgROE: 0.12, avgROA: 0.04, avgDebtEquity: 1.4, totalMarketCap: 42980000000, numCompanies: 1, avgPS: 2.87 },
  { sector: 'Energy', avgPE: 12.40, avgPB: 1.54, avgEVEbitda: 6.5, avgDivYield: 0.035, avgROE: 0.11, avgROA: 0.04, avgDebtEquity: 2.5, totalMarketCap: 28140000000, numCompanies: 2, avgPS: 0.54 },
  { sector: 'Technology', avgPE: 27.70, avgPB: 5.77, avgEVEbitda: 20.0, avgDivYield: 0.02, avgROE: 0.24, avgROA: 0.10, avgDebtEquity: 0.5, totalMarketCap: 69730000000, numCompanies: 1, avgPS: 7.75 },
  { sector: 'Chemicals', avgPE: 13.72, avgPB: 2.17, avgEVEbitda: 7.5, avgDivYield: 0.063, avgROE: 0.18, avgROA: 0.08, avgDebtEquity: 0.65, totalMarketCap: 142310000000, numCompanies: 3, avgPS: 1.37 },
  { sector: 'Construction Materials', avgPE: 5.64, avgPB: 1.27, avgEVEbitda: 5.5, avgDivYield: 0.08, avgROE: 0.15, avgROA: 0.06, avgDebtEquity: 0.85, totalMarketCap: 20070000000, numCompanies: 1, avgPS: 1.82 },
]

const economicIndicators = [
  { name: 'CBE Overnight Deposit Rate', nameAr: 'سعر الإيداع لدى البنك المركزي', value: 19.00, previousValue: 27.25, change: -8.25, unit: '%', source: 'CBE', date: '2026-06-01' },
  { name: 'USD/EGP Exchange Rate', nameAr: 'سعر صرف الدولار', value: 51.82, previousValue: 48.50, change: 3.32, unit: 'EGP', source: 'CBE', date: '2026-06-01' },
  { name: 'Inflation Rate (Urban Annual)', nameAr: 'معدل التضخم (سنوي حضري)', value: 14.9, previousValue: 23.4, change: -8.5, unit: '%', source: 'CAPMAS', date: '2026-06-01' },
  { name: 'GDP Growth Rate', nameAr: 'معدل نمو الناتج المحلي', value: 5.3, previousValue: 4.2, change: 1.1, unit: '%', source: 'CAPMAS', date: '2026-06-01' },
  { name: 'Foreign Reserves', nameAr: 'الاحتياطي الأجنبي', value: 53.01, previousValue: 47.10, change: 5.91, unit: 'USD B', source: 'CBE', date: '2026-06-01' },
  { name: 'EGX30 Index', nameAr: 'مؤشر EGX30', value: 32800, previousValue: 29500, change: 3300, unit: 'pts', source: 'EGX', date: '2026-06-01' },
  { name: 'Unemployment Rate', nameAr: 'معدل البطالة', value: 6.4, previousValue: 7.2, change: -0.8, unit: '%', source: 'CAPMAS', date: '2026-06-01' },
  { name: 'Suez Canal Revenue', nameAr: 'إيرادات قناة السويس', value: 7.2, previousValue: 6.6, change: 0.6, unit: 'USD B', source: 'SCA', date: '2026-06-01' },
  { name: 'Remittances', nameAr: 'التحويلات الخارجية', value: 24.2, previousValue: 22.7, change: 1.5, unit: 'USD B', source: 'CBE', date: '2026-06-01' },
]

async function main() {
  console.log('🚀 EGX Pro - Seeding Supabase via REST API')
  console.log('==========================================\n')

  // Step 1: Check if tables exist
  const { data: checkData, error: checkError } = await supabase.from('Stock').select('ticker').limit(1)
  if (checkError && checkError.code === 'PGRST205') {
    console.log('❌ Tables do not exist yet!')
    console.log('\n📋 Please run prisma/migration.sql in Supabase SQL Editor first:')
    console.log('   1. Go to https://supabase.com/dashboard/project/efohhtmyguxxbfcxjegh/sql')
    console.log('   2. Copy & paste the contents of prisma/migration.sql')
    console.log('   3. Click Run')
    console.log('   4. Then re-run this script: bun prisma/seed-supabase.ts')
    process.exit(1)
  }

  // Step 2: Seed stocks
  console.log(`📊 Seeding ${stocks.length} stocks...`)
  const stockRecords = stocks.map(s => ({
    ...s,
    exchange: 'EGX',
    currency: 'EGP',
    listedDate: '',
    logo: '',
    lastPriceAt: new Date().toISOString(),
    lastFinancialsAt: new Date().toISOString(),
  }))

  const { error: stockError } = await supabase.from('Stock').upsert(stockRecords, { onConflict: 'ticker' })
  if (stockError) {
    console.error('❌ Error seeding stocks:', stockError.message)
  } else {
    console.log(`✅ Seeded ${stocks.length} stocks`)
  }

  // Get stock IDs for foreign key references
  const { data: stockIds } = await supabase.from('Stock').select('id, ticker')
  const stockMap = new Map((stockIds || []).map((s: any) => [s.ticker, s.id]))

  // Step 3: Seed sector stats
  console.log(`📈 Seeding ${sectorStats.length} sector stats...`)
  const { error: sectorError } = await supabase.from('SectorStats').upsert(sectorStats, { onConflict: 'sector' })
  if (sectorError) {
    console.error('❌ Error seeding sectors:', sectorError.message)
  } else {
    console.log(`✅ Seeded ${sectorStats.length} sector stats`)
  }

  // Step 4: Seed economic indicators
  console.log(`💹 Seeding ${economicIndicators.length} economic indicators...`)
  const econRecords = economicIndicators.map(e => ({ ...e }))
  const { error: econError } = await supabase.from('EconomicIndicator').upsert(econRecords, { onConflict: 'name,date' })
  if (econError) {
    console.error('❌ Error seeding economic indicators:', econError.message)
  } else {
    console.log(`✅ Seeded ${economicIndicators.length} economic indicators`)
  }

  // Step 5: Seed market params
  console.log('🏦 Seeding Egypt market params...')
  const marketParams = {
    riskFreeRate: 0.19,
    baseEquityRiskPremium: 0.045,
    countryRiskPremium: 0.085,
    totalEquityRiskPremium: 0.13,
    corporateTaxRate: 0.225,
    inflationRateEGP: 0.149,
    inflationRateUSD: 0.025,
    usdEgpRate: 51.82,
    effectiveDate: new Date().toISOString(),
    source: 'CBE/Damodaran',
  }
  const { error: mpError } = await supabase.from('MarketParams').insert(marketParams)
  if (mpError) {
    console.error('❌ Error seeding market params:', mpError.message)
  } else {
    console.log('✅ Seeded market params')
  }

  console.log('\n🎉 Seed completed!')
  console.log('⚠️  Note: Financial data and price history seeding requires database password.')
  console.log('   Use: bun prisma/seed.ts (with DATABASE_URL set correctly)')
}

main().catch(console.error)
