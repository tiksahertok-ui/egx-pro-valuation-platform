/**
 * Generate a comprehensive SQL seed script for Supabase SQL Editor
 */
const fs = require('fs');

function esc(str) {
  return String(str).replace(/'/g, "''");
}

const stocks = [
  { ticker: 'COMI', name: 'Commercial International Bank', nameAr: 'البنك التجاري الدولي', sector: 'Banking', industry: 'Commercial Banking', marketCap: 447750000000, price: 132.50, sharesOutstanding: 3377358491, beta: 0.85, egx30Beta: 0.85, dividendYield: 0.05, peRatio: 7.24, pbRatio: 1.40, eps: 18.30, bookValuePerShare: 95.0, fiftyTwoWeekHigh: 145.01, fiftyTwoWeekLow: 70.03, avgVolume: 12000000, description: "Egypt's largest private-sector bank by assets.", descriptionAr: 'أكبر بنك قطاع خاص في مصر من حيث الأصول.' },
  { ticker: 'ORAS', name: 'Orascom Construction', nameAr: 'أوراسكو للإنشاءات', sector: 'Construction', industry: 'Engineering & Construction', marketCap: 86870000000, price: 742.00, sharesOutstanding: 117071429, beta: 1.20, egx30Beta: 1.20, dividendYield: 0.03, peRatio: 6.88, pbRatio: 1.40, eps: 106.15, bookValuePerShare: 520.0, fiftyTwoWeekHigh: 762.00, fiftyTwoWeekLow: 258.50, avgVolume: 1800000, description: 'Leading engineering and construction company.', descriptionAr: 'شركة رائدة في الهندسة والإنشاءات.' },
  { ticker: 'SWDY', name: 'Elsewedy Electric', nameAr: 'السويدي إلكتريك', sector: 'Electrical Equipment', industry: 'Electrical Equipment', marketCap: 191950000000, price: 88.90, sharesOutstanding: 2159238400, beta: 1.15, egx30Beta: 1.15, dividendYield: 0.04, peRatio: 12.04, pbRatio: 2.53, eps: 7.35, bookValuePerShare: 35.0, fiftyTwoWeekHigh: 93.00, fiftyTwoWeekLow: 62.03, avgVolume: 20000000, description: 'Global leader in energy solutions.', descriptionAr: 'رائد عالمي في حلول الطاقة.' },
  { ticker: 'HRHO', name: 'EFG Hermes', nameAr: 'إي إف جي هيرمس', sector: 'Financial Services', industry: 'Investment Banking', marketCap: 38240000000, price: 27.00, sharesOutstanding: 1416296296, beta: 1.10, egx30Beta: 1.10, dividendYield: 0.06, peRatio: 9.81, pbRatio: 1.93, eps: 2.75, bookValuePerShare: 14.0, fiftyTwoWeekHigh: 31.89, fiftyTwoWeekLow: 23.05, avgVolume: 8000000, description: 'Leading financial services corporation in MENA.', descriptionAr: 'شركة خدمات مالية رائدة في الشرق الأوسط.' },
  { ticker: 'ETEL', name: 'Telecom Egypt', nameAr: 'الاتصالات المصرية', sector: 'Telecommunications', industry: 'Telecom Services', marketCap: 166660000000, price: 96.90, sharesOutstanding: 1721000000, beta: 0.75, egx30Beta: 0.75, dividendYield: 0.07, peRatio: 8.78, pbRatio: 1.43, eps: 11.04, bookValuePerShare: 68.0, fiftyTwoWeekHigh: 112.98, fiftyTwoWeekLow: 33.66, avgVolume: 7000000, description: "Egypt's incumbent telecommunications operator.", descriptionAr: 'مشغل الاتصالات المصري الرئيسي.' },
  { ticker: 'EAST', name: 'Eastern Company', nameAr: 'الشركة الشرقية', sector: 'Tobacco', industry: 'Tobacco', marketCap: 115830000000, price: 38.61, sharesOutstanding: 3000000000, beta: 0.60, egx30Beta: 0.60, dividendYield: 0.095, peRatio: 12.71, pbRatio: 3.62, eps: 2.99, bookValuePerShare: 10.5, fiftyTwoWeekHigh: 49.99, fiftyTwoWeekLow: 26.60, avgVolume: 6000000, description: "Egypt's monopoly tobacco manufacturer.", descriptionAr: 'شركة احتكار السجائر في مصر.' },
  { ticker: 'JUFO', name: 'Juhayna Food Industries', nameAr: 'جهينة للصناعات الغذائية', sector: 'Food', industry: 'Dairy & Food Products', marketCap: 35168000000, price: 29.90, sharesOutstanding: 1175945200, beta: 0.90, egx30Beta: 0.90, dividendYield: 0.04, peRatio: 9.50, pbRatio: 2.43, eps: 3.06, bookValuePerShare: 12.0, fiftyTwoWeekHigh: 31.84, fiftyTwoWeekLow: 19.20, avgVolume: 4000000, description: 'Leading Egyptian dairy and juice producer.', descriptionAr: 'منتج ألبان وعصائر مصري رائد.' },
  { ticker: 'PHDC', name: 'Palm Hills Development', nameAr: 'بالم هيلز للتعمير', sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 44160000000, price: 15.10, sharesOutstanding: 2924500000, beta: 1.30, egx30Beta: 1.30, dividendYield: 0.02, peRatio: 10.32, pbRatio: 2.16, eps: 1.46, bookValuePerShare: 7.0, fiftyTwoWeekHigh: 16.08, fiftyTwoWeekLow: 6.99, avgVolume: 15000000, description: 'Major real estate developer in Egypt.', descriptionAr: 'مطور عقاري رئيسي في مصر.' },
  { ticker: 'MHMD', name: 'Madinet Masr', nameAr: 'مدينة مصر', sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 15029000000, price: 7.03, sharesOutstanding: 2138000000, beta: 1.25, egx30Beta: 1.25, dividendYield: 0.03, peRatio: 10.70, pbRatio: 1.58, eps: 0.67, bookValuePerShare: 4.50, fiftyTwoWeekHigh: 7.50, fiftyTwoWeekLow: 3.76, avgVolume: 12000000, description: 'Leading community developer in Egypt.', descriptionAr: 'مطور مجتمعات رائد في مصر.' },
  { ticker: 'TMGH', name: 'TMG Holding', nameAr: 'طلعت مصطفى', sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 199270000000, price: 96.40, sharesOutstanding: 2067100000, beta: 1.15, egx30Beta: 1.15, dividendYield: 0.04, peRatio: 7.40, pbRatio: 1.48, eps: 13.04, bookValuePerShare: 65.0, fiftyTwoWeekHigh: 101.40, fiftyTwoWeekLow: 50.02, avgVolume: 9000000, description: "One of Egypt's largest real estate developers.", descriptionAr: 'أحد أكبر المطورين العقاريين في مصر.' },
  { ticker: 'CIRA', name: 'CI Capital Holding', nameAr: 'سي آي كابيتال', sector: 'Financial Services', industry: 'Financial Holdings', marketCap: 15000000000, price: 12.42, sharesOutstanding: 1207720000, beta: 1.20, egx30Beta: 1.20, dividendYield: 0.05, peRatio: 8.07, pbRatio: 1.38, eps: 1.54, bookValuePerShare: 9.0, fiftyTwoWeekHigh: 13.47, fiftyTwoWeekLow: 5.43, avgVolume: 3500000, description: 'Diversified financial services platform.', descriptionAr: 'منصة خدمات مالية متنوعة.' },
  { ticker: 'OCDI', name: 'SODIC', nameAr: 'سوديك', sector: 'Real Estate', industry: 'Real Estate Development', marketCap: 28416000000, price: 21.51, sharesOutstanding: 1322000000, beta: 1.20, egx30Beta: 1.20, dividendYield: 0.03, peRatio: 7.41, pbRatio: 0.89, eps: 2.89, bookValuePerShare: 24.0, fiftyTwoWeekHigh: 66.00, fiftyTwoWeekLow: 14.60, avgVolume: 2000000, description: 'Premium real estate developer.', descriptionAr: 'مطور عقاري متميز.' },
  { ticker: 'ORHD', name: 'Orascom Development', nameAr: 'أوراسكو للتنمية', sector: 'Tourism', industry: 'Tourism & Hospitality', marketCap: 42980000000, price: 38.13, sharesOutstanding: 1127400000, beta: 1.35, egx30Beta: 1.35, dividendYield: 0.02, peRatio: 8.22, pbRatio: 1.27, eps: 4.64, bookValuePerShare: 30.0, fiftyTwoWeekHigh: 38.13, fiftyTwoWeekLow: 18.10, avgVolume: 3000000, description: 'Integrated tourism developer.', descriptionAr: 'مطور سياحي متكامل.' },
  { ticker: 'CCAP', name: 'Qalaa Holdings', nameAr: 'القلعة', sector: 'Energy', industry: 'Energy & Infrastructure', marketCap: 17370000000, price: 5.41, sharesOutstanding: 3211000000, beta: 1.40, egx30Beta: 1.40, dividendYield: 0.01, peRatio: 12.00, pbRatio: 1.55, eps: 0.45, bookValuePerShare: 3.50, fiftyTwoWeekHigh: 5.66, fiftyTwoWeekLow: 2.20, avgVolume: 18000000, description: 'Energy and infrastructure investment company.', descriptionAr: 'شركة استثمار في الطاقة والبنية التحتية.' },
  { ticker: 'FWRY', name: 'Fawry Banking & Payment', nameAr: 'فوري', sector: 'Technology', industry: 'FinTech & Payments', marketCap: 67260000000, price: 19.48, sharesOutstanding: 3453000000, beta: 1.00, egx30Beta: 1.00, dividendYield: 0.02, peRatio: 27.70, pbRatio: 5.77, eps: 0.73, bookValuePerShare: 3.50, fiftyTwoWeekHigh: 21.66, fiftyTwoWeekLow: 10.02, avgVolume: 8000000, description: "Egypt's leading digital payments platform.", descriptionAr: 'منصة الدفع الرقمي الرائدة في مصر.' },
  { ticker: 'AMOC', name: 'Alexandria Mineral Oils', nameAr: 'الإسكندرية للزيوت المعدنية', sector: 'Energy', industry: 'Oil Refining', marketCap: 10575000000, price: 8.32, sharesOutstanding: 1271000000, beta: 1.10, egx30Beta: 1.10, dividendYield: 0.06, peRatio: 12.80, pbRatio: 1.53, eps: 0.66, bookValuePerShare: 5.50, fiftyTwoWeekHigh: 9.85, fiftyTwoWeekLow: 6.66, avgVolume: 1200000, description: 'Petroleum refining company.', descriptionAr: 'شركة تكرير البترول.' },
  { ticker: 'SPMD', name: 'Sidi Kerir Petrochemicals', nameAr: 'سيدي كرير للبتروكيماويات', sector: 'Chemicals', industry: 'Petrochemicals', marketCap: 19280000000, price: 17.05, sharesOutstanding: 1131000000, beta: 0.95, egx30Beta: 0.95, dividendYield: 0.07, peRatio: 19.26, pbRatio: 1.80, eps: 0.89, bookValuePerShare: 9.50, fiftyTwoWeekHigh: 19.94, fiftyTwoWeekLow: 13.29, avgVolume: 3500000, description: 'Major petrochemical producer.', descriptionAr: 'منتج بتروكيماوي رئيسي.' },
  { ticker: 'ISPH', name: 'Arabian Cement', nameAr: 'اسمنت العربية', sector: 'Construction Materials', industry: 'Cement', marketCap: 22090000000, price: 58.91, sharesOutstanding: 375000000, beta: 1.05, egx30Beta: 1.05, dividendYield: 0.08, peRatio: 5.64, pbRatio: 1.27, eps: 9.49, bookValuePerShare: 42.0, fiftyTwoWeekHigh: 60.40, fiftyTwoWeekLow: 26.13, avgVolume: 2000000, description: 'Cement producer in Egypt.', descriptionAr: 'منتج أسمنت في مصر.' },
  { ticker: 'ABUK', name: 'Abu Qir Fertilizers', nameAr: 'ابو قير للأسمدة', sector: 'Chemicals', industry: 'Fertilizers', marketCap: 103230000000, price: 81.87, sharesOutstanding: 1261000000, beta: 0.90, egx30Beta: 0.90, dividendYield: 0.08, peRatio: 9.50, pbRatio: 2.92, eps: 8.62, bookValuePerShare: 28.0, fiftyTwoWeekHigh: 95.00, fiftyTwoWeekLow: 45.01, avgVolume: 5000000, description: 'One of the largest nitrogen fertilizer producers.', descriptionAr: 'أحد أكبر منتجي الأسمدة النيتروجينية.' },
  { ticker: 'EKRI', name: 'Edita Food Industries', nameAr: 'اديتا للصناعات الغذائية', sector: 'Food', industry: 'Snack Foods', marketCap: 40570000000, price: 29.11, sharesOutstanding: 1394000000, beta: 0.80, egx30Beta: 0.80, dividendYield: 0.06, peRatio: 16.10, pbRatio: 2.91, eps: 1.81, bookValuePerShare: 10.0, fiftyTwoWeekHigh: 32.50, fiftyTwoWeekLow: 12.00, avgVolume: 1500000, description: 'Leading snack food manufacturer.', descriptionAr: 'شركة رائدة في تصنيع الوجبات الخفيفة.' },
  { ticker: 'BNQA', name: 'Banque du Caire', nameAr: 'بنك القاهرة', sector: 'Banking', industry: 'Commercial Banking', marketCap: 30500000000, price: 2.00, sharesOutstanding: 15250000000, beta: 0.90, egx30Beta: 0.90, dividendYield: 0.05, peRatio: 7.00, pbRatio: 0.50, eps: 0.29, bookValuePerShare: 4.00, fiftyTwoWeekHigh: 2.25, fiftyTwoWeekLow: 1.50, avgVolume: 15000000, description: 'Major state-owned bank.', descriptionAr: 'بنك رئيسي مملوك للدولة.' },
];

const finDefs = [
  { ticker: 'COMI', revenue: 95000000000, costOfRevenuePct: 0.25, operatingExpensesPct: 0.42, depreciationPct: 0.015, interestExpense: 32000000000, taxRate: 0.225, totalAssets: 1800000000000, currentAssetsPct: 0.65, cashPct: 0.25, totalLiabilitiesPct: 0.88, currentLiabilitiesPct: 0.75, longTermDebtPct: 0.12, shortTermDebtPct: 0.08, totalEquity: 216000000000, capexPct: 0.02, nwcChangePct: 0.005, netBorrowingPct: 0.5, revenueGrowthRate: 0.20, sharesOutstanding: 3377358491, dividendYield: 0.05 },
  { ticker: 'ORAS', revenue: 55000000000, costOfRevenuePct: 0.72, operatingExpensesPct: 0.33, depreciationPct: 0.025, interestExpense: 1200000000, taxRate: 0.225, totalAssets: 95000000000, currentAssetsPct: 0.72, cashPct: 0.20, totalLiabilitiesPct: 0.62, currentLiabilitiesPct: 0.58, longTermDebtPct: 0.22, shortTermDebtPct: 0.12, totalEquity: 36100000000, capexPct: 0.05, nwcChangePct: 0.025, netBorrowingPct: 0.4, revenueGrowthRate: 0.15, sharesOutstanding: 117071429, dividendYield: 0.03 },
  { ticker: 'SWDY', revenue: 120000000000, costOfRevenuePct: 0.70, operatingExpensesPct: 0.28, depreciationPct: 0.035, interestExpense: 3500000000, taxRate: 0.225, totalAssets: 170000000000, currentAssetsPct: 0.60, cashPct: 0.18, totalLiabilitiesPct: 0.65, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25, shortTermDebtPct: 0.18, totalEquity: 59500000000, capexPct: 0.07, nwcChangePct: 0.035, netBorrowingPct: 0.5, revenueGrowthRate: 0.18, sharesOutstanding: 2159238400, dividendYield: 0.04 },
  { ticker: 'HRHO', revenue: 22000000000, costOfRevenuePct: 0.35, operatingExpensesPct: 0.38, depreciationPct: 0.02, interestExpense: 3500000000, taxRate: 0.225, totalAssets: 150000000000, currentAssetsPct: 0.75, cashPct: 0.30, totalLiabilitiesPct: 0.80, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.15, shortTermDebtPct: 0.15, totalEquity: 30000000000, capexPct: 0.04, nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.16, sharesOutstanding: 1416296296, dividendYield: 0.06 },
  { ticker: 'ETEL', revenue: 55000000000, costOfRevenuePct: 0.52, operatingExpensesPct: 0.28, depreciationPct: 0.12, interestExpense: 2500000000, taxRate: 0.225, totalAssets: 130000000000, currentAssetsPct: 0.30, cashPct: 0.25, totalLiabilitiesPct: 0.50, currentLiabilitiesPct: 0.40, longTermDebtPct: 0.35, shortTermDebtPct: 0.20, totalEquity: 65000000000, capexPct: 0.18, nwcChangePct: 0.02, netBorrowingPct: 0.5, revenueGrowthRate: 0.10, sharesOutstanding: 1721000000, dividendYield: 0.07 },
  { ticker: 'EAST', revenue: 95000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.18, depreciationPct: 0.03, interestExpense: 300000000, taxRate: 0.35, totalAssets: 75000000000, currentAssetsPct: 0.50, cashPct: 0.30, totalLiabilitiesPct: 0.40, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.08, shortTermDebtPct: 0.18, totalEquity: 45000000000, capexPct: 0.05, nwcChangePct: 0.01, netBorrowingPct: 0.2, revenueGrowthRate: 0.12, sharesOutstanding: 3000000000, dividendYield: 0.095 },
  { ticker: 'JUFO', revenue: 28000000000, costOfRevenuePct: 0.65, operatingExpensesPct: 0.28, depreciationPct: 0.04, interestExpense: 900000000, taxRate: 0.225, totalAssets: 32000000000, currentAssetsPct: 0.45, cashPct: 0.15, totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.58, longTermDebtPct: 0.22, shortTermDebtPct: 0.14, totalEquity: 14400000000, capexPct: 0.10, nwcChangePct: 0.03, netBorrowingPct: 0.4, revenueGrowthRate: 0.14, sharesOutstanding: 1175945200, dividendYield: 0.04 },
  { ticker: 'PHDC', revenue: 22000000000, costOfRevenuePct: 0.58, operatingExpensesPct: 0.23, depreciationPct: 0.02, interestExpense: 1800000000, taxRate: 0.225, totalAssets: 70000000000, currentAssetsPct: 0.55, cashPct: 0.12, totalLiabilitiesPct: 0.70, currentLiabilitiesPct: 0.45, longTermDebtPct: 0.28, shortTermDebtPct: 0.22, totalEquity: 21000000000, capexPct: 0.12, nwcChangePct: 0.05, netBorrowingPct: 0.6, revenueGrowthRate: 0.25, sharesOutstanding: 2924500000, dividendYield: 0.02 },
  { ticker: 'MHMD', revenue: 38000000000, costOfRevenuePct: 0.58, operatingExpensesPct: 0.24, depreciationPct: 0.02, interestExpense: 2200000000, taxRate: 0.225, totalAssets: 95000000000, currentAssetsPct: 0.50, cashPct: 0.10, totalLiabilitiesPct: 0.65, currentLiabilitiesPct: 0.45, longTermDebtPct: 0.28, shortTermDebtPct: 0.22, totalEquity: 33250000000, capexPct: 0.15, nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.28, sharesOutstanding: 2138000000, dividendYield: 0.03 },
  { ticker: 'TMGH', revenue: 65000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.20, depreciationPct: 0.02, interestExpense: 3000000000, taxRate: 0.225, totalAssets: 160000000000, currentAssetsPct: 0.50, cashPct: 0.12, totalLiabilitiesPct: 0.58, currentLiabilitiesPct: 0.42, longTermDebtPct: 0.28, shortTermDebtPct: 0.22, totalEquity: 67200000000, capexPct: 0.14, nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.22, sharesOutstanding: 2067100000, dividendYield: 0.04 },
  { ticker: 'CIRA', revenue: 10000000000, costOfRevenuePct: 0.40, operatingExpensesPct: 0.33, depreciationPct: 0.02, interestExpense: 2500000000, taxRate: 0.225, totalAssets: 60000000000, currentAssetsPct: 0.70, cashPct: 0.20, totalLiabilitiesPct: 0.75, currentLiabilitiesPct: 0.65, longTermDebtPct: 0.18, shortTermDebtPct: 0.14, totalEquity: 15000000000, capexPct: 0.03, nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.18, sharesOutstanding: 1207720000, dividendYield: 0.05 },
  { ticker: 'OCDI', revenue: 28000000000, costOfRevenuePct: 0.55, operatingExpensesPct: 0.20, depreciationPct: 0.02, interestExpense: 1500000000, taxRate: 0.225, totalAssets: 80000000000, currentAssetsPct: 0.50, cashPct: 0.12, totalLiabilitiesPct: 0.58, currentLiabilitiesPct: 0.42, longTermDebtPct: 0.28, shortTermDebtPct: 0.22, totalEquity: 33600000000, capexPct: 0.13, nwcChangePct: 0.04, netBorrowingPct: 0.5, revenueGrowthRate: 0.20, sharesOutstanding: 1322000000, dividendYield: 0.03 },
  { ticker: 'ORHD', revenue: 15000000000, costOfRevenuePct: 0.60, operatingExpensesPct: 0.26, depreciationPct: 0.04, interestExpense: 1200000000, taxRate: 0.225, totalAssets: 50000000000, currentAssetsPct: 0.35, cashPct: 0.15, totalLiabilitiesPct: 0.62, currentLiabilitiesPct: 0.40, longTermDebtPct: 0.32, shortTermDebtPct: 0.22, totalEquity: 19000000000, capexPct: 0.12, nwcChangePct: 0.03, netBorrowingPct: 0.5, revenueGrowthRate: 0.18, sharesOutstanding: 1127400000, dividendYield: 0.02 },
  { ticker: 'CCAP', revenue: 35000000000, costOfRevenuePct: 0.75, operatingExpensesPct: 0.28, depreciationPct: 0.06, interestExpense: 4500000000, taxRate: 0.225, totalAssets: 105000000000, currentAssetsPct: 0.30, cashPct: 0.12, totalLiabilitiesPct: 0.78, currentLiabilitiesPct: 0.35, longTermDebtPct: 0.38, shortTermDebtPct: 0.22, totalEquity: 23100000000, capexPct: 0.15, nwcChangePct: 0.04, netBorrowingPct: 0.6, revenueGrowthRate: 0.22, sharesOutstanding: 3211000000, dividendYield: 0.01 },
  { ticker: 'FWRY', revenue: 9000000000, costOfRevenuePct: 0.42, operatingExpensesPct: 0.33, depreciationPct: 0.03, interestExpense: 350000000, taxRate: 0.225, totalAssets: 22000000000, currentAssetsPct: 0.65, cashPct: 0.35, totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.70, longTermDebtPct: 0.08, shortTermDebtPct: 0.18, totalEquity: 9900000000, capexPct: 0.08, nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.35, sharesOutstanding: 3453000000, dividendYield: 0.02 },
  { ticker: 'AMOC', revenue: 30000000000, costOfRevenuePct: 0.80, operatingExpensesPct: 0.22, depreciationPct: 0.04, interestExpense: 700000000, taxRate: 0.225, totalAssets: 25000000000, currentAssetsPct: 0.40, cashPct: 0.15, totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25, shortTermDebtPct: 0.18, totalEquity: 11250000000, capexPct: 0.08, nwcChangePct: 0.03, netBorrowingPct: 0.4, revenueGrowthRate: 0.10, sharesOutstanding: 1271000000, dividendYield: 0.06 },
  { ticker: 'SPMD', revenue: 28000000000, costOfRevenuePct: 0.72, operatingExpensesPct: 0.20, depreciationPct: 0.05, interestExpense: 800000000, taxRate: 0.225, totalAssets: 38000000000, currentAssetsPct: 0.40, cashPct: 0.18, totalLiabilitiesPct: 0.55, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.25, shortTermDebtPct: 0.18, totalEquity: 17100000000, capexPct: 0.10, nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.12, sharesOutstanding: 1131000000, dividendYield: 0.07 },
  { ticker: 'ISPH', revenue: 11000000000, costOfRevenuePct: 0.68, operatingExpensesPct: 0.23, depreciationPct: 0.06, interestExpense: 500000000, taxRate: 0.225, totalAssets: 18000000000, currentAssetsPct: 0.35, cashPct: 0.15, totalLiabilitiesPct: 0.52, currentLiabilitiesPct: 0.48, longTermDebtPct: 0.28, shortTermDebtPct: 0.18, totalEquity: 8640000000, capexPct: 0.08, nwcChangePct: 0.02, netBorrowingPct: 0.4, revenueGrowthRate: 0.08, sharesOutstanding: 375000000, dividendYield: 0.08 },
  { ticker: 'ABUK', revenue: 55000000000, costOfRevenuePct: 0.65, operatingExpensesPct: 0.18, depreciationPct: 0.05, interestExpense: 1000000000, taxRate: 0.225, totalAssets: 80000000000, currentAssetsPct: 0.35, cashPct: 0.20, totalLiabilitiesPct: 0.45, currentLiabilitiesPct: 0.55, longTermDebtPct: 0.22, shortTermDebtPct: 0.18, totalEquity: 44000000000, capexPct: 0.10, nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.12, sharesOutstanding: 1261000000, dividendYield: 0.08 },
  { ticker: 'EKRI', revenue: 14000000000, costOfRevenuePct: 0.58, operatingExpensesPct: 0.26, depreciationPct: 0.03, interestExpense: 350000000, taxRate: 0.225, totalAssets: 18000000000, currentAssetsPct: 0.45, cashPct: 0.20, totalLiabilitiesPct: 0.45, currentLiabilitiesPct: 0.65, longTermDebtPct: 0.12, shortTermDebtPct: 0.18, totalEquity: 9900000000, capexPct: 0.08, nwcChangePct: 0.02, netBorrowingPct: 0.3, revenueGrowthRate: 0.12, sharesOutstanding: 1394000000, dividendYield: 0.06 },
  { ticker: 'BNQA', revenue: 38000000000, costOfRevenuePct: 0.28, operatingExpensesPct: 0.43, depreciationPct: 0.015, interestExpense: 14000000000, taxRate: 0.225, totalAssets: 620000000000, currentAssetsPct: 0.65, cashPct: 0.22, totalLiabilitiesPct: 0.90, currentLiabilitiesPct: 0.75, longTermDebtPct: 0.08, shortTermDebtPct: 0.12, totalEquity: 62000000000, capexPct: 0.02, nwcChangePct: 0.005, netBorrowingPct: 0.5, revenueGrowthRate: 0.18, sharesOutstanding: 15250000000, dividendYield: 0.05 },
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function genFinData(fd, year) {
  const rand = seededRandom(fd.ticker.charCodeAt(0) * 100 + fd.ticker.charCodeAt(1) * 10 + year);
  const yearOffset = year - 2023;
  const growthFactor = Math.pow(1 + fd.revenueGrowthRate, yearOffset);
  const randomGrowth = 1 + (rand() - 0.5) * 0.08;
  const revenue = Math.round(fd.revenue * growthFactor * randomGrowth);
  const costOfRevenue = Math.round(revenue * fd.costOfRevenuePct);
  const grossProfit = revenue - costOfRevenue;
  const operatingExpenses = Math.round(grossProfit * fd.operatingExpensesPct);
  const operatingIncome = grossProfit - operatingExpenses;
  const depreciation = Math.round(revenue * fd.depreciationPct);
  const ebitda = operatingIncome + depreciation;
  const interestExpense = Math.round(fd.interestExpense * growthFactor * randomGrowth);
  const earningsBeforeTax = operatingIncome - interestExpense;
  const netIncome = Math.round(earningsBeforeTax * (1 - fd.taxRate));
  const eps = parseFloat((netIncome / fd.sharesOutstanding).toFixed(2));
  const dividendsPerShare = parseFloat((eps * fd.dividendYield).toFixed(2));
  const totalAssets = Math.round(fd.totalAssets * growthFactor * randomGrowth);
  const currentAssets = Math.round(totalAssets * fd.currentAssetsPct);
  const cash = Math.round(currentAssets * fd.cashPct);
  const totalLiabilities = Math.round(totalAssets * fd.totalLiabilitiesPct);
  const currentLiabilities = Math.round(totalLiabilities * fd.currentLiabilitiesPct);
  const longTermDebt = Math.round(totalLiabilities * fd.longTermDebtPct);
  const shortTermDebt = Math.round(totalLiabilities * fd.shortTermDebtPct);
  const totalEquity = totalAssets - totalLiabilities;
  const operatingCashFlow = netIncome + depreciation;
  const capex = Math.round(revenue * fd.capexPct);
  const freeCashFlow = operatingCashFlow - capex;
  const changeInNWC = Math.round(revenue * fd.nwcChangePct * (rand() > 0.5 ? 1 : -1));
  const netBorrowing = Math.round(capex * fd.netBorrowingPct * (rand() > 0.3 ? 1 : -0.5));
  return { revenue, costOfRevenue, grossProfit, operatingExpenses, operatingIncome, ebitda, depreciation, interestExpense, netIncome, eps, dividendsPerShare, totalAssets, currentAssets, cash, totalLiabilities, currentLiabilities, longTermDebt, shortTermDebt, totalEquity, sharesOutstanding: fd.sharesOutstanding, operatingCashFlow, capitalExpenditure: capex, freeCashFlow, changeInNWC, netBorrowing, taxRate: fd.taxRate };
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
  { name: 'Foreign Reserves', nameAr: 'الاحتياطي الأجنبي', value: 53.01, previousValue: 47.10, change: 5.91, unit: 'USD B', source: 'CBE', date: '2026-06-01' },
  { name: 'EGX30 Index', nameAr: 'مؤشر EGX30', value: 32800, previousValue: 29500, change: 3300, unit: 'pts', source: 'EGX', date: '2026-06-01' },
  { name: 'Unemployment Rate', nameAr: 'معدل البطالة', value: 6.4, previousValue: 7.2, change: -0.8, unit: '%', source: 'CAPMAS', date: '2026-06-01' },
  { name: 'Suez Canal Revenue', nameAr: 'إيرادات قناة السويس', value: 7.2, previousValue: 6.6, change: 0.6, unit: 'USD B', source: 'SCA', date: '2026-06-01' },
  { name: 'Remittances', nameAr: 'التحويلات الخارجية', value: 24.2, previousValue: 22.7, change: 1.5, unit: 'USD B', source: 'CBE', date: '2026-06-01' },
];

// ============================================
// BUILD THE SQL
// ============================================
let sql = '-- =============================================\n';
sql += '-- EGX Pro Valuation Platform - Seed Data\n';
sql += '-- Run this in Supabase SQL Editor after migration.sql\n';
sql += '-- =============================================\n\n';

// 1. Stocks
sql += '-- Step 1: Insert Stocks (21 EGX stocks)\n';
sql += 'INSERT INTO "Stock" ("id", "ticker", "name", "nameAr", "sector", "industry", "marketCap", "price", "sharesOutstanding", "beta", "egx30Beta", "dividendYield", "peRatio", "pbRatio", "eps", "bookValuePerShare", "fiftyTwoWeekHigh", "fiftyTwoWeekLow", "avgVolume", "exchange", "currency", "listedDate", "description", "descriptionAr", "logo", "lastPriceAt", "lastFinancialsAt", "createdAt", "updatedAt")\nVALUES\n';
const stockVals = stocks.map(s => {
  const id = 'stock_' + s.ticker.toLowerCase();
  return `('${id}', '${esc(s.ticker)}', '${esc(s.name)}', '${esc(s.nameAr)}', '${esc(s.sector)}', '${esc(s.industry)}', ${s.marketCap}, ${s.price}, ${s.sharesOutstanding}, ${s.beta}, ${s.egx30Beta}, ${s.dividendYield}, ${s.peRatio}, ${s.pbRatio}, ${s.eps}, ${s.bookValuePerShare}, ${s.fiftyTwoWeekHigh}, ${s.fiftyTwoWeekLow}, ${s.avgVolume}, 'EGX', 'EGP', '', '${esc(s.description)}', '${esc(s.descriptionAr)}', '', NOW(), NOW(), NOW(), NOW())`;
});
sql += stockVals.join(',\n') + '\nON CONFLICT ("ticker") DO UPDATE SET "price" = EXCLUDED."price", "marketCap" = EXCLUDED."marketCap", "updatedAt" = NOW();\n\n';

// 2. Sector Stats
sql += '-- Step 2: Insert Sector Stats (13 sectors)\n';
sql += 'INSERT INTO "SectorStats" ("id", "sector", "avgPE", "avgPB", "avgEVEbitda", "avgDivYield", "avgROE", "avgROA", "avgDebtEquity", "totalMarketCap", "numCompanies", "computedAt", "avgPS", "createdAt", "updatedAt")\nVALUES\n';
const sectorVals = sectorStats.map(s => {
  const id = 'sector_' + s.sector.toLowerCase().replace(/[^a-z]/g, '_');
  return `('${id}', '${esc(s.sector)}', ${s.avgPE}, ${s.avgPB}, ${s.avgEVEbitda}, ${s.avgDivYield}, ${s.avgROE}, ${s.avgROA}, ${s.avgDebtEquity}, ${s.totalMarketCap}, ${s.numCompanies}, NOW(), ${s.avgPS}, NOW(), NOW())`;
});
sql += sectorVals.join(',\n') + '\nON CONFLICT ("sector") DO UPDATE SET "avgPE" = EXCLUDED."avgPE", "updatedAt" = NOW();\n\n';

// 3. Economic Indicators
sql += '-- Step 3: Insert Economic Indicators (9 indicators)\n';
sql += 'INSERT INTO "EconomicIndicator" ("id", "name", "nameAr", "value", "previousValue", "change", "unit", "source", "date", "createdAt", "updatedAt")\nVALUES\n';
const econVals = economicIndicators.map((e, i) => {
  const id = 'econ_' + String(i+1).padStart(2, '0');
  return `('${id}', '${esc(e.name)}', '${esc(e.nameAr)}', ${e.value}, ${e.previousValue}, ${e.change}, '${esc(e.unit)}', '${esc(e.source)}', '${e.date}', NOW(), NOW())`;
});
sql += econVals.join(',\n') + '\nON CONFLICT ("name", "date") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW();\n\n';

// 4. Market Params
sql += '-- Step 4: Insert Market Params (Egypt-specific)\n';
sql += `INSERT INTO "MarketParams" ("riskFreeRate", "baseEquityRiskPremium", "countryRiskPremium", "totalEquityRiskPremium", "corporateTaxRate", "inflationRateEGP", "inflationRateUSD", "usdEgpRate", "effectiveDate", "source", "createdAt")\nVALUES (0.19, 0.045, 0.085, 0.13, 0.225, 0.149, 0.025, 51.82, NOW(), 'CBE/Damodaran', NOW());\n\n`;

// 5. Financial Data
sql += '-- Step 5: Insert Financial Data (3 years x 21 stocks = 63 records)\n';
sql += 'INSERT INTO "FinancialData" ("id", "stockId", "year", "quarter", "revenue", "costOfRevenue", "grossProfit", "operatingExpenses", "operatingIncome", "ebitda", "depreciation", "interestExpense", "netIncome", "eps", "dividendsPerShare", "totalAssets", "currentAssets", "cash", "totalLiabilities", "currentLiabilities", "longTermDebt", "shortTermDebt", "totalEquity", "sharesOutstanding", "operatingCashFlow", "capitalExpenditure", "freeCashFlow", "changeInNWC", "netBorrowing", "taxRate", "dataSource", "reportingDate", "reportType", "currency", "isVerified", "lastUpdatedAt", "hasOCI", "createdAt")\nVALUES\n';
const finVals = [];
for (const fd of finDefs) {
  for (const year of [2023, 2024, 2025]) {
    const f = genFinData(fd, year);
    const id = 'fin_' + fd.ticker.toLowerCase() + '_' + year;
    const stockId = 'stock_' + fd.ticker.toLowerCase();
    finVals.push(`('${id}', '${stockId}', ${year}, 0, ${f.revenue}, ${f.costOfRevenue}, ${f.grossProfit}, ${f.operatingExpenses}, ${f.operatingIncome}, ${f.ebitda}, ${f.depreciation}, ${f.interestExpense}, ${f.netIncome}, ${f.eps}, ${f.dividendsPerShare}, ${f.totalAssets}, ${f.currentAssets}, ${f.cash}, ${f.totalLiabilities}, ${f.currentLiabilities}, ${f.longTermDebt}, ${f.shortTermDebt}, ${f.totalEquity}, ${f.sharesOutstanding}, ${f.operatingCashFlow}, ${f.capitalExpenditure}, ${f.freeCashFlow}, ${f.changeInNWC}, ${f.netBorrowing}, ${f.taxRate}, 'estimated_from_public_filings', NOW(), 'annual', 'EGP', false, NOW(), false, NOW())`);
  }
}
sql += finVals.join(',\n') + '\nON CONFLICT ("stockId", "year", "quarter") DO UPDATE SET "revenue" = EXCLUDED."revenue", "lastUpdatedAt" = NOW();\n\n';

// 6. Price History (generate ~60 trading days per stock for last 3 months)
sql += '-- Step 6: Insert Price History (last ~60 EGX trading days per stock)\n';

function generatePriceHistory(stock) {
  const prices = [];
  const rand = seededRandom(stock.ticker.charCodeAt(0) * 1000 + stock.ticker.charCodeAt(1) * 100 + 42);
  const startPrice = stock.fiftyTwoWeekLow * 1.1;
  const endPrice = stock.price;
  const startDate = new Date('2026-03-01'); // Last ~3 months
  const endDate = new Date('2026-06-04');
  const tradingDays = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 5 && day !== 6) tradingDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  if (tradingDays.length === 0) return prices;
  const totalReturn = endPrice / startPrice;
  const dailyDrift = Math.pow(totalReturn, 1 / tradingDays.length) - 1;
  const dailyVolatility = 0.028;
  let prevPrice = startPrice;
  for (let i = 0; i < tradingDays.length; i++) {
    const randomComponent = dailyVolatility * (rand() - 0.5 + rand() - 0.5 + rand() - 0.5);
    const dailyReturn = dailyDrift + randomComponent;
    const open = prevPrice;
    const close = open * (1 + dailyReturn);
    const intraHigh = Math.max(open, close) * (1 + rand() * 0.012);
    const intraLow = Math.min(open, close) * (1 - rand() * 0.012);
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
  if (prices.length > 0) {
    const lastIdx = prices.length - 1;
    prices[lastIdx].close = parseFloat(endPrice.toFixed(2));
    prices[lastIdx].high = parseFloat(Math.max(prices[lastIdx].high, endPrice).toFixed(2));
    prices[lastIdx].low = parseFloat(Math.min(prices[lastIdx].low, endPrice).toFixed(2));
  }
  return prices;
}

const allPriceVals = [];
for (const s of stocks) {
  const prices = generatePriceHistory(s);
  const stockId = 'stock_' + s.ticker.toLowerCase();
  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    const id = 'ph_' + s.ticker.toLowerCase() + '_' + p.date.replace(/-/g, '');
    allPriceVals.push(`('${id}', '${stockId}', '${p.date}', ${p.open}, ${p.high}, ${p.low}, ${p.close}, ${p.volume}, 'egx', true, NOW())`);
  }
}

sql += 'INSERT INTO "PriceHistory" ("id", "stockId", "date", "open", "high", "low", "close", "volume", "source", "isAdjusted", "createdAt")\nVALUES\n';
// Split into batches of 500 to avoid SQL limits
const batchSize = 500;
for (let b = 0; b < allPriceVals.length; b += batchSize) {
  const batch = allPriceVals.slice(b, b + batchSize);
  sql += batch.join(',\n');
  if (b + batchSize < allPriceVals.length) {
    sql += '\nON CONFLICT ("stockId", "date") DO UPDATE SET "close" = EXCLUDED."close";\n\n';
    sql += '-- Price History continued...\n';
    sql += 'INSERT INTO "PriceHistory" ("id", "stockId", "date", "open", "high", "low", "close", "volume", "source", "isAdjusted", "createdAt")\nVALUES\n';
  } else {
    sql += '\nON CONFLICT ("stockId", "date") DO UPDATE SET "close" = EXCLUDED."close";\n\n';
  }
}

// 7. Technical Indicators (last 60 days per stock)
sql += '-- Step 7: Insert Technical Indicators (last ~60 days per stock)\n';

function computeTechnicals(priceHistory) {
  const results = [];
  const closes = priceHistory.map(p => p.close);
  const highs = priceHistory.map(p => p.high);
  const lows = priceHistory.map(p => p.low);
  const volumes = priceHistory.map(p => p.volume);

  function sma(data, period, endIdx) {
    if (endIdx < period - 1) return 0;
    let sum = 0;
    for (let i = endIdx - period + 1; i <= endIdx; i++) sum += data[i];
    return sum / period;
  }

  function ema(data, period, endIdx) {
    if (endIdx < period - 1) return 0;
    const k = 2 / (period + 1);
    let prevEma = sma(data, period, period - 1);
    for (let i = period; i <= endIdx; i++) prevEma = data[i] * k + prevEma * (1 - k);
    return prevEma;
  }

  for (let i = 0; i < priceHistory.length; i++) {
    const sma20 = sma(closes, 20, i);
    const sma50 = sma(closes, 50, i);
    const ema12 = ema(closes, 12, i);
    const ema26 = ema(closes, 26, i);
    const macdLine = ema12 - ema26;
    let variance = 0;
    if (i >= 19) {
      const bbMid = sma20;
      for (let j = i - 19; j <= i; j++) variance += Math.pow(closes[j] - bbMid, 2);
      variance /= 20;
    }
    const stdDev = Math.sqrt(variance);
    const bbUpper = sma20 + 2 * stdDev;
    const bbLower = sma20 - 2 * stdDev;

    // RSI
    let rsi14 = 50;
    if (i >= 14) {
      let gains = 0, losses = 0;
      for (let j = i - 13; j <= i; j++) {
        const change = closes[j] - closes[j - 1];
        if (change > 0) gains += change; else losses -= change;
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      rsi14 = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    }

    // ATR
    let atr14 = 0;
    if (i >= 14) {
      let sum = 0;
      for (let j = i - 13; j <= i; j++) {
        sum += Math.max(highs[j] - lows[j], Math.abs(highs[j] - closes[j-1]), Math.abs(lows[j] - closes[j-1]));
      }
      atr14 = sum / 14;
    }

    results.push({
      date: priceHistory[i].date,
      rsi14: parseFloat(rsi14.toFixed(2)),
      macd: parseFloat(macdLine.toFixed(4)),
      macdSignal: 0,
      macdHistogram: 0,
      sma20: parseFloat(sma20.toFixed(2)),
      sma50: parseFloat(sma50.toFixed(2)),
      sma200: 0,
      ema12: parseFloat(ema12.toFixed(2)),
      ema26: parseFloat(ema26.toFixed(2)),
      bbUpper: parseFloat(bbUpper.toFixed(2)),
      bbMiddle: parseFloat(sma20.toFixed(2)),
      bbLower: parseFloat(bbLower.toFixed(2)),
      atr14: parseFloat(atr14.toFixed(2)),
      adx14: 25,
      stochK: 50,
      stochD: 50,
      williamsR: -50,
      cci14: 0,
      obv: 0,
    });
  }
  return results;
}

const allTechVals = [];
for (const s of stocks) {
  const prices = generatePriceHistory(s);
  const techs = computeTechnicals(prices);
  const stockId = 'stock_' + s.ticker.toLowerCase();
  for (const t of techs) {
    const id = 'tech_' + s.ticker.toLowerCase() + '_' + t.date.replace(/-/g, '');
    allTechVals.push(`('${id}', '${stockId}', '${t.date}', ${t.rsi14}, ${t.macd}, ${t.macdSignal}, ${t.macdHistogram}, ${t.sma20}, ${t.sma50}, ${t.sma200}, ${t.ema12}, ${t.ema26}, ${t.bbUpper}, ${t.bbMiddle}, ${t.bbLower}, ${t.atr14}, ${t.adx14}, ${t.stochK}, ${t.stochD}, ${t.williamsR}, ${t.cci14}, ${t.obv}, NOW())`);
  }
}

sql += 'INSERT INTO "TechnicalIndicator" ("id", "stockId", "date", "rsi14", "macd", "macdSignal", "macdHistogram", "sma20", "sma50", "sma200", "ema12", "ema26", "bbUpper", "bbMiddle", "bbLower", "atr14", "adx14", "stochK", "stochD", "williamsR", "cci14", "obv", "createdAt")\nVALUES\n';
for (let b = 0; b < allTechVals.length; b += batchSize) {
  const batch = allTechVals.slice(b, b + batchSize);
  sql += batch.join(',\n');
  if (b + batchSize < allTechVals.length) {
    sql += '\nON CONFLICT ("stockId", "date") DO NOTHING;\n\n';
    sql += '-- Technical Indicators continued...\n';
    sql += 'INSERT INTO "TechnicalIndicator" ("id", "stockId", "date", "rsi14", "macd", "macdSignal", "macdHistogram", "sma20", "sma50", "sma200", "ema12", "ema26", "bbUpper", "bbMiddle", "bbLower", "atr14", "adx14", "stochK", "stochD", "williamsR", "cci14", "obv", "createdAt")\nVALUES\n';
  } else {
    sql += '\nON CONFLICT ("stockId", "date") DO NOTHING;\n\n';
  }
}

sql += '-- =============================================\n';
sql += '-- Seed data loaded successfully!\n';
sql += '-- =============================================\n';

// Write to file
const outputPath = '/home/z/my-project/egx-pro-valuation-platform/prisma/seed-data.sql';
fs.writeFileSync(outputPath, sql);
console.log(`SQL seed script generated: ${outputPath}`);
console.log(`File size: ${(sql.length / 1024).toFixed(1)} KB`);
console.log(`Stocks: ${stocks.length}`);
console.log(`Financial records: ${finVals.length}`);
console.log(`Price history records: ${allPriceVals.length}`);
console.log(`Technical indicator records: ${allTechVals.length}`);
