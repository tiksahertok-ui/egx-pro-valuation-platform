import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seeded random number generator for reproducibility
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface StockDefinition {
  ticker: string;
  name: string;
  nameAr: string;
  sector: string;
  industry: string;
  marketCap: number;
  price: number;
  sharesOutstanding: number;
  beta: number;
  dividendYield: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  bookValuePerShare: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: number;
  description: string;
  descriptionAr: string;
  // Financial baseline (representative of FY2025)
  revenue: number;
  costOfRevenuePct: number; // % of revenue
  operatingExpensesPct: number; // % of gross profit
  depreciationPct: number; // % of revenue
  interestExpense: number;
  taxRate: number;
  totalAssets: number;
  currentAssetsPct: number; // % of total assets
  cashPct: number; // % of current assets
  totalLiabilitiesPct: number; // % of total assets
  currentLiabilitiesPct: number; // % of total liabilities
  longTermDebtPct: number; // % of total liabilities
  shortTermDebtPct: number; // % of total liabilities
  totalEquity: number;
  capexPct: number; // % of revenue
  nwcChangePct: number; // % of revenue
  netBorrowingPct: number; // % of capex
  revenueGrowthRate: number; // annual growth
}

const stocks: StockDefinition[] = [
  {
    ticker: 'COMI', name: 'Commercial International Bank', nameAr: 'البنك التجاري الدولي',
    sector: 'Banking', industry: 'Commercial Banking', marketCap: 447750000000, price: 132.50,
    sharesOutstanding: 3377358491, beta: 0.85, dividendYield: 0.05, peRatio: 7.24,
    pbRatio: 1.40, eps: 18.30, bookValuePerShare: 95.0, fiftyTwoWeekHigh: 145.01, fiftyTwoWeekLow: 70.03,
    avgVolume: 12000000, description: 'Egypt\'s largest private-sector bank by assets, offering comprehensive banking and financial services.',
    descriptionAr: 'أكبر بنك قطاع خاص في مصر من حيث الأصول، يقدم خدمات مصرفية ومالية شاملة.',
    revenue: 95000000000, costOfRevenuePct: 0.25, operatingExpensesPct: 0.42,
    depreciationPct: 0.015, interestExpense: 32000000000, taxRate: 0.225,
    totalAssets: 1800000000000, currentAssetsPct: 0.65, cashPct: 0.25,
    totalLiabilitiesPct: 0.88, currentLiabilitiesPct: 0.75, longTermDebtPct: 0.12,
    shortTermDebtPct: 0.08, totalEquity: 216000000000, capexPct: 0.02,
    nwcChangePct: 0.005, netBorrowingPct: 0.5, revenueGrowthRate: 0.20
  },
  {
    ticker: 'ORAS', name: 'Orascom Construction', nameAr: 'أوراسكو للإنشاءات',
    sector: 'Construction', industry: 'Engineering & Construction', marketCap: 86870000000, price: 742.00,
    sharesOutstanding: 117071429, beta: 1.20, dividendYield: 0.03, peRatio: 6.88,
    pbRatio: 1.40, eps: 106.15, bookValuePerShare: 520.0, fiftyTwoWeekHigh: 762.00, fiftyTwoWeekLow: 258.50,
    avgVolume: 1800000, description: 'Leading engineering and construction company with projects across the Middle East and Africa.',
    descriptionAr: 'شركة رائدة في الهندسة والإنشاءات مع مشاريع في الشرق الأوسط وأفريقيا.',
    revenue: 55000000000, costOfRevenuePct: 0.72, operatingExpensesPct: 0.33,
    depreciationPct: 0.025, interestExpense: 1200000000, taxRate: 0.225,
    totalAssets: 95000000000, currentAssetsPct: 0.72, cashPct: 0.20,
    totalLiabilitiesPct: 0.62, currentLiabilitiesPct: 0.58, longTermDebtPct: 0.22,
    shortTermDebtPct: 0.12, totalEquity: 36100000000, capexPct: 0.05,
    nwcChangePct: 0.025, netBorrowingPct: 0.4, revenueGrowthRate: 0.15
  },
  {
    ticker: 'SWDY', name: 'Elsewedy Electric', nameAr: 'السويدي إلكتريك',
    sector: 'Electrical Equipment', industry: 'Electrical Equipment', marketCap: 191950000000, price: 88.90,
    sharesOutstanding: 2159238400, beta: 1.15, dividendYield: 0.04, peRatio: 12.04,
    pbRatio: 2.53, eps: 7.35, bookValuePerShare: 35.0, fiftyTwoWeekHigh: 93.00, fiftyTwoWeekLow: 62.03,
    avgVolume: 20000000, description: 'Global leader in energy solutions, cables, and electrical products with operations in 50+ countries.',
    descriptionAr: 'رائد عالمي في حلول الطاقة والكابلات والمنتجات الكهربائية بعمليات في أكثر من 50 دولة.',
    revenue: 120000000000, costOfRevenuePct: 0.70, operatingExpensesPct: 0.28,
    depreciationPct: 0.035, interestExpense: 3500000000, taxRate: 0.225,
    totalAssets: 170000000000, currentAssetsPct: 0.60, cashPct: 0.18,
    totalLiabilitiesPct: 0.65, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.18, totalEquity: 59500000000, capexPct: 0.07,
    nwcChangePct: 0.035, netBorrowingPct: 0.5, revenueGrowthRate: 0.18
  },
  {
    ticker: 'HRHO', name: 'EFG Hermes', nameAr: 'إي إف جي هيرمس',
    sector: 'Financial Services', industry: 'Investment Banking', marketCap: 38240000000, price: 27.00,
    sharesOutstanding: 1416296296, beta: 1.10, dividendYield: 0.06, peRatio: 9.81,
    pbRatio: 1.93, eps: 2.75, bookValuePerShare: 14.0, fiftyTwoWeekHigh: 31.89, fiftyTwoWeekLow: 23.05,
    avgVolume: 8000000, description: 'Leading financial services corporation in the Middle East and Africa region.',
    descriptionAr: 'شركة خدمات مالية رائدة في منطقة الشرق الأوسط وأفريقيا.',
    revenue: 22000000000, costOfRevenuePct: 0.35, operatingExpensesPct: 0.38,
    depreciationPct: 0.02, interestExpense: 3500000000, taxRate: 0.225,
    totalAssets: 150000000000, currentAssetsPct: 0.75, cashPct: 0.30,
    totalLiabilitiesPct: 0.80, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.15,
    shortTermDebtPct: 0.15, totalEquity: 30000000000, capexPct: 0.04,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.16
  },
  {
    ticker: 'ETEL', name: 'Telecom Egypt', nameAr: 'الاتصالات المصرية',
    sector: 'Telecommunications', industry: 'Telecom Services', marketCap: 166660000000, price: 96.90,
    sharesOutstanding: 1721000000, beta: 0.75, dividendYield: 0.07, peRatio: 8.78,
    pbRatio: 1.43, eps: 11.04, bookValuePerShare: 68.0, fiftyTwoWeekHigh: 112.98, fiftyTwoWeekLow: 33.66,
    avgVolume: 7000000, description: 'Egypt\'s incumbent telecommunications operator providing fixed-line and mobile services.',
    descriptionAr: 'مشغل الاتصالات المصري الرئيسي يقدم خدمات الخط الثابت والمحمول.',
    revenue: 55000000000, costOfRevenuePct: 0.52, operatingExpensesPct: 0.28,
    depreciationPct: 0.12, interestExpense: 2500000000, taxRate: 0.225,
    totalAssets: 130000000000, currentAssetsPct: 0.30, cashPct: 0.25,
    totalLiabilitiesPct: 0.50, currentLiabilitiesPct: 0.40, longTermDebtPct: 0.35,
    shortTermDebtPct: 0.20, totalEquity: 65000000000, capexPct: 0.18,
    nwcChangePct: 0.02, netBorrowingPct: 0.5, revenueGrowthRate: 0.10
  },
  {
    ticker: 'EAST', name: 'Eastern Company', nameAr: 'الشركة الشرقية',
    sector: 'Tobacco', industry: 'Tobacco', marketCap: 115830000000, price: 38.61,
    sharesOutstanding: 3000000000, beta: 0.60, dividendYield: 0.095, peRatio: 12.71,
    pbRatio: 3.62, eps: 2.99, bookValuePerShare: 10.5, fiftyTwoWeekHigh: 49.99, fiftyTwoWeekLow: 26.60,
    avgVolume: 6000000, description: 'Egypt\'s monopoly tobacco manufacturer with dominant market share.',
    descriptionAr: 'شركة احتكار السجائر في مصر بحصة سوقية مهيمنة.',
    revenue: 95000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.18,
    depreciationPct: 0.03, interestExpense: 300000000, taxRate: 0.35,
    totalAssets: 75000000000, currentAssetsPct: 0.50, cashPct: 0.30,
    totalLiabilitiesPct: 0.40, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.08,
    shortTermDebtPct: 0.18, totalEquity: 45000000000, capexPct: 0.05,
    nwcChangePct: 0.01, netBorrowingPct: 0.2, revenueGrowthRate: 0.12
  },
  {
    ticker: 'JUFO', name: 'Juhayna Food Industries', nameAr: 'جهينة للصناعات الغذائية',
    sector: 'Food', industry: 'Dairy & Food Products', marketCap: 35168000000, price: 29.90,
    sharesOutstanding: 1175945200, beta: 0.90, dividendYield: 0.04, peRatio: 9.50,
    pbRatio: 2.43, eps: 3.06, bookValuePerShare: 12.0, fiftyTwoWeekHigh: 31.84, fiftyTwoWeekLow: 19.20,
    avgVolume: 4000000, description: 'Leading Egyptian dairy and juice producer with strong brand recognition.',
    descriptionAr: 'منتج ألبان وعصائر مصري رائد بسمعة تجارية قوية.',
    revenue: 28000000000, costOfRevenuePct: 0.65, operatingExpensesPct: 0.28,
    depreciationPct: 0.04, interestExpense: 900000000, taxRate: 0.225,
    totalAssets: 32000000000, currentAssetsPct: 0.45, cashPct: 0.15,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.58, longTermDebtPct: 0.22,
    shortTermDebtPct: 0.14, totalEquity: 14400000000, capexPct: 0.10,
    nwcChangePct: 0.03, netBorrowingPct: 0.4, revenueGrowthRate: 0.14
  },
  {
    ticker: 'PHDC', name: 'Palm Hills Development', nameAr: 'بالم هيلز للتعمير',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 44160000000, price: 15.10,
    sharesOutstanding: 2924500000, beta: 1.30, dividendYield: 0.02, peRatio: 10.32,
    pbRatio: 2.16, eps: 1.46, bookValuePerShare: 7.0, fiftyTwoWeekHigh: 16.08, fiftyTwoWeekLow: 6.99,
    avgVolume: 15000000, description: 'Major real estate developer in Egypt with extensive land bank.',
    descriptionAr: 'مطور عقاري رئيسي في مصر بمحفظة أراضي واسعة.',
    revenue: 22000000000, costOfRevenuePct: 0.58, operatingExpensesPct: 0.23,
    depreciationPct: 0.02, interestExpense: 1800000000, taxRate: 0.225,
    totalAssets: 70000000000, currentAssetsPct: 0.55, cashPct: 0.12,
    totalLiabilitiesPct: 0.70, currentLiabilitiesPct: 0.45, longTermDebtPct: 0.28,
    shortTermDebtPct: 0.22, totalEquity: 21000000000, capexPct: 0.12,
    nwcChangePct: 0.05, netBorrowingPct: 0.6, revenueGrowthRate: 0.25
  },
  {
    ticker: 'MHMD', name: 'Madinet Masr', nameAr: 'مدينة مصر',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 15029000000, price: 7.03,
    sharesOutstanding: 2138000000, beta: 1.25, dividendYield: 0.03, peRatio: 10.70,
    pbRatio: 1.58, eps: 0.67, bookValuePerShare: 4.50, fiftyTwoWeekHigh: 7.50, fiftyTwoWeekLow: 3.76,
    avgVolume: 12000000, description: 'Leading community developer creating integrated urban communities in Egypt.',
    descriptionAr: 'مطور مجتمعات رائد يخلق مجتمعات حضرية متكاملة في مصر.',
    revenue: 38000000000, costOfRevenuePct: 0.58, operatingExpensesPct: 0.24,
    depreciationPct: 0.02, interestExpense: 2200000000, taxRate: 0.225,
    totalAssets: 95000000000, currentAssetsPct: 0.50, cashPct: 0.10,
    totalLiabilitiesPct: 0.65, currentLiabilitiesPct: 0.45, longTermDebtPct: 0.28,
    shortTermDebtPct: 0.22, totalEquity: 33250000000, capexPct: 0.15,
    nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.28
  },
  {
    ticker: 'TMGH', name: 'TMG Holding', nameAr: 'طلعت مصطفى',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 199270000000, price: 96.40,
    sharesOutstanding: 2067100000, beta: 1.15, dividendYield: 0.04, peRatio: 7.40,
    pbRatio: 1.48, eps: 13.04, bookValuePerShare: 65.0, fiftyTwoWeekHigh: 101.40, fiftyTwoWeekLow: 50.02,
    avgVolume: 9000000, description: 'One of Egypt\'s largest real estate developers, known for Madinaty project.',
    descriptionAr: 'أحد أكبر المطورين العقاريين في مصر، معروف بمشروع مدينتي.',
    revenue: 65000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.20,
    depreciationPct: 0.02, interestExpense: 3000000000, taxRate: 0.225,
    totalAssets: 160000000000, currentAssetsPct: 0.50, cashPct: 0.12,
    totalLiabilitiesPct: 0.58, currentLiabilitiesPct: 0.42, longTermDebtPct: 0.28,
    shortTermDebtPct: 0.22, totalEquity: 67200000000, capexPct: 0.14,
    nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.22
  },
  {
    ticker: 'CIRA', name: 'CI Capital Holding', nameAr: 'سي آي كابيتال',
    sector: 'Financial Services', industry: 'Financial Holdings', marketCap: 15000000000, price: 12.42,
    sharesOutstanding: 1207720000, beta: 1.20, dividendYield: 0.05, peRatio: 8.07,
    pbRatio: 1.38, eps: 1.54, bookValuePerShare: 9.0, fiftyTwoWeekHigh: 13.47, fiftyTwoWeekLow: 5.43,
    avgVolume: 3500000, description: 'Diversified financial services platform with leasing, mortgage, and brokerage operations.',
    descriptionAr: 'منصة خدمات مالية متنوعة مع عمليات التأجير والرهن والوساطة.',
    revenue: 10000000000, costOfRevenuePct: 0.40, operatingExpensesPct: 0.33,
    depreciationPct: 0.02, interestExpense: 2500000000, taxRate: 0.225,
    totalAssets: 60000000000, currentAssetsPct: 0.70, cashPct: 0.20,
    totalLiabilitiesPct: 0.75, currentLiabilitiesPct: 0.65, longTermDebtPct: 0.18,
    shortTermDebtPct: 0.14, totalEquity: 15000000000, capexPct: 0.03,
    nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.18
  },
  {
    ticker: 'OCDI', name: 'SODIC', nameAr: 'سوديك',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 28416000000, price: 21.51,
    sharesOutstanding: 1322000000, beta: 1.20, dividendYield: 0.03, peRatio: 7.41,
    pbRatio: 0.89, eps: 2.89, bookValuePerShare: 24.0, fiftyTwoWeekHigh: 66.00, fiftyTwoWeekLow: 14.60,
    avgVolume: 2000000, description: 'Premium real estate developer focused on high-end residential and commercial projects.',
    descriptionAr: 'مطور عقاري متميز يركز على المشاريع السكنية والتجارية الراقية.',
    revenue: 28000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.20,
    depreciationPct: 0.02, interestExpense: 1500000000, taxRate: 0.225,
    totalAssets: 80000000000, currentAssetsPct: 0.50, cashPct: 0.12,
    totalLiabilitiesPct: 0.58, currentLiabilitiesPct: 0.42, longTermDebtPct: 0.28,
    shortTermDebtPct: 0.22, totalEquity: 33600000000, capexPct: 0.13,
    nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.20
  },
  {
    ticker: 'ORHD', name: 'Orascom Development', nameAr: 'أوراسكو للتنمية',
    sector: 'Tourism', industry: 'Tourism & Hospitality', marketCap: 42980000000, price: 38.13,
    sharesOutstanding: 1127400000, beta: 1.35, dividendYield: 0.02, peRatio: 8.22,
    pbRatio: 1.27, eps: 4.64, bookValuePerShare: 30.0, fiftyTwoWeekHigh: 38.13, fiftyTwoWeekLow: 18.10,
    avgVolume: 3000000, description: 'Integrated tourism developer operating resort towns in Egypt and Europe.',
    descriptionAr: 'مطور سياحي متكامل يدير مدن منتجعات في مصر وأوروبا.',
    revenue: 15000000000, costOfRevenuePct: 0.60, operatingExpensesPct: 0.26,
    depreciationPct: 0.04, interestExpense: 1200000000, taxRate: 0.225,
    totalAssets: 50000000000, currentAssetsPct: 0.35, cashPct: 0.15,
    totalLiabilitiesPct: 0.62, currentLiabilitiesPct: 0.40, longTermDebtPct: 0.32,
    shortTermDebtPct: 0.22, totalEquity: 19000000000, capexPct: 0.12,
    nwcChangePct: 0.03, netBorrowingPct: 0.5, revenueGrowthRate: 0.18
  },
  {
    ticker: 'CCAP', name: 'Qalaa Holdings', nameAr: 'القلعة',
    sector: 'Energy', industry: 'Energy & Infrastructure', marketCap: 17370000000, price: 5.41,
    sharesOutstanding: 3211000000, beta: 1.40, dividendYield: 0.01, peRatio: 12.00,
    pbRatio: 1.55, eps: 0.45, bookValuePerShare: 3.50, fiftyTwoWeekHigh: 5.66, fiftyTwoWeekLow: 2.20,
    avgVolume: 18000000, description: 'Leading energy and infrastructure investment company in Egypt and East Africa.',
    descriptionAr: 'شركة استثمار رائدة في الطاقة والبنية التحتية في مصر وشرق أفريقيا.',
    revenue: 35000000000, costOfRevenuePct: 0.75, operatingExpensesPct: 0.28,
    depreciationPct: 0.06, interestExpense: 4500000000, taxRate: 0.225,
    totalAssets: 105000000000, currentAssetsPct: 0.30, cashPct: 0.12,
    totalLiabilitiesPct: 0.78, currentLiabilitiesPct: 0.35, longTermDebtPct: 0.38,
    shortTermDebtPct: 0.22, totalEquity: 23100000000, capexPct: 0.15,
    nwcChangePct: 0.04, netBorrowingPct: 0.6, revenueGrowthRate: 0.22
  },
  {
    ticker: 'FWRY', name: 'Fawry Banking & Payment', nameAr: 'فوري',
    sector: 'Technology', industry: 'FinTech & Payments', marketCap: 67260000000, price: 19.48,
    sharesOutstanding: 3453000000, beta: 1.00, dividendYield: 0.02, peRatio: 27.70,
    pbRatio: 5.77, eps: 0.73, bookValuePerShare: 3.50, fiftyTwoWeekHigh: 21.66, fiftyTwoWeekLow: 10.02,
    avgVolume: 8000000, description: 'Egypt\'s leading digital payments and financial technology platform.',
    descriptionAr: 'منصة الدفع الرقمي والتكنولوجيا المالية الرائدة في مصر.',
    revenue: 9000000000, costOfRevenuePct: 0.42, operatingExpensesPct: 0.33,
    depreciationPct: 0.03, interestExpense: 350000000, taxRate: 0.225,
    totalAssets: 22000000000, currentAssetsPct: 0.65, cashPct: 0.35,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.08,
    shortTermDebtPct: 0.18, totalEquity: 9900000000, capexPct: 0.08,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.35
  },
  {
    ticker: 'AMOC', name: 'Alexandria Mineral Oils', nameAr: 'الإسكندرية للزيوت المعدنية',
    sector: 'Energy', industry: 'Oil Refining', marketCap: 10575000000, price: 8.32,
    sharesOutstanding: 1271000000, beta: 1.10, dividendYield: 0.06, peRatio: 12.80,
    pbRatio: 1.53, eps: 0.66, bookValuePerShare: 5.50, fiftyTwoWeekHigh: 9.85, fiftyTwoWeekLow: 6.66,
    avgVolume: 1200000, description: 'Petroleum refining company producing lubricating oils and specialty products.',
    descriptionAr: 'شركة تكرير البترول تنتج زيوت التشحيم والمنتجات المتخصصة.',
    revenue: 30000000000, costOfRevenuePct: 0.80, operatingExpensesPct: 0.22,
    depreciationPct: 0.04, interestExpense: 700000000, taxRate: 0.225,
    totalAssets: 25000000000, currentAssetsPct: 0.40, cashPct: 0.15,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.18, totalEquity: 11250000000, capexPct: 0.08,
    nwcChangePct: 0.03, netBorrowingPct: 0.4, revenueGrowthRate: 0.10
  },
  {
    ticker: 'SPMD', name: 'Sidi Kerir Petrochemicals', nameAr: 'سيدي كرير للبتروكيماويات',
    sector: 'Chemicals', industry: 'Petrochemicals', marketCap: 19280000000, price: 17.05,
    sharesOutstanding: 1131000000, beta: 0.95, dividendYield: 0.07, peRatio: 19.26,
    pbRatio: 1.80, eps: 0.89, bookValuePerShare: 9.50, fiftyTwoWeekHigh: 19.94, fiftyTwoWeekLow: 13.29,
    avgVolume: 3500000, description: 'Major petrochemical producer manufacturing polyethylene and other chemical products.',
    descriptionAr: 'منتج بتروكيماوي رئيسي يصنع البولي إيثيلين والمنتجات الكيميائية الأخرى.',
    revenue: 28000000000, costOfRevenuePct: 0.72, operatingExpensesPct: 0.20,
    depreciationPct: 0.05, interestExpense: 800000000, taxRate: 0.225,
    totalAssets: 38000000000, currentAssetsPct: 0.40, cashPct: 0.18,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.18, totalEquity: 17100000000, capexPct: 0.10,
    nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.12
  },
  {
    ticker: 'ISPH', name: 'Arabian Cement', nameAr: 'اسمنت العربية',
    sector: 'Construction Materials', industry: 'Cement', marketCap: 22090000000, price: 58.91,
    sharesOutstanding: 375000000, beta: 1.05, dividendYield: 0.08, peRatio: 5.64,
    pbRatio: 1.27, eps: 9.49, bookValuePerShare: 42.0, fiftyTwoWeekHigh: 60.40, fiftyTwoWeekLow: 26.13,
    avgVolume: 2000000, description: 'Cement producer serving the Egyptian construction market.',
    descriptionAr: 'منتج أسمنت يخدم سوق البناء المصري.',
    revenue: 11000000000, costOfRevenuePct: 0.68, operatingExpensesPct: 0.23,
    depreciationPct: 0.06, interestExpense: 500000000, taxRate: 0.225,
    totalAssets: 18000000000, currentAssetsPct: 0.35, cashPct: 0.15,
    totalLiabilitiesPct: 0.52, currentLiabilitiesPct: 0.48, longTermDebtPct: 0.28,
    shortTermDebtPct: 0.18, totalEquity: 8640000000, capexPct: 0.08,
    nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.08
  },
  {
    ticker: 'ABUK', name: 'Abu Qir Fertilizers', nameAr: 'ابو قير للأسمدة',
    sector: 'Chemicals', industry: 'Fertilizers', marketCap: 103230000000, price: 81.87,
    sharesOutstanding: 1261000000, beta: 0.90, dividendYield: 0.08, peRatio: 9.50,
    pbRatio: 2.92, eps: 8.62, bookValuePerShare: 28.0, fiftyTwoWeekHigh: 95.00, fiftyTwoWeekLow: 45.01,
    avgVolume: 5000000, description: 'One of the largest nitrogen fertilizer producers in the Middle East.',
    descriptionAr: 'أحد أكبر منتجي الأسمدة النيتروجينية في الشرق الأوسط.',
    revenue: 55000000000, costOfRevenuePct: 0.65, operatingExpensesPct: 0.18,
    depreciationPct: 0.05, interestExpense: 1000000000, taxRate: 0.225,
    totalAssets: 80000000000, currentAssetsPct: 0.35, cashPct: 0.20,
    totalLiabilitiesPct: 0.45, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.22,
    shortTermDebtPct: 0.18, totalEquity: 44000000000, capexPct: 0.10,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.12
  },
  {
    ticker: 'EKRI', name: 'Edita Food Industries', nameAr: 'اديتا للصناعات الغذائية',
    sector: 'Food', industry: 'Snack Foods', marketCap: 40570000000, price: 29.11,
    sharesOutstanding: 1394000000, beta: 0.80, dividendYield: 0.06, peRatio: 16.10,
    pbRatio: 2.91, eps: 1.81, bookValuePerShare: 10.0, fiftyTwoWeekHigh: 32.50, fiftyTwoWeekLow: 12.00,
    avgVolume: 1500000, description: "Leading snack food manufacturer with popular brands like HoHo's and Twinky.",
    descriptionAr: 'شركة رائدة في تصنيع الوجبات الخفيفة مع علامات تجارية شهيرة.',
    revenue: 14000000000, costOfRevenuePct: 0.58, operatingExpensesPct: 0.26,
    depreciationPct: 0.03, interestExpense: 350000000, taxRate: 0.225,
    totalAssets: 18000000000, currentAssetsPct: 0.45, cashPct: 0.20,
    totalLiabilitiesPct: 0.45, currentLiabilitiesPct: 0.65, longTermDebtPct: 0.12,
    shortTermDebtPct: 0.18, totalEquity: 9900000000, capexPct: 0.08,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.12
  },
  {
    ticker: 'BNQA', name: 'Banque du Caire', nameAr: 'بنك القاهرة',
    sector: 'Banking', industry: 'Commercial Banking', marketCap: 30500000000, price: 2.00,
    sharesOutstanding: 15250000000, beta: 0.90, dividendYield: 0.05, peRatio: 7.00,
    pbRatio: 0.50, eps: 0.29, bookValuePerShare: 4.00, fiftyTwoWeekHigh: 2.25, fiftyTwoWeekLow: 1.50,
    avgVolume: 15000000, description: 'Major state-owned bank providing retail and corporate banking services.',
    descriptionAr: 'بنك رئيسي مملوك للدولة يقدم الخدمات المصرفية للأفراد والشركات.',
    revenue: 38000000000, costOfRevenuePct: 0.28, operatingExpensesPct: 0.43,
    depreciationPct: 0.015, interestExpense: 14000000000, taxRate: 0.225,
    totalAssets: 620000000000, currentAssetsPct: 0.65, cashPct: 0.22,
    totalLiabilitiesPct: 0.90, currentLiabilitiesPct: 0.75, longTermDebtPct: 0.08,
    shortTermDebtPct: 0.12, totalEquity: 62000000000, capexPct: 0.02,
    nwcChangePct: 0.005, netBorrowingPct: 0.5, revenueGrowthRate: 0.18
  },
];

function generateFinancialData(stock: StockDefinition, year: number) {
  const rand = seededRandom(stock.ticker.charCodeAt(0) * 100 + stock.ticker.charCodeAt(1) * 10 + year);
  const yearOffset = year - 2023;
  const growthFactor = Math.pow(1 + stock.revenueGrowthRate, yearOffset);
  const randomGrowth = 1 + (rand() - 0.5) * 0.08; // ±4% variation

  const revenue = Math.round(stock.revenue * growthFactor * randomGrowth);
  const costOfRevenue = Math.round(revenue * stock.costOfRevenuePct);
  const grossProfit = revenue - costOfRevenue;
  const operatingExpenses = Math.round(grossProfit * stock.operatingExpensesPct);
  const operatingIncome = grossProfit - operatingExpenses;
  const depreciation = Math.round(revenue * stock.depreciationPct);
  const ebitda = operatingIncome + depreciation;
  const interestExpense = Math.round(stock.interestExpense * growthFactor * randomGrowth);
  const earningsBeforeTax = operatingIncome - interestExpense;
  const netIncome = Math.round(earningsBeforeTax * (1 - stock.taxRate));
  const eps = parseFloat((netIncome / stock.sharesOutstanding).toFixed(2));
  const dividendsPerShare = parseFloat((eps * stock.dividendYield * stock.peRatio / stock.price).toFixed(2));

  const totalAssets = Math.round(stock.totalAssets * growthFactor * randomGrowth);
  const currentAssets = Math.round(totalAssets * stock.currentAssetsPct);
  const cash = Math.round(currentAssets * stock.cashPct);
  const totalLiabilities = Math.round(totalAssets * stock.totalLiabilitiesPct);
  const currentLiabilities = Math.round(totalLiabilities * stock.currentLiabilitiesPct);
  const longTermDebt = Math.round(totalLiabilities * stock.longTermDebtPct);
  const shortTermDebt = Math.round(totalLiabilities * stock.shortTermDebtPct);
  const totalEquity = totalAssets - totalLiabilities;

  const operatingCashFlow = netIncome + depreciation;
  const capex = Math.round(revenue * stock.capexPct);
  const freeCashFlow = operatingCashFlow - capex;
  const changeInNWC = Math.round(revenue * stock.nwcChangePct * (rand() > 0.5 ? 1 : -1));
  const netBorrowing = Math.round(capex * stock.netBorrowingPct * (rand() > 0.3 ? 1 : -0.5));

  return {
    year,
    quarter: 0,
    revenue,
    costOfRevenue,
    grossProfit,
    operatingExpenses,
    operatingIncome,
    ebitda,
    depreciation,
    interestExpense,
    netIncome,
    eps,
    dividendsPerShare,
    totalAssets,
    currentAssets,
    cash,
    totalLiabilities,
    currentLiabilities,
    longTermDebt,
    shortTermDebt,
    totalEquity,
    sharesOutstanding: stock.sharesOutstanding,
    operatingCashFlow,
    capitalExpenditure: capex,
    freeCashFlow,
    changeInNWC,
    netBorrowing,
    taxRate: stock.taxRate,
  };
}

/**
 * Generate 2 years of price history for EGX stocks.
 * EGX Trading Schedule:
 *   - Trading days: Sunday through Thursday
 *   - Weekend: Friday (day 5) and Saturday (day 6)
 *   - Continuous trading: 10:00 AM - 2:15 PM Cairo time (EET, UTC+2)
 *   - Closing auction: 2:15 PM - 2:30 PM Cairo time
 *   - Pre-opening: 9:30 AM - 10:00 AM
 *
 * Start: ~June 2024
 * End: ~June 2026
 * End price matches the stock's current price
 */
function generatePriceHistory(stock: StockDefinition) {
  const prices: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  const rand = seededRandom(stock.ticker.charCodeAt(0) * 1000 + stock.ticker.charCodeAt(1) * 100 + 42);

  // Start price: ~40% above the 52-week low (2 years ago prices were lower)
  const startPrice = stock.fiftyTwoWeekLow * 1.1;
  const endPrice = stock.price; // Must end at current price

  // Calculate total calendar days from June 2024 to June 2026 (~730 days)
  const startDate = new Date('2024-06-02'); // Start on a Sunday (EGX trading day)
  const endDate = new Date('2026-06-04');   // End on a Thursday (last EGX trading day)

  // First, count all EGX trading days (Sun-Thu, skip Fri-Sat)
  const tradingDays: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    // Skip Friday (5) and Saturday (6) - EGX weekend
    if (day !== 5 && day !== 6) {
      tradingDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  const totalTradingDays = tradingDays.length;
  if (totalTradingDays === 0) return prices;

  // Calculate required daily drift to go from startPrice to endPrice
  const totalReturn = endPrice / startPrice;
  const dailyDrift = Math.pow(totalReturn, 1 / totalTradingDays) - 1;

  // Daily volatility scaled for Egyptian market (higher than developed markets)
  const dailyVolatility = 0.028; // ~2.8% daily vol for EGX

  let prevPrice = startPrice;

  for (let i = 0; i < totalTradingDays; i++) {
    // Calculate how much drift adjustment is needed (taper drift near the end for natural convergence)
    const progress = i / totalTradingDays;
    const driftAdjustment = dailyDrift;

    // Random component: sum of 3 uniform approximates normal distribution
    const randomComponent = dailyVolatility * (rand() - 0.5 + (rand() - 0.5) + (rand() - 0.5));

    const dailyReturn = driftAdjustment + randomComponent;
    const open = prevPrice;
    const close = open * (1 + dailyReturn);

    // Intraday high and low
    const intraHigh = Math.max(open, close) * (1 + rand() * 0.012);
    const intraLow = Math.min(open, close) * (1 - rand() * 0.012);

    // Volume with some randomness
    const volume = Math.round(stock.avgVolume * (0.5 + rand() * 1.0));

    const dateStr = tradingDays[i].toISOString().split('T')[0];

    prices.push({
      date: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(intraHigh.toFixed(2)),
      low: parseFloat(Math.max(intraLow, 0.01).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    prevPrice = close;
  }

  // Force the last trading day's close to match the target current price
  if (prices.length > 0) {
    const lastIdx = prices.length - 1;
    const targetClose = endPrice;
    prices[lastIdx].close = parseFloat(targetClose.toFixed(2));
    prices[lastIdx].high = parseFloat(Math.max(prices[lastIdx].high, targetClose).toFixed(2));
    prices[lastIdx].low = parseFloat(Math.min(prices[lastIdx].low, targetClose).toFixed(2));
  }

  return prices;
}

function computeTechnicalIndicators(priceHistory: { close: number; high: number; low: number; volume: number }[]) {
  const results: {
    date: string; rsi14: number; macd: number; macdSignal: number; macdHistogram: number;
    sma20: number; sma50: number; sma200: number; ema12: number; ema26: number;
    bbUpper: number; bbMiddle: number; bbLower: number; atr14: number; adx14: number;
    stochK: number; stochD: number; williamsR: number; cci14: number; obv: number;
  }[] = [];

  const closes = priceHistory.map(p => p.close);
  const highs = priceHistory.map(p => p.high);
  const lows = priceHistory.map(p => p.low);
  const volumes = priceHistory.map(p => p.volume);

  // Helper: Simple Moving Average
  function sma(data: number[], period: number, endIdx: number): number {
    if (endIdx < period - 1) return 0;
    let sum = 0;
    for (let i = endIdx - period + 1; i <= endIdx; i++) sum += data[i];
    return sum / period;
  }

  // Helper: Exponential Moving Average
  function ema(data: number[], period: number, endIdx: number): number {
    if (endIdx < period - 1) return 0;
    const k = 2 / (period + 1);
    let prevEma = sma(data, period, period - 1);
    for (let i = period; i <= endIdx; i++) {
      prevEma = data[i] * k + prevEma * (1 - k);
    }
    return prevEma;
  }

  // RSI
  function calcRSI(endIdx: number, period: number = 14): number {
    if (endIdx < period) return 50;
    let gains = 0, losses = 0;
    for (let i = endIdx - period + 1; i <= endIdx; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // ATR
  function calcATR(endIdx: number, period: number = 14): number {
    if (endIdx < period) return 0;
    let sum = 0;
    for (let i = endIdx - period + 1; i <= endIdx; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      sum += tr;
    }
    return sum / period;
  }

  // Stochastic
  function calcStochastic(endIdx: number, period: number = 14): { k: number; d: number } {
    if (endIdx < period - 1) return { k: 50, d: 50 };
    let highestHigh = -Infinity, lowestLow = Infinity;
    for (let i = endIdx - period + 1; i <= endIdx; i++) {
      highestHigh = Math.max(highestHigh, highs[i]);
      lowestLow = Math.min(lowestLow, lows[i]);
    }
    const k = highestHigh === lowestLow ? 50 : ((closes[endIdx] - lowestLow) / (highestHigh - lowestLow)) * 100;
    // Simple %D = 3-period SMA of %K
    let d = k;
    if (endIdx >= period + 2) {
      let kSum = 0;
      for (let i = 0; i < 3; i++) {
        let hh = -Infinity, ll = Infinity;
        const idx = endIdx - i;
        if (idx < period - 1) { d = k; break; }
        for (let j = idx - period + 1; j <= idx; j++) {
          hh = Math.max(hh, highs[j]);
          ll = Math.min(ll, lows[j]);
        }
        kSum += hh === ll ? 50 : ((closes[idx] - ll) / (hh - ll)) * 100;
      }
      d = kSum / 3;
    }
    return { k, d };
  }

  // Williams %R
  function calcWilliamsR(endIdx: number, period: number = 14): number {
    if (endIdx < period - 1) return -50;
    let highestHigh = -Infinity, lowestLow = Infinity;
    for (let i = endIdx - period + 1; i <= endIdx; i++) {
      highestHigh = Math.max(highestHigh, highs[i]);
      lowestLow = Math.min(lowestLow, lows[i]);
    }
    if (highestHigh === lowestLow) return -50;
    return ((highestHigh - closes[endIdx]) / (highestHigh - lowestLow)) * -100;
  }

  // CCI
  function calcCCI(endIdx: number, period: number = 14): number {
    if (endIdx < period - 1) return 0;
    const tps: number[] = [];
    for (let i = endIdx - period + 1; i <= endIdx; i++) {
      tps.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    const mean = tps.reduce((a, b) => a + b, 0) / period;
    const md = tps.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
    if (md === 0) return 0;
    const currentTP = (highs[endIdx] + lows[endIdx] + closes[endIdx]) / 3;
    return (currentTP - mean) / (0.015 * md);
  }

  // OBV
  function calcOBV(endIdx: number): number {
    let obv = 0;
    for (let i = 1; i <= endIdx; i++) {
      if (closes[i] > closes[i - 1]) obv += volumes[i];
      else if (closes[i] < closes[i - 1]) obv -= volumes[i];
    }
    return obv;
  }

  // ADX (simplified)
  function calcADX(endIdx: number, period: number = 14): number {
    if (endIdx < period * 2) return 25;
    let sumDX = 0;
    for (let i = endIdx - period + 1; i <= endIdx; i++) {
      let plusDM = 0, minusDM = 0, sumTR = 0;
      for (let j = i - period + 1; j <= i; j++) {
        if (j < 1) continue;
        const upMove = highs[j] - highs[j - 1];
        const downMove = lows[j - 1] - lows[j];
        if (upMove > downMove && upMove > 0) plusDM += upMove;
        if (downMove > upMove && downMove > 0) minusDM += downMove;
        sumTR += Math.max(highs[j] - lows[j], Math.abs(highs[j] - closes[j - 1]), Math.abs(lows[j] - closes[j - 1]));
      }
      if (sumTR === 0) continue;
      const plusDI = (plusDM / sumTR) * 100;
      const minusDI = (minusDM / sumTR) * 100;
      const diSum = plusDI + minusDI;
      if (diSum === 0) continue;
      sumDX += Math.abs(plusDI - minusDI) / diSum * 100;
    }
    return sumDX / period;
  }

  for (let i = 0; i < priceHistory.length; i++) {
    const sma20 = sma(closes, 20, i);
    const sma50 = sma(closes, 50, i);
    const sma200 = sma(closes, 200, i);
    const ema12 = ema(closes, 12, i);
    const ema26 = ema(closes, 26, i);
    const macdLine = ema12 - ema26;
    const macdSignal = ema(closes.map((_, idx) => {
      if (idx < 26) return 0;
      return ema(closes, 12, idx) - ema(closes, 26, idx);
    }), 9, Math.min(i, closes.length - 1));
    const macdHistogram = macdLine - macdSignal;

    // Bollinger Bands
    const bbMiddle = sma20;
    let variance = 0;
    if (i >= 19) {
      for (let j = i - 19; j <= i; j++) variance += Math.pow(closes[j] - bbMiddle, 2);
      variance /= 20;
    }
    const stdDev = Math.sqrt(variance);
    const bbUpper = bbMiddle + 2 * stdDev;
    const bbLower = bbMiddle - 2 * stdDev;

    const rsi14 = calcRSI(i);
    const atr14 = calcATR(i);
    const adx14 = calcADX(i);
    const stoch = calcStochastic(i);
    const williamsR = calcWilliamsR(i);
    const cci14 = calcCCI(i);
    const obv = calcOBV(i);

    results.push({
      date: priceHistory[i].date || `day-${i}`,
      rsi14: parseFloat(rsi14.toFixed(2)),
      macd: parseFloat(macdLine.toFixed(4)),
      macdSignal: parseFloat(macdSignal.toFixed(4)),
      macdHistogram: parseFloat(macdHistogram.toFixed(4)),
      sma20: parseFloat(sma20.toFixed(2)),
      sma50: parseFloat(sma50.toFixed(2)),
      sma200: parseFloat(sma200.toFixed(2)),
      ema12: parseFloat(ema12.toFixed(2)),
      ema26: parseFloat(ema26.toFixed(2)),
      bbUpper: parseFloat(bbUpper.toFixed(2)),
      bbMiddle: parseFloat(bbMiddle.toFixed(2)),
      bbLower: parseFloat(bbLower.toFixed(2)),
      atr14: parseFloat(atr14.toFixed(2)),
      adx14: parseFloat(adx14.toFixed(2)),
      stochK: parseFloat(stoch.k.toFixed(2)),
      stochD: parseFloat(stoch.d.toFixed(2)),
      williamsR: parseFloat(williamsR.toFixed(2)),
      cci14: parseFloat(cci14.toFixed(2)),
      obv: parseFloat(obv.toFixed(0)),
    });
  }

  return results;
}

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
];

const economicIndicators = [
  { name: 'CBE Overnight Deposit Rate', nameAr: 'سعر الإيداع لدى البنك المركزي', value: 19.00, previousValue: 27.25, change: -8.25, unit: '%', source: 'CBE', date: '2026-06-01' },
  { name: 'USD/EGP Exchange Rate', nameAr: 'سعر صرف الدولار', value: 51.82, previousValue: 48.50, change: 3.32, unit: 'EGP', source: 'CBE', date: '2026-06-01' },
  { name: 'Inflation Rate (Urban Annual)', nameAr: 'معدل التضخم (سنوي حضري)', value: 14.9, previousValue: 23.4, change: -8.5, unit: '%', source: 'CAPMAS', date: '2026-06-01' },
  { name: 'GDP Growth Rate', nameAr: 'معدل نمو الناتج المحلي', value: 5.3, previousValue: 4.2, change: 1.1, unit: '%', source: 'CAPMAS', date: '2026-06-01' },
  { name: 'Foreign Reserves', nameAr: 'الاحتياطي الأجنبي', value: 53.01, previousValue: 47.0, change: 0.2, unit: 'Billion USD', source: 'CBE', date: '2026-06-01' },
  { name: 'EGX30 Index', nameAr: 'مؤشر إيجي إكس 30', value: 52652, previousValue: 29800, change: 22852, unit: 'points', source: 'EGX', date: '2026-06-01' },
  { name: 'Unemployment Rate', nameAr: 'معدل البطالة', value: 6.8, previousValue: 7.2, change: -0.4, unit: '%', source: 'CAPMAS', date: '2026-06-01' },
  { name: 'Budget Deficit % GDP', nameAr: 'عجز الموازنة', value: 5.8, previousValue: 6.2, change: -0.4, unit: '% GDP', source: 'MoF', date: '2026-06-01' },
  { name: 'Current Account % GDP', nameAr: 'الحساب الجاري', value: -1.5, previousValue: -2.8, change: 1.3, unit: '% GDP', source: 'CBE', date: '2026-06-01' },
];

async function main() {
  console.log('🌱 Starting database seed (June 2026 EGX data)...');

  // Clear existing data
  await prisma.technicalIndicator.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.valuationResult.deleteMany();
  await prisma.analystReport.deleteMany();
  await prisma.financialData.deleteMany();
  await prisma.portfolioHolding.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.sectorStats.deleteMany();
  await prisma.economicIndicator.deleteMany();
  await prisma.marketParams.deleteMany();

  console.log('📊 Creating stocks and financial data...');

  // The last trading date before June 2026 on EGX would be Thursday June 4, 2026
  const lastPriceAt = new Date('2026-06-04T14:30:00+02:00'); // 2:30 PM Cairo time (closing auction end)
  const lastFinancialsAt = new Date('2025-12-31T00:00:00Z');

  for (const stockDef of stocks) {
    const stock = await prisma.stock.create({
      data: {
        ticker: stockDef.ticker,
        name: stockDef.name,
        nameAr: stockDef.nameAr,
        sector: stockDef.sector,
        industry: stockDef.industry,
        marketCap: stockDef.marketCap,
        price: stockDef.price,
        sharesOutstanding: stockDef.sharesOutstanding,
        beta: stockDef.beta,
        dividendYield: stockDef.dividendYield,
        peRatio: stockDef.peRatio,
        pbRatio: stockDef.pbRatio,
        eps: stockDef.eps,
        bookValuePerShare: stockDef.bookValuePerShare,
        fiftyTwoWeekHigh: stockDef.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stockDef.fiftyTwoWeekLow,
        avgVolume: stockDef.avgVolume,
        exchange: 'EGX',
        currency: 'EGP',
        listedDate: '2000-01-01',
        description: stockDef.description,
        descriptionAr: stockDef.descriptionAr,
        lastPriceAt,
        lastFinancialsAt,
      }
    });

    // Generate 3 years of financial data (FY2023 - FY2025)
    for (let year = 2023; year <= 2025; year++) {
      const financialData = generateFinancialData(stockDef, year);
      await prisma.financialData.create({
        data: {
          stockId: stock.id,
          ...financialData,
          dataSource: 'estimated',  // Mark as estimated — replace with verified filings
          reportingDate: new Date(year, 11, 31),  // Dec 31 of the fiscal year
          reportType: 'annual',
          currency: 'EGP',
          isVerified: false,  // Set to true only after cross-referencing with EGX filings
        }
      });
    }

    // Generate 2 years of price history (June 2024 - June 2026, EGX trading days only)
    const priceHistory = generatePriceHistory(stockDef);
    for (const ph of priceHistory) {
      await prisma.priceHistory.create({
        data: {
          stockId: stock.id,
          date: ph.date,
          open: ph.open,
          high: ph.high,
          low: ph.low,
          close: ph.close,
          volume: ph.volume,
          source: 'simulated',  // Mark as simulated — replace with Yahoo Finance / EGX data
          isAdjusted: true,
        }
      });
    }

    // Compute and store technical indicators
    const techIndicators = computeTechnicalIndicators(priceHistory);
    for (const ti of techIndicators) {
      await prisma.technicalIndicator.create({
        data: {
          stockId: stock.id,
          date: ti.date,
          rsi14: ti.rsi14,
          macd: ti.macd,
          macdSignal: ti.macdSignal,
          macdHistogram: ti.macdHistogram,
          sma20: ti.sma20,
          sma50: ti.sma50,
          sma200: ti.sma200,
          ema12: ti.ema12,
          ema26: ti.ema26,
          bbUpper: ti.bbUpper,
          bbMiddle: ti.bbMiddle,
          bbLower: ti.bbLower,
          atr14: ti.atr14,
          adx14: ti.adx14,
          stochK: ti.stochK,
          stochD: ti.stochD,
          williamsR: ti.williamsR,
          cci14: ti.cci14,
          obv: ti.obv,
        }
      });
    }

    console.log(`  ✅ ${stockDef.ticker} - ${stockDef.name} (${priceHistory.length} trading days)`);
  }

  console.log('📈 Creating sector stats...');
  for (const ss of sectorStats) {
    await prisma.sectorStats.create({ data: ss });
  }

  console.log('🌍 Creating economic indicators...');
  for (const ei of economicIndicators) {
    await prisma.economicIndicator.create({ data: ei });
  }

  console.log('📋 Creating MarketParams...');
  await prisma.marketParams.create({
    data: {
      riskFreeRate: 0.19,
      baseEquityRiskPremium: 0.045,
      countryRiskPremium: 0.075,
      totalEquityRiskPremium: 0.12,
      corporateTaxRate: 0.225,
      inflationRateEGP: 0.149,
      inflationRateUSD: 0.025,
      usdEgpRate: 51.82,
      effectiveDate: new Date('2026-06-01T00:00:00Z'),
      source: 'CBE/Damodaran June 2026',
    }
  });

  console.log('🎉 Seed completed successfully!');
  console.log(`  - ${stocks.length} stocks created`);
  console.log(`  - ${stocks.length * 3} financial records created (FY2023-FY2025)`);
  console.log(`  - Price history generated (~520 EGX trading days per stock, Jun 2024 - Jun 2026)`);
  console.log(`  - Technical indicators computed`);
  console.log(`  - ${sectorStats.length} sector stats created`);
  console.log(`  - ${economicIndicators.length} economic indicators created`);
  console.log(`  - 1 MarketParams row created (CBE/Damodaran June 2026)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
