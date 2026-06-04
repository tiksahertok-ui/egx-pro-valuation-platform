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
  // Financial baseline
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
    sector: 'Banking', industry: 'Commercial Banking', marketCap: 120000000000, price: 65,
    sharesOutstanding: 1846153846, beta: 0.85, dividendYield: 0.05, peRatio: 10.5,
    pbRatio: 1.8, eps: 6.19, bookValuePerShare: 36.1, fiftyTwoWeekHigh: 72, fiftyTwoWeekLow: 48,
    avgVolume: 8500000, description: 'Egypt\'s largest private-sector bank by assets, offering comprehensive banking and financial services.',
    descriptionAr: 'أكبر بنك قطاع خاص في مصر من حيث الأصول، يقدم خدمات مصرفية ومالية شاملة.',
    revenue: 48000000000, costOfRevenuePct: 0.25, operatingExpensesPct: 0.45,
    depreciationPct: 0.02, interestExpense: 15000000000, taxRate: 0.23,
    totalAssets: 850000000000, currentAssetsPct: 0.65, cashPct: 0.25,
    totalLiabilitiesPct: 0.88, currentLiabilitiesPct: 0.75, longTermDebtPct: 0.15,
    shortTermDebtPct: 0.10, totalEquity: 102000000000, capexPct: 0.03,
    nwcChangePct: 0.01, netBorrowingPct: 0.6, revenueGrowthRate: 0.18
  },
  {
    ticker: 'ORAS', name: 'Orascom Construction', nameAr: 'أوراسكو للإنشاءات',
    sector: 'Construction', industry: 'Engineering & Construction', marketCap: 20000000000, price: 480,
    sharesOutstanding: 41666667, beta: 1.2, dividendYield: 0.03, peRatio: 8.5,
    pbRatio: 1.2, eps: 56.47, bookValuePerShare: 400, fiftyTwoWeekHigh: 540, fiftyTwoWeekLow: 350,
    avgVolume: 1200000, description: 'Leading engineering and construction company with projects across the Middle East and Africa.',
    descriptionAr: 'شركة رائدة في الهندسة والإنشاءات مع مشاريع في الشرق الأوسط وأفريقيا.',
    revenue: 32000000000, costOfRevenuePct: 0.72, operatingExpensesPct: 0.35,
    depreciationPct: 0.03, interestExpense: 800000000, taxRate: 0.23,
    totalAssets: 55000000000, currentAssetsPct: 0.70, cashPct: 0.20,
    totalLiabilitiesPct: 0.65, currentLiabilitiesPct: 0.60, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.15, totalEquity: 19250000000, capexPct: 0.06,
    nwcChangePct: 0.03, netBorrowingPct: 0.4, revenueGrowthRate: 0.12
  },
  {
    ticker: 'SWDY', name: 'Elsewedy Electric', nameAr: 'السويدي إلكتريك',
    sector: 'Electrical Equipment', industry: 'Electrical Equipment', marketCap: 30000000000, price: 16,
    sharesOutstanding: 1875000000, beta: 1.15, dividendYield: 0.04, peRatio: 9.0,
    pbRatio: 1.5, eps: 1.78, bookValuePerShare: 10.67, fiftyTwoWeekHigh: 19, fiftyTwoWeekLow: 11,
    avgVolume: 15000000, description: 'Global leader in energy solutions, cables, and electrical products with operations in 50+ countries.',
    descriptionAr: 'رائد عالمي في حلول الطاقة والكابلات والمنتجات الكهربائية بعمليات في أكثر من 50 دولة.',
    revenue: 65000000000, costOfRevenuePct: 0.70, operatingExpensesPct: 0.30,
    depreciationPct: 0.04, interestExpense: 2000000000, taxRate: 0.23,
    totalAssets: 90000000000, currentAssetsPct: 0.60, cashPct: 0.18,
    totalLiabilitiesPct: 0.68, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.20, totalEquity: 28800000000, capexPct: 0.08,
    nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.15
  },
  {
    ticker: 'HRHO', name: 'EFG Hermes', nameAr: 'إي إف جي هيرمس',
    sector: 'Financial Services', industry: 'Investment Banking', marketCap: 35000000000, price: 30,
    sharesOutstanding: 1166666667, beta: 1.1, dividendYield: 0.06, peRatio: 11.0,
    pbRatio: 1.6, eps: 2.73, bookValuePerShare: 18.75, fiftyTwoWeekHigh: 35, fiftyTwoWeekLow: 22,
    avgVolume: 6000000, description: 'Leading financial services corporation in the Middle East and Africa region.',
    descriptionAr: 'شركة خدمات مالية رائدة في منطقة الشرق الأوسط وأفريقيا.',
    revenue: 18000000000, costOfRevenuePct: 0.35, operatingExpensesPct: 0.40,
    depreciationPct: 0.02, interestExpense: 3000000000, taxRate: 0.23,
    totalAssets: 120000000000, currentAssetsPct: 0.75, cashPct: 0.30,
    totalLiabilitiesPct: 0.80, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.15,
    shortTermDebtPct: 0.15, totalEquity: 24000000000, capexPct: 0.04,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.14
  },
  {
    ticker: 'ETEL', name: 'Telecom Egypt', nameAr: 'الاتصالات المصرية',
    sector: 'Telecommunications', industry: 'Telecom Services', marketCap: 40000000000, price: 25,
    sharesOutstanding: 1600000000, beta: 0.75, dividendYield: 0.07, peRatio: 12.0,
    pbRatio: 1.0, eps: 2.08, bookValuePerShare: 25.0, fiftyTwoWeekHigh: 28, fiftyTwoWeekLow: 18,
    avgVolume: 5000000, description: 'Egypt\'s incumbent telecommunications operator providing fixed-line and mobile services.',
    descriptionAr: 'مشغل الاتصالات المصري الرئيسي يقدم خدمات الخط الثابت والمحمول.',
    revenue: 35000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.30,
    depreciationPct: 0.12, interestExpense: 1500000000, taxRate: 0.23,
    totalAssets: 80000000000, currentAssetsPct: 0.30, cashPct: 0.25,
    totalLiabilitiesPct: 0.50, currentLiabilitiesPct: 0.40, longTermDebtPct: 0.35,
    shortTermDebtPct: 0.25, totalEquity: 40000000000, capexPct: 0.18,
    nwcChangePct: 0.02, netBorrowingPct: 0.5, revenueGrowthRate: 0.08
  },
  {
    ticker: 'EAST', name: 'Eastern Company', nameAr: 'الشركة الشرقية',
    sector: 'Tobacco', industry: 'Tobacco', marketCap: 70000000000, price: 30,
    sharesOutstanding: 2333333333, beta: 0.6, dividendYield: 0.08, peRatio: 12.5,
    pbRatio: 3.5, eps: 2.40, bookValuePerShare: 8.57, fiftyTwoWeekHigh: 34, fiftyTwoWeekLow: 24,
    avgVolume: 4000000, description: 'Egypt\'s monopoly tobacco manufacturer with dominant market share.',
    descriptionAr: 'شركة احتكار السجائر في مصر بحصة سوقية مهيمنة.',
    revenue: 55000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.20,
    depreciationPct: 0.03, interestExpense: 200000000, taxRate: 0.35,
    totalAssets: 45000000000, currentAssetsPct: 0.50, cashPct: 0.30,
    totalLiabilitiesPct: 0.40, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.10,
    shortTermDebtPct: 0.20, totalEquity: 27000000000, capexPct: 0.05,
    nwcChangePct: 0.01, netBorrowingPct: 0.2, revenueGrowthRate: 0.10
  },
  {
    ticker: 'JUFO', name: 'Juhayna Food Industries', nameAr: 'جهينة للصناعات الغذائية',
    sector: 'Food', industry: 'Dairy & Food Products', marketCap: 12000000000, price: 8,
    sharesOutstanding: 1500000000, beta: 0.9, dividendYield: 0.04, peRatio: 10.0,
    pbRatio: 1.8, eps: 0.80, bookValuePerShare: 4.44, fiftyTwoWeekHigh: 10, fiftyTwoWeekLow: 6,
    avgVolume: 3000000, description: 'Leading Egyptian dairy and juice producer with strong brand recognition.',
    descriptionAr: 'منتج ألبان وعصائر مصري رائد بسمعة تجارية قوية.',
    revenue: 15000000000, costOfRevenuePct: 0.65, operatingExpensesPct: 0.30,
    depreciationPct: 0.04, interestExpense: 500000000, taxRate: 0.23,
    totalAssets: 18000000000, currentAssetsPct: 0.45, cashPct: 0.15,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.60, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.15, totalEquity: 8100000000, capexPct: 0.10,
    nwcChangePct: 0.03, netBorrowingPct: 0.4, revenueGrowthRate: 0.12
  },
  {
    ticker: 'PHDC', name: 'Palm Hills Development', nameAr: 'بالم هيلز للتعمير',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 15000000000, price: 5,
    sharesOutstanding: 3000000000, beta: 1.3, dividendYield: 0.02, peRatio: 7.5,
    pbRatio: 0.9, eps: 0.67, bookValuePerShare: 5.56, fiftyTwoWeekHigh: 6.5, fiftyTwoWeekLow: 3.5,
    avgVolume: 10000000, description: 'Major real estate developer in Egypt with extensive land bank.',
    descriptionAr: 'مطور عقاري رئيسي في مصر بمحفظة أراضي واسعة.',
    revenue: 12000000000, costOfRevenuePct: 0.60, operatingExpensesPct: 0.25,
    depreciationPct: 0.02, interestExpense: 1000000000, taxRate: 0.23,
    totalAssets: 40000000000, currentAssetsPct: 0.55, cashPct: 0.12,
    totalLiabilitiesPct: 0.70, currentLiabilitiesPct: 0.45, longTermDebtPct: 0.30,
    shortTermDebtPct: 0.25, totalEquity: 12000000000, capexPct: 0.12,
    nwcChangePct: 0.05, netBorrowingPct: 0.6, revenueGrowthRate: 0.20
  },
  {
    ticker: 'MHMD', name: 'Madinet Masr', nameAr: 'مدينة مصر',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 25000000000, price: 8,
    sharesOutstanding: 3125000000, beta: 1.25, dividendYield: 0.03, peRatio: 8.0,
    pbRatio: 1.1, eps: 1.00, bookValuePerShare: 7.27, fiftyTwoWeekHigh: 10, fiftyTwoWeekLow: 6,
    avgVolume: 8000000, description: 'Leading community developer creating integrated urban communities in Egypt.',
    descriptionAr: 'مطور مجتمعات رائد يخلق مجتمعات حضرية متكاملة في مصر.',
    revenue: 20000000000, costOfRevenuePct: 0.58, operatingExpensesPct: 0.25,
    depreciationPct: 0.02, interestExpense: 1200000000, taxRate: 0.23,
    totalAssets: 55000000000, currentAssetsPct: 0.50, cashPct: 0.10,
    totalLiabilitiesPct: 0.65, currentLiabilitiesPct: 0.45, longTermDebtPct: 0.30,
    shortTermDebtPct: 0.25, totalEquity: 19250000000, capexPct: 0.15,
    nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.22
  },
  {
    ticker: 'TMGH', name: 'TMG Holding', nameAr: 'طلعت مصطفى',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 45000000000, price: 12,
    sharesOutstanding: 3750000000, beta: 1.15, dividendYield: 0.04, peRatio: 9.0,
    pbRatio: 1.3, eps: 1.33, bookValuePerShare: 9.23, fiftyTwoWeekHigh: 15, fiftyTwoWeekLow: 9,
    avgVolume: 7000000, description: 'One of Egypt\'s largest real estate developers, known for Madinaty project.',
    descriptionAr: 'أحد أكبر المطورين العقاريين في مصر، معروف بمشروع مدينتي.',
    revenue: 35000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.22,
    depreciationPct: 0.02, interestExpense: 1800000000, taxRate: 0.23,
    totalAssets: 90000000000, currentAssetsPct: 0.50, cashPct: 0.12,
    totalLiabilitiesPct: 0.60, currentLiabilitiesPct: 0.45, longTermDebtPct: 0.30,
    shortTermDebtPct: 0.25, totalEquity: 36000000000, capexPct: 0.14,
    nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.18
  },
  {
    ticker: 'CIRA', name: 'CI Capital Holding', nameAr: 'سي آي كابيتال',
    sector: 'Financial Services', industry: 'Financial Holdings', marketCap: 8000000000, price: 6,
    sharesOutstanding: 1333333333, beta: 1.2, dividendYield: 0.05, peRatio: 7.0,
    pbRatio: 0.8, eps: 0.86, bookValuePerShare: 7.50, fiftyTwoWeekHigh: 8, fiftyTwoWeekLow: 4.5,
    avgVolume: 2500000, description: 'Diversified financial services platform with leasing, mortgage, and brokerage operations.',
    descriptionAr: 'منصة خدمات مالية متنوعة مع عمليات التأجير والرهن والوساطة.',
    revenue: 6000000000, costOfRevenuePct: 0.40, operatingExpensesPct: 0.35,
    depreciationPct: 0.02, interestExpense: 1500000000, taxRate: 0.23,
    totalAssets: 35000000000, currentAssetsPct: 0.70, cashPct: 0.20,
    totalLiabilitiesPct: 0.75, currentLiabilitiesPct: 0.65, longTermDebtPct: 0.20,
    shortTermDebtPct: 0.15, totalEquity: 8750000000, capexPct: 0.03,
    nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.16
  },
  {
    ticker: 'OCDI', name: 'SODIC', nameAr: 'سوديك',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 20000000000, price: 35,
    sharesOutstanding: 571428571, beta: 1.2, dividendYield: 0.03, peRatio: 8.5,
    pbRatio: 1.0, eps: 4.12, bookValuePerShare: 35.0, fiftyTwoWeekHigh: 42, fiftyTwoWeekLow: 26,
    avgVolume: 1500000, description: 'Premium real estate developer focused on high-end residential and commercial projects.',
    descriptionAr: 'مطور عقاري متميز يركز على المشاريع السكنية والتجارية الراقية.',
    revenue: 15000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.22,
    depreciationPct: 0.02, interestExpense: 800000000, taxRate: 0.23,
    totalAssets: 45000000000, currentAssetsPct: 0.50, cashPct: 0.12,
    totalLiabilitiesPct: 0.60, currentLiabilitiesPct: 0.45, longTermDebtPct: 0.30,
    shortTermDebtPct: 0.25, totalEquity: 18000000000, capexPct: 0.13,
    nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.18
  },
  {
    ticker: 'ORHD', name: 'Orascom Development', nameAr: 'أوراسكو للتنمية',
    sector: 'Tourism', industry: 'Tourism & Hospitality', marketCap: 10000000000, price: 15,
    sharesOutstanding: 666666667, beta: 1.35, dividendYield: 0.02, peRatio: 10.0,
    pbRatio: 0.7, eps: 1.50, bookValuePerShare: 21.43, fiftyTwoWeekHigh: 18, fiftyTwoWeekLow: 10,
    avgVolume: 2000000, description: 'Integrated tourism developer operating resort towns in Egypt and Europe.',
    descriptionAr: 'مطور سياحي متكامل يدير مدن منتجعات في مصر وأوروبا.',
    revenue: 8000000000, costOfRevenuePct: 0.60, operatingExpensesPct: 0.28,
    depreciationPct: 0.04, interestExpense: 600000000, taxRate: 0.23,
    totalAssets: 28000000000, currentAssetsPct: 0.35, cashPct: 0.15,
    totalLiabilitiesPct: 0.65, currentLiabilitiesPct: 0.40, longTermDebtPct: 0.35,
    shortTermDebtPct: 0.25, totalEquity: 9800000000, capexPct: 0.12,
    nwcChangePct: 0.03, netBorrowingPct: 0.5, revenueGrowthRate: 0.15
  },
  {
    ticker: 'CCAP', name: 'Qalaa Holdings', nameAr: 'القلعة',
    sector: 'Energy', industry: 'Energy & Infrastructure', marketCap: 12000000000, price: 4,
    sharesOutstanding: 3000000000, beta: 1.4, dividendYield: 0.01, peRatio: 12.0,
    pbRatio: 0.5, eps: 0.33, bookValuePerShare: 8.0, fiftyTwoWeekHigh: 5.5, fiftyTwoWeekLow: 2.8,
    avgVolume: 12000000, description: 'Leading energy and infrastructure investment company in Egypt and East Africa.',
    descriptionAr: 'شركة استثمار رائدة في الطاقة والبنية التحتية في مصر وشرق أفريقيا.',
    revenue: 20000000000, costOfRevenuePct: 0.75, operatingExpensesPct: 0.30,
    depreciationPct: 0.06, interestExpense: 2500000000, taxRate: 0.23,
    totalAssets: 60000000000, currentAssetsPct: 0.30, cashPct: 0.12,
    totalLiabilitiesPct: 0.78, currentLiabilitiesPct: 0.35, longTermDebtPct: 0.40,
    shortTermDebtPct: 0.25, totalEquity: 13200000000, capexPct: 0.15,
    nwcChangePct: 0.04, netBorrowingPct: 0.6, revenueGrowthRate: 0.20
  },
  {
    ticker: 'FWRY', name: 'Fawry Banking & Payment', nameAr: 'فوري',
    sector: 'Technology', industry: 'FinTech & Payments', marketCap: 18000000000, price: 10,
    sharesOutstanding: 1800000000, beta: 1.0, dividendYield: 0.02, peRatio: 25.0,
    pbRatio: 5.0, eps: 0.40, bookValuePerShare: 2.0, fiftyTwoWeekHigh: 13, fiftyTwoWeekLow: 7,
    avgVolume: 5000000, description: 'Egypt\'s leading digital payments and financial technology platform.',
    descriptionAr: 'منصة الدفع الرقمي والتكنولوجيا المالية الرائدة في مصر.',
    revenue: 5000000000, costOfRevenuePct: 0.45, operatingExpensesPct: 0.35,
    depreciationPct: 0.03, interestExpense: 200000000, taxRate: 0.23,
    totalAssets: 12000000000, currentAssetsPct: 0.65, cashPct: 0.35,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.10,
    shortTermDebtPct: 0.20, totalEquity: 5400000000, capexPct: 0.08,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.30
  },
  {
    ticker: 'AMOC', name: 'Alexandria Mineral Oils', nameAr: 'الإسكندرية للزيوت المعدنية',
    sector: 'Energy', industry: 'Oil Refining', marketCap: 8000000000, price: 40,
    sharesOutstanding: 200000000, beta: 1.1, dividendYield: 0.06, peRatio: 6.0,
    pbRatio: 1.2, eps: 6.67, bookValuePerShare: 33.33, fiftyTwoWeekHigh: 48, fiftyTwoWeekLow: 30,
    avgVolume: 800000, description: 'Petroleum refining company producing lubricating oils and specialty products.',
    descriptionAr: 'شركة تكرير البترول تنتج زيوت التشحيم والمنتجات المتخصصة.',
    revenue: 18000000000, costOfRevenuePct: 0.80, operatingExpensesPct: 0.25,
    depreciationPct: 0.04, interestExpense: 400000000, taxRate: 0.23,
    totalAssets: 15000000000, currentAssetsPct: 0.40, cashPct: 0.15,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.20, totalEquity: 6750000000, capexPct: 0.08,
    nwcChangePct: 0.03, netBorrowingPct: 0.4, revenueGrowthRate: 0.08
  },
  {
    ticker: 'SPMD', name: 'Sidi Kerir Petrochemicals', nameAr: 'سيدي كرير للبتروكيماويات',
    sector: 'Chemicals', industry: 'Petrochemicals', marketCap: 15000000000, price: 20,
    sharesOutstanding: 750000000, beta: 0.95, dividendYield: 0.07, peRatio: 8.0,
    pbRatio: 1.5, eps: 2.50, bookValuePerShare: 13.33, fiftyTwoWeekHigh: 24, fiftyTwoWeekLow: 15,
    avgVolume: 2500000, description: 'Major petrochemical producer manufacturing polyethylene and other chemical products.',
    descriptionAr: 'منتج بتروكيماوي رئيسي يصنع البولي إيثيلين والمنتجات الكيميائية الأخرى.',
    revenue: 16000000000, costOfRevenuePct: 0.72, operatingExpensesPct: 0.22,
    depreciationPct: 0.05, interestExpense: 500000000, taxRate: 0.23,
    totalAssets: 22000000000, currentAssetsPct: 0.40, cashPct: 0.18,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.20, totalEquity: 9900000000, capexPct: 0.10,
    nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.10
  },
  {
    ticker: 'ISPH', name: 'Arabian Cement', nameAr: 'اسمنت العربية',
    sector: 'Construction Materials', industry: 'Cement', marketCap: 5000000000, price: 10,
    sharesOutstanding: 500000000, beta: 1.05, dividendYield: 0.08, peRatio: 6.5,
    pbRatio: 0.8, eps: 1.54, bookValuePerShare: 12.5, fiftyTwoWeekHigh: 13, fiftyTwoWeekLow: 7,
    avgVolume: 1500000, description: 'Cement producer serving the Egyptian construction market.',
    descriptionAr: 'منتج أسمنت يخدم سوق البناء المصري.',
    revenue: 6000000000, costOfRevenuePct: 0.68, operatingExpensesPct: 0.25,
    depreciationPct: 0.06, interestExpense: 300000000, taxRate: 0.23,
    totalAssets: 10000000000, currentAssetsPct: 0.35, cashPct: 0.15,
    totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.50, longTermDebtPct: 0.30,
    shortTermDebtPct: 0.20, totalEquity: 4500000000, capexPct: 0.08,
    nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.06
  },
  {
    ticker: 'ALCN', name: 'Arab Paints & Chemicals', nameAr: 'العربية للدهانات',
    sector: 'Chemicals', industry: 'Paints & Coatings', marketCap: 3000000000, price: 20,
    sharesOutstanding: 150000000, beta: 0.85, dividendYield: 0.05, peRatio: 9.0,
    pbRatio: 1.4, eps: 2.22, bookValuePerShare: 14.29, fiftyTwoWeekHigh: 25, fiftyTwoWeekLow: 15,
    avgVolume: 500000, description: 'Leading paints and coatings manufacturer in Egypt.',
    descriptionAr: 'شركة رائدة في تصنيع الدهانات والمواد الكيميائية في مصر.',
    revenue: 3000000000, costOfRevenuePct: 0.62, operatingExpensesPct: 0.28,
    depreciationPct: 0.04, interestExpense: 100000000, taxRate: 0.23,
    totalAssets: 5000000000, currentAssetsPct: 0.50, cashPct: 0.18,
    totalLiabilitiesPct: 0.50, currentLiabilitiesPct: 0.60, longTermDebtPct: 0.20,
    shortTermDebtPct: 0.20, totalEquity: 2500000000, capexPct: 0.07,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.10
  },
  {
    ticker: 'EKRI', name: 'Edita Food Industries', nameAr: 'اديتا للصناعات الغذائية',
    sector: 'Food', industry: 'Snack Foods', marketCap: 10000000000, price: 18,
    sharesOutstanding: 555555556, beta: 0.8, dividendYield: 0.06, peRatio: 11.0,
    pbRatio: 2.0, eps: 1.64, bookValuePerShare: 9.0, fiftyTwoWeekHigh: 22, fiftyTwoWeekLow: 14,
    avgVolume: 1000000, description: "Leading snack food manufacturer with popular brands like HoHo's and Twinky.",
    descriptionAr: 'شركة رائدة في تصنيع الوجبات الخفيفة مع علامات تجارية شهيرة.',
    revenue: 8000000000, costOfRevenuePct: 0.60, operatingExpensesPct: 0.28,
    depreciationPct: 0.03, interestExpense: 200000000, taxRate: 0.23,
    totalAssets: 10000000000, currentAssetsPct: 0.45, cashPct: 0.20,
    totalLiabilitiesPct: 0.45, currentLiabilitiesPct: 0.65, longTermDebtPct: 0.15,
    shortTermDebtPct: 0.20, totalEquity: 5500000000, capexPct: 0.08,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.10
  },
  {
    ticker: 'BNQA', name: 'Banque du Caire', nameAr: 'بنك القاهرة',
    sector: 'Banking', industry: 'Commercial Banking', marketCap: 30000000000, price: 7,
    sharesOutstanding: 4285714286, beta: 0.9, dividendYield: 0.05, peRatio: 7.0,
    pbRatio: 1.0, eps: 1.00, bookValuePerShare: 7.0, fiftyTwoWeekHigh: 9, fiftyTwoWeekLow: 5,
    avgVolume: 8000000, description: 'Major state-owned bank providing retail and corporate banking services.',
    descriptionAr: 'بنك رئيسي مملوك للدولة يقدم الخدمات المصرفية للأفراد والشركات.',
    revenue: 22000000000, costOfRevenuePct: 0.28, operatingExpensesPct: 0.45,
    depreciationPct: 0.02, interestExpense: 8000000000, taxRate: 0.23,
    totalAssets: 350000000000, currentAssetsPct: 0.65, cashPct: 0.22,
    totalLiabilitiesPct: 0.90, currentLiabilitiesPct: 0.75, longTermDebtPct: 0.10,
    shortTermDebtPct: 0.15, totalEquity: 35000000000, capexPct: 0.03,
    nwcChangePct: 0.01, netBorrowingPct: 0.5, revenueGrowthRate: 0.15
  },
  {
    ticker: 'CAIE', name: 'Citibank Egypt', nameAr: 'سيتي بنك مصر',
    sector: 'Banking', industry: 'Commercial Banking', marketCap: 5000000000, price: 25,
    sharesOutstanding: 200000000, beta: 0.8, dividendYield: 0.04, peRatio: 9.0,
    pbRatio: 1.5, eps: 2.78, bookValuePerShare: 16.67, fiftyTwoWeekHigh: 30, fiftyTwoWeekLow: 19,
    avgVolume: 600000, description: 'Multinational bank operating in Egypt with focus on corporate and investment banking.',
    descriptionAr: 'بنك متعدد الجنسيات يعمل في مصر مع التركيز على الخدمات المصرفية للشركات والاستثمار.',
    revenue: 6000000000, costOfRevenuePct: 0.25, operatingExpensesPct: 0.48,
    depreciationPct: 0.02, interestExpense: 2000000000, taxRate: 0.23,
    totalAssets: 80000000000, currentAssetsPct: 0.68, cashPct: 0.28,
    totalLiabilitiesPct: 0.88, currentLiabilitiesPct: 0.75, longTermDebtPct: 0.12,
    shortTermDebtPct: 0.13, totalEquity: 9600000000, capexPct: 0.03,
    nwcChangePct: 0.01, netBorrowingPct: 0.4, revenueGrowthRate: 0.12
  },
  {
    ticker: 'ABUK', name: 'Abu Qir Fertilizers', nameAr: 'ابو قير للأسمدة',
    sector: 'Chemicals', industry: 'Fertilizers', marketCap: 50000000000, price: 35,
    sharesOutstanding: 1428571429, beta: 0.9, dividendYield: 0.08, peRatio: 7.5,
    pbRatio: 2.0, eps: 4.67, bookValuePerShare: 17.5, fiftyTwoWeekHigh: 42, fiftyTwoWeekLow: 26,
    avgVolume: 3500000, description: 'One of the largest nitrogen fertilizer producers in the Middle East.',
    descriptionAr: 'أحد أكبر منتجي الأسمدة النيتروجينية في الشرق الأوسط.',
    revenue: 30000000000, costOfRevenuePct: 0.65, operatingExpensesPct: 0.20,
    depreciationPct: 0.05, interestExpense: 600000000, taxRate: 0.23,
    totalAssets: 45000000000, currentAssetsPct: 0.35, cashPct: 0.20,
    totalLiabilitiesPct: 0.45, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.20, totalEquity: 24750000000, capexPct: 0.10,
    nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.10
  },
  {
    ticker: 'HAEL', name: 'Elsewedy Cables', nameAr: 'السويدي للكابلات',
    sector: 'Electrical Equipment', industry: 'Cables & Wires', marketCap: 20000000000, price: 22,
    sharesOutstanding: 909090909, beta: 1.1, dividendYield: 0.05, peRatio: 8.0,
    pbRatio: 1.3, eps: 2.75, bookValuePerShare: 16.92, fiftyTwoWeekHigh: 27, fiftyTwoWeekLow: 16,
    avgVolume: 3000000, description: 'Major cable manufacturer with global operations in energy and infrastructure.',
    descriptionAr: 'شركة كابلات كبرى بعمليات عالمية في الطاقة والبنية التحتية.',
    revenue: 40000000000, costOfRevenuePct: 0.72, operatingExpensesPct: 0.25,
    depreciationPct: 0.04, interestExpense: 1200000000, taxRate: 0.23,
    totalAssets: 50000000000, currentAssetsPct: 0.60, cashPct: 0.18,
    totalLiabilitiesPct: 0.65, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.20, totalEquity: 17500000000, capexPct: 0.08,
    nwcChangePct: 0.03, netBorrowingPct: 0.4, revenueGrowthRate: 0.14
  },
  {
    ticker: 'MNHD', name: 'Medinet Nasr Housing', nameAr: 'مساكن مدينة نصر',
    sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 8000000000, price: 6,
    sharesOutstanding: 1333333333, beta: 1.15, dividendYield: 0.04, peRatio: 8.0,
    pbRatio: 0.8, eps: 0.75, bookValuePerShare: 7.50, fiftyTwoWeekHigh: 8, fiftyTwoWeekLow: 4.5,
    avgVolume: 5000000, description: 'Real estate developer focused on mid-income housing in Greater Cairo.',
    descriptionAr: 'مطور عقاري يركز على الإسكان متوسط الدخل في القاهرة الكبرى.',
    revenue: 6000000000, costOfRevenuePct: 0.58, operatingExpensesPct: 0.25,
    depreciationPct: 0.02, interestExpense: 400000000, taxRate: 0.23,
    totalAssets: 18000000000, currentAssetsPct: 0.50, cashPct: 0.10,
    totalLiabilitiesPct: 0.60, currentLiabilitiesPct: 0.50, longTermDebtPct: 0.25,
    shortTermDebtPct: 0.25, totalEquity: 7200000000, capexPct: 0.12,
    nwcChangePct: 0.03, netBorrowingPct: 0.5, revenueGrowthRate: 0.16
  }
];

function generateFinancialData(stock: StockDefinition, year: number) {
  const rand = seededRandom(stock.ticker.charCodeAt(0) * 100 + year);
  const yearOffset = year - 2020;
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

function generatePriceHistory(stock: StockDefinition, days: number = 180) {
  const prices: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  const rand = seededRandom(stock.ticker.charCodeAt(0) * 1000 + stock.ticker.charCodeAt(1) * 100 + 42);

  let currentPrice = stock.fiftyTwoWeekLow + (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow) * 0.4;
  const dailyVolatility = 0.025; // 2.5% daily volatility
  const drift = 0.0003; // slight upward drift

  const startDate = new Date('2024-07-01');

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const randomReturn = drift + dailyVolatility * (rand() - 0.5 + (rand() - 0.5) + (rand() - 0.5));
    const open = currentPrice;
    const close = open * (1 + randomReturn);
    const intraHigh = Math.max(open, close) * (1 + rand() * 0.015);
    const intraLow = Math.min(open, close) * (1 - rand() * 0.015);
    const volume = Math.round(stock.avgVolume * (0.6 + rand() * 0.8));

    prices.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(intraHigh.toFixed(2)),
      low: parseFloat(Math.max(intraLow, 0.01).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    currentPrice = close;

    // Keep within 52-week range roughly
    if (currentPrice > stock.fiftyTwoWeekHigh * 1.05) currentPrice = stock.fiftyTwoWeekHigh * 0.95;
    if (currentPrice < stock.fiftyTwoWeekLow * 0.95) currentPrice = stock.fiftyTwoWeekLow * 1.05;
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
  { sector: 'Banking', avgPE: 8.8, avgPB: 1.43, avgEVEbitda: 6.5, avgDivYield: 0.05, avgROE: 0.18, avgROA: 0.02, avgDebtEquity: 5.5, totalMarketCap: 155000000000, numCompanies: 3 },
  { sector: 'Construction', avgPE: 8.5, avgPB: 1.2, avgEVEbitda: 7.0, avgDivYield: 0.03, avgROE: 0.15, avgROA: 0.05, avgDebtEquity: 1.2, totalMarketCap: 20000000000, numCompanies: 1 },
  { sector: 'Electrical Equipment', avgPE: 8.5, avgPB: 1.4, avgEVEbitda: 7.5, avgDivYield: 0.045, avgROE: 0.16, avgROA: 0.06, avgDebtEquity: 1.1, totalMarketCap: 50000000000, numCompanies: 2 },
  { sector: 'Financial Services', avgPE: 9.0, avgPB: 1.2, avgEVEbitda: 8.0, avgDivYield: 0.055, avgROE: 0.14, avgROA: 0.03, avgDebtEquity: 2.5, totalMarketCap: 43000000000, numCompanies: 2 },
  { sector: 'Telecommunications', avgPE: 12.0, avgPB: 1.0, avgEVEbitda: 5.5, avgDivYield: 0.07, avgROE: 0.12, avgROA: 0.05, avgDebtEquity: 0.8, totalMarketCap: 40000000000, numCompanies: 1 },
  { sector: 'Tobacco', avgPE: 12.5, avgPB: 3.5, avgEVEbitda: 9.0, avgDivYield: 0.08, avgROE: 0.40, avgROA: 0.20, avgDebtEquity: 0.3, totalMarketCap: 70000000000, numCompanies: 1 },
  { sector: 'Food', avgPE: 10.5, avgPB: 1.9, avgEVEbitda: 8.5, avgDivYield: 0.05, avgROE: 0.17, avgROA: 0.08, avgDebtEquity: 0.7, totalMarketCap: 22000000000, numCompanies: 2 },
  { sector: 'Real Estate', avgPE: 8.2, avgPB: 1.02, avgEVEbitda: 10.0, avgDivYield: 0.03, avgROE: 0.13, avgROA: 0.04, avgDebtEquity: 1.1, totalMarketCap: 113000000000, numCompanies: 5 },
  { sector: 'Tourism', avgPE: 10.0, avgPB: 0.7, avgEVEbitda: 9.0, avgDivYield: 0.02, avgROE: 0.08, avgROA: 0.03, avgDebtEquity: 1.5, totalMarketCap: 10000000000, numCompanies: 1 },
  { sector: 'Energy', avgPE: 9.0, avgPB: 0.85, avgEVEbitda: 6.0, avgDivYield: 0.035, avgROE: 0.10, avgROA: 0.04, avgDebtEquity: 2.0, totalMarketCap: 20000000000, numCompanies: 2 },
  { sector: 'Technology', avgPE: 25.0, avgPB: 5.0, avgEVEbitda: 18.0, avgDivYield: 0.02, avgROE: 0.22, avgROA: 0.10, avgDebtEquity: 0.5, totalMarketCap: 18000000000, numCompanies: 1 },
  { sector: 'Chemicals', avgPE: 8.2, avgPB: 1.63, avgEVEbitda: 7.0, avgDivYield: 0.067, avgROE: 0.20, avgROA: 0.10, avgDebtEquity: 0.6, totalMarketCap: 68000000000, numCompanies: 3 },
  { sector: 'Construction Materials', avgPE: 6.5, avgPB: 0.8, avgEVEbitda: 6.0, avgDivYield: 0.08, avgROE: 0.12, avgROA: 0.06, avgDebtEquity: 0.8, totalMarketCap: 5000000000, numCompanies: 1 },
];

const economicIndicators = [
  { name: 'GDP Growth Rate', nameAr: 'معدل نمو الناتج المحلي', value: 4.2, previousValue: 3.8, change: 0.4, unit: '%', source: 'CAPMAS', date: '2024-12-31' },
  { name: 'Inflation Rate', nameAr: 'معدل التضخم', value: 23.4, previousValue: 33.9, change: -10.5, unit: '%', source: 'CAPMAS', date: '2024-12-31' },
  { name: 'CBE Policy Rate', nameAr: 'سعر الفائدة الرئيسي', value: 27.25, previousValue: 27.75, change: -0.5, unit: '%', source: 'CBE', date: '2024-12-31' },
  { name: 'USD/EGP Rate', nameAr: 'سعر صرف الدولار', value: 48.5, previousValue: 30.9, change: 17.6, unit: 'EGP', source: 'CBE', date: '2024-12-31' },
  { name: 'Unemployment Rate', nameAr: 'معدل البطالة', value: 7.2, previousValue: 7.4, change: -0.2, unit: '%', source: 'CAPMAS', date: '2024-12-31' },
  { name: 'Foreign Reserves', nameAr: 'الاحتياطي الأجنبي', value: 47.0, previousValue: 35.2, change: 11.8, unit: 'Billion USD', source: 'CBE', date: '2024-12-31' },
  { name: 'Budget Deficit %', nameAr: 'عجز الموازنة', value: 6.2, previousValue: 7.0, change: -0.8, unit: '% GDP', source: 'MoF', date: '2024-12-31' },
  { name: 'Current Account % GDP', nameAr: 'الحساب الجاري', value: -2.8, previousValue: -3.5, change: 0.7, unit: '% GDP', source: 'CBE', date: '2024-12-31' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.technicalIndicator.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.valuationResult.deleteMany();
  await prisma.analystReport.deleteMany();
  await prisma.financialData.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.sectorStats.deleteMany();
  await prisma.economicIndicator.deleteMany();

  console.log('📊 Creating stocks and financial data...');

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
      }
    });

    // Generate 5 years of financial data (2020-2024)
    for (let year = 2020; year <= 2024; year++) {
      const financialData = generateFinancialData(stockDef, year);
      await prisma.financialData.create({
        data: {
          stockId: stock.id,
          ...financialData,
        }
      });
    }

    // Generate 180 days of price history
    const priceHistory = generatePriceHistory(stockDef, 180);
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

    console.log(`  ✅ ${stockDef.ticker} - ${stockDef.name}`);
  }

  console.log('📈 Creating sector stats...');
  for (const ss of sectorStats) {
    await prisma.sectorStats.create({ data: ss });
  }

  console.log('🌍 Creating economic indicators...');
  for (const ei of economicIndicators) {
    await prisma.economicIndicator.create({ data: ei });
  }

  console.log('🎉 Seed completed successfully!');
  console.log(`  - ${stocks.length} stocks created`);
  console.log(`  - ${stocks.length * 5} financial records created`);
  console.log(`  - Price history and technical indicators generated`);
  console.log(`  - ${sectorStats.length} sector stats created`);
  console.log(`  - ${economicIndicators.length} economic indicators created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
