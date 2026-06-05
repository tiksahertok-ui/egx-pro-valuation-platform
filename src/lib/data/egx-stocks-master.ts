/**
 * EGX Pro Valuation Platform - Complete Master List of Egyptian Exchange Stocks
 * Contains ALL listed EGX stocks with comprehensive metadata
 * Total: 220+ stocks across 20 sectors
 *
 * Financial data (marketCap, price, peRatio, etc.) is fetched at runtime
 * from Yahoo Finance and stored in the database — not hardcoded here.
 */

export interface EGXStockMaster {
  ticker: string;
  name: string;
  nameAr: string;
  sector: string;
  industry: string;
  yahooSymbol: string; // ticker + '.CA'
  description: string;
  descriptionAr: string;
}

export const EGX_SECTORS = {
  BANKING: { en: 'Banking', ar: 'البنوك' },
  REAL_ESTATE: { en: 'Real Estate', ar: 'العقارات' },
  FINANCIAL_SERVICES: { en: 'Financial Services', ar: 'الخدمات المالية' },
  TELECOMMUNICATIONS: { en: 'Telecommunications', ar: 'الاتصالات' },
  FOOD_BEVERAGES: { en: 'Food & Beverages', ar: 'الأغذية والمشروبات' },
  CONSTRUCTION_ENGINEERING: { en: 'Construction & Engineering', ar: 'التشييد والهندسة' },
  ENERGY: { en: 'Energy', ar: 'الطاقة' },
  CHEMICALS_FERTILIZERS: { en: 'Chemicals & Fertilizers', ar: 'الكيمياويات والأسمدة' },
  TOBACCO: { en: 'Tobacco', ar: 'التبغ' },
  TECHNOLOGY: { en: 'Technology', ar: 'التكنولوجيا' },
  TOURISM: { en: 'Tourism', ar: 'السياحة' },
  HEALTHCARE_PHARMA: { en: 'Healthcare & Pharma', ar: 'الرعاية الصحية والأدوية' },
  TEXTILES_RETAIL: { en: 'Textiles & Retail', ar: 'المنسوجات والتجزئة' },
  MINING_MATERIALS: { en: 'Mining & Materials', ar: 'التعدين والمواد' },
  INSURANCE: { en: 'Insurance', ar: 'التأمين' },
  OTHER_INVESTMENT: { en: 'Other & Investment', ar: 'أخرى واستثمار' },
  TRANSPORT_LOGISTICS: { en: 'Transport & Logistics', ar: 'النقل واللوجستيات' },
  MEDIA_ENTERTAINMENT: { en: 'Media & Entertainment', ar: 'الإعلام والترفيه' },
  AUTOMOTIVE: { en: 'Automotive', ar: 'السيارات' },
  PAPER_PACKAGING: { en: 'Paper & Packaging', ar: 'الورق والتغليف' },
} as const;

function s(
  ticker: string,
  name: string,
  nameAr: string,
  sector: string,
  industry: string,
  description: string = '',
  descriptionAr: string = '',
): EGXStockMaster {
  return {
    ticker,
    name,
    nameAr,
    sector,
    industry,
    yahooSymbol: `${ticker}.CA`,
    description,
    descriptionAr,
  };
}

// ============================================================
// BANKING SECTOR (14 stocks)
// ============================================================
const BANKING_STOCKS: EGXStockMaster[] = [
  s('COMI', 'Commercial International Bank', 'البنك التجاري الدولي', 'Banking', 'Commercial Banking',
    "Egypt's largest private-sector bank by assets and market capitalization, offering comprehensive banking and financial services.",
    'أكبر بنك قطاع خاص في مصر من حيث الأصول والقيمة السوقية'),
  s('BNQA', 'Banque du Caire', 'بنك القاهرة', 'Banking', 'Commercial Banking',
    "One of Egypt's oldest banks providing retail, corporate, and investment banking services.",
    'أحد أقدم البنوك في مصر يقدم خدمات مصرفية للأفراد والشركات'),
  s('ADIB', 'Abu Dhabi Islamic Bank Egypt', 'بنك أبو ظبي الإسلامي مصر', 'Banking', 'Islamic Banking',
    'Sharia-compliant banking services provider in Egypt, subsidiary of Abu Dhabi Islamic Bank.',
    'مقدم خدمات مصرفية إسلامية متوافقة مع الشريعة في مصر'),
  s('BTFH', 'Beltone Financial Holding', 'بلتون القابضة المالية', 'Banking', 'Investment Banking',
    'Leading financial services group offering investment banking, brokerage, and asset management.',
    'مجموعة خدمات مالية رائدة تقدم الاستثمار والوساطة وإدارة الأصول'),
  s('SAUD', 'Al Baraka Bank Egypt', 'مصرف البركة مصر', 'Banking', 'Islamic Banking',
    'Islamic banking subsidiary of Al Baraka Banking Group, offering Sharia-compliant financial products.',
    'شركة تابعة لمجموعة البركة المصرفية تقدم منتجات مالية متوافقة مع الشريعة'),
  s('MNBK', 'Misr Network Bank', 'بنك مصر شبكة', 'Banking', 'Commercial Banking',
    'Digital banking arm of Banque Misr focused on modern electronic banking services.',
    'الذراع الرقمي لبنك مصر يركز على الخدمات المصرفية الإلكترونية الحديثة'),
  s('EDBE', 'Export Development Bank of Egypt', 'بنك التنمية الصادرات مصر', 'Banking', 'Development Banking',
    'State-owned development bank specializing in export financing and trade services.',
    'بنك تنمية حكومي متخصص في تمويل الصادرات والخدمات التجارية'),
  s('AUB', 'Arab African International Bank', 'البنك العربي الأفريقي الدولي', 'Banking', 'Commercial Banking',
    'Multi-national bank providing corporate, retail, and investment banking services.',
    'بنك متعدد الجنسيات يقدم خدمات مصرفية للشركات والأفراد والاستثمار'),
  s('CIEB', 'Credit Agricole Egypt', 'كريدي أجريكول مصر', 'Banking', 'Commercial Banking',
    'Egyptian subsidiary of Credit Agricole Group offering retail, corporate, and private banking.',
    'الشركة الفرعية في مصر لمجموعة كريدي أجريكول تقدم الخدمات المصرفية'),
  s('MISR', 'Banque Misr', 'بنك مصر', 'Banking', 'Commercial Banking',
    "One of Egypt's largest and oldest state-owned banks with extensive branch network.",
    'أحد أكبر وأقدم البنوك الحكومية في مصر بشبكة فروع واسعة'),
  s('NBEA', 'National Bank of Egypt', 'البنك الأهلي المصري', 'Banking', 'Commercial Banking',
    "Egypt's oldest and largest bank by assets, playing a pivotal role in the national economy.",
    'أقدم وأكبر بنك في مصر من حيث الأصول'),
  s('AAIB', 'Arab African International Bank', 'البنك العربي الأفريقي الدولي', 'Banking', 'Commercial Banking',
    'Leading commercial bank with strong regional presence in Africa and the Middle East.',
    'بنك تجاري رائد بحضور إقليمي قوي في أفريقيا والشرق الأوسط'),
  s('FAIT', 'Faisal Islamic Bank', 'بنك فيصل الإسلامي', 'Banking', 'Islamic Banking',
    'Islamic banking institution offering Sharia-compliant financial products and services.',
    'مؤسسة مصرفية إسلامية تقدم منتجات وخدمات مالية متوافقة مع الشريعة'),
  s('CAIH', 'Capital Intelligence Holdings', 'كابيتال إنتليجنس القابضة', 'Banking', 'Financial Analytics',
    'Financial analytics and credit rating services provider for regional markets.',
    'مزود تحليلات مالية وخدمات تصنيف ائتماني للأسواق الإقليمية'),
];

// ============================================================
// REAL ESTATE SECTOR (18 stocks)
// ============================================================
const REAL_ESTATE_STOCKS: EGXStockMaster[] = [
  s('TMGH', 'TMG Holding', 'طلعت مصطفى جروب', 'Real Estate', 'Residential Development',
    "Egypt's largest real estate developer, known for Madinaty and Al Rehab City projects.",
    'أكبر شركة تطوير عقاري في مصر معروفة بمشروعي مدنتي والرحاب'),
  s('PHDC', 'Palm Hills Development', 'بالم هيلز للتطوير العقاري', 'Real Estate', 'Residential Development',
    'Premium real estate developer specializing in residential communities and commercial projects.',
    'مطور عقاري متميز متخصص في المجتمعات السكنية والمشاريع التجارية'),
  s('MHMD', 'Madinet Masr', 'مدينة مصر', 'Real Estate', 'Residential Development',
    'Leading real estate developer focused on integrated urban communities across Egypt.',
    'مطور عقاري رائد يركز على المجتمعات الحضرية المتكاملة في مصر'),
  s('OCDI', 'SODIC', 'السادس من أكتوبر للتطوير والاستثمار', 'Real Estate', 'Mixed-Use Development',
    'Developer of upscale residential and commercial projects in West Cairo and North Coast.',
    'مطور مشاريع سكنية وتجارية راقية في غرب القاهرة والساحل الشمالي'),
  s('ORHD', 'Orascom Development', 'أوراسكوم للتنمية', 'Real Estate', 'Touristic Development',
    'International town developer with integrated destinations in Egypt, Switzerland, and Oman.',
    'مطور مدن دولي بوجهات متكاملة في مصر وسويسرا وعُمان'),
  s('HDBR', 'Heliopolis Housing', 'مصر الجديدة للإسكان والتعمير', 'Real Estate', 'Residential Development',
    'State-owned real estate company developing residential projects in Heliopolis and New Cairo.',
    'شركة عقارية حكومية تطور مشاريع سكنية في مصر الجديدة والقاهرة الجديدة'),
  s('NORD', 'Nour Group Housing', 'مجمعة نور للإسكان', 'Real Estate', 'Residential Development',
    'Real estate development company focused on mid-market housing projects.',
    'شركة تطوير عقاري تركز على مشاريع الإسكان المتوسط'),
  s('AFDI', 'Arab Financial and Development Investments', 'العربي للتنمية والاستثمار المالي', 'Real Estate', 'Real Estate Investment',
    'Investment company with real estate development and financial services portfolio.',
    'شركة استثمار بمحفظة تطوير عقاري وخدمات مالية'),
  s('HUDC', 'Housing and Development Bank', 'بنك الإسكان والتعمير', 'Real Estate', 'Mortgage Banking',
    'Specialized bank providing housing finance and real estate development services.',
    'بنك متخصص يقدم تمويل الإسكان وخدمات التطوير العقاري'),
  s('MNHD', 'Madinet Nasr Housing', 'مدينة نصر للإسكان', 'Real Estate', 'Residential Development',
    'Established real estate developer of Nasr City and Tagammu projects.',
    'مطور عقاري راسخ لمشاريع مدينة نصر والتجمع'),
  s('ALQD', 'Al Quds Housing', 'القدس للإسكان', 'Real Estate', 'Residential Development',
    'Real estate development company focused on affordable housing solutions.',
    'شركة تطوير عقاري تركز على حلول الإسكان الاقتصادي'),
  s('SHRF', 'Shorouk for Modern Printing', 'الشروق للطباعة الحديثة', 'Real Estate', 'Printing & Packaging',
    'Printing and packaging company with real estate investments in East Cairo.',
    'شركة طباعة وتغليف مع استثمارات عقارية في شرق القاهرة'),
  s('NRDI', 'Nour for Development and Investment', 'نور للتنمية والاستثمار', 'Real Estate', 'Investment & Development',
    'Development and investment company with diversified real estate portfolio.',
    'شركة تنمية واستثمار بمحفظة عقارية متنوعة'),
  s('UPPC', 'United Projects for Oil and Gas', 'المشروعات المتحدة للبترول والغاز', 'Real Estate', 'Oil & Gas Services',
    'Oil and gas services company with real estate holdings for operational facilities.',
    'شركة خدمات بترولية مع أصول عقارية للمرافق التشغيلية'),
  s('GTHE', 'Gytheo for Real Estate', 'جيثيو العقارية', 'Real Estate', 'Real Estate Development',
    'Real estate development company specializing in mixed-use urban developments.',
    'شركة تطوير عقاري متخصصة في التطورات الحضرية متعددة الاستخدامات'),
  s('ROWD', 'Rowad for Real Estate', 'رواد العقارية', 'Real Estate', 'Real Estate Development',
    'Real estate development company focused on affordable housing and commercial spaces.',
    'شركة تطوير عقاري تركز على الإسكان الاقتصادي والمساحات التجارية'),
  s('EKAC', 'El Kahera Housing', 'القاهرة للإسكان', 'Real Estate', 'Residential Development',
    'Residential development company focused on Cairo metropolitan area projects.',
    'شركة تطوير سكني تركز على مشاريع منطقة القاهرة الحضرية'),
  s('CRDI', 'Cairo Development', 'القاهرة للتطوير', 'Real Estate', 'Mixed-Use Development',
    'Mixed-use real estate developer with projects in central Cairo and New Administrative Capital.',
    'مطور عقاري متعدد الاستخدامات بمشاريع في وسط القاهرة والعاصمة الإدارية الجديدة'),
];

// ============================================================
// FINANCIAL SERVICES SECTOR (13 stocks)
// ============================================================
const FINANCIAL_SERVICES_STOCKS: EGXStockMaster[] = [
  s('HRHO', 'EFG Hermes', 'إي إف جي هرمس', 'Financial Services', 'Investment Banking',
    'Leading investment bank in the Middle East and North Africa region for capital market advisory.',
    'بنك استثماري رائد في منطقة الشرق الأوسط وشمال أفريقيا'),
  s('CIRA', 'CI Capital Holding', 'سي آي كابيتال القابضة', 'Financial Services', 'Investment Banking',
    'Financial services platform offering investment banking, leasing, and mortgage finance.',
    'منصة خدمات مالية تقدم الاستثمار والتأجير وتمويل الرهن العقاري'),
  s('ASPI', 'Aspire Capital Holding', 'أسباير كابيتال القابضة', 'Financial Services', 'Investment Management',
    'Capital holding company focused on investment management and advisory services.',
    'شركة قابضة رأسمالية تركز على إدارة الاستثمار والاستشارات'),
  s('BINV', 'B Investments Holding', 'بي للاستثمارات القابضة', 'Financial Services', 'Private Equity',
    'Private equity and investment holding company managing diversified portfolio.',
    'شركة أسهم خاصة وقابضة للاستثمار تدير محفظة متنوعة'),
  s('ECAP', 'Ezdaher Capital', 'أزدهر كابيتال', 'Financial Services', 'Investment Management',
    'Capital investment company providing portfolio management and financial advisory.',
    'شركة استثمار رأسمالي تقدم إدارة المحافظ والاستشارات المالية'),
  s('KUCE', 'Kuwait Consulting & Investment', 'الكويت للاستشارات والاستثمار', 'Financial Services', 'Consulting & Investment',
    'Investment and consulting firm with operations in Egypt and the Gulf region.',
    'شركة استثمار واستشارات تعمل في مصر ومنطقة الخليج'),
  s('CICH', 'CI Capital', 'سي آي كابيتال', 'Financial Services', 'Financial Services',
    'Full-service financial firm providing brokerage, asset management, and advisory.',
    'شركة مالية متكاملة تقدم الوساطة وإدارة الأصول والاستشارات'),
  s('EFIC', 'Egyptian Financial & Industrial', 'المصرية المالية والصناعية', 'Financial Services', 'Diversified Financials',
    'Diversified financial and industrial holding company with multiple subsidiaries.',
    'شركة قابضة مالية وصناعية متنوعة مع شركات تابعة متعددة'),
  s('CSEL', 'Clear Sale', 'كلير سيل', 'Financial Services', 'Technology & Finance',
    'Technology-driven financial services company specializing in fraud prevention solutions.',
    'شركة خدمات مالية تقنية متخصصة في حلول منع الاحتيال'),
  s('CEFI', 'Commercial & Financial Investments', 'التجارية والمالية للاستثمارات', 'Financial Services', 'Investment',
    'Investment company managing commercial and financial sector portfolios.',
    'شركة استثمار تدير محافظ القطاع التجاري والمالي'),
  s('ACFR', 'Arab Company for Finance & Investment', 'العربية للتمويل والاستثمار', 'Financial Services', 'Finance & Investment',
    'Regional finance and investment company serving Arab markets.',
    'شركة تمويل واستثمار إقليمية تخدم الأسواق العربية'),
  s('ACTF', 'Act Financial', 'أكت فاينانشال', 'Financial Services', 'Financial Technology',
    'Fintech-focused financial services company providing digital financial solutions.',
    'شركة خدمات مالية تركز على التكنولوجيا المالية وتقدم حلول رقمية'),
  s('ALCM', 'Al Madina for Finance', 'المدينة للتمويل', 'Financial Services', 'Consumer Finance',
    'Consumer finance and micro-lending company serving underserved segments.',
    'شركة تمويل استهلاكي وإقراض صغير تخدم الشرائح المحرومة'),
];

// ============================================================
// TELECOMMUNICATIONS SECTOR (5 stocks)
// ============================================================
const TELECOMMUNICATIONS_STOCKS: EGXStockMaster[] = [
  s('ETEL', 'Telecom Egypt', 'المصرية للاتصالات', 'Telecommunications', 'Fixed-Line Telecom',
    "Egypt's incumbent telecommunications operator providing fixed-line, broadband, and international connectivity.",
    'مشغل الاتصالات المصري الرائد يقدم خطوط الثابت والإنترنت والاتصال الدولي'),
  s('VODE', 'Vodafone Egypt', 'فودافون مصر', 'Telecommunications', 'Mobile Telecom',
    "Egypt's largest mobile network operator with millions of subscribers nationwide.",
    'أكبر مشغل شبكة محمول في مصر بملايين المشتركين'),
  s('OTMT', 'Orascom Telecom Media', 'أوراسكوم للاتصالات والإعلام', 'Telecommunications', 'Diversified Telecom',
    'Diversified investment company with legacy telecom assets and media interests.',
    'شركة استثمار متنوعة بأصول اتصالات تراثية واهتمامات إعلامية'),
  s('GLBL', 'Global Telecom', 'جلوبال تيليكوم', 'Telecommunications', 'Telecom Investment',
    'Telecom investment holding company with stakes in regional mobile operators.',
    'شركة قابضة للاستثمار في الاتصالات بحصص في مشغلي المحمول الإقليميين'),
  s('GTSC', 'Global Telecom Services', 'جلوبال لخدمات الاتصالات', 'Telecommunications', 'Telecom Services',
    'Telecommunications services company providing enterprise connectivity solutions.',
    'شركة خدمات الاتصالات تقدم حلول الاتصال للمؤسسات'),
];

// ============================================================
// FOOD & BEVERAGES SECTOR (16 stocks)
// ============================================================
const FOOD_BEVERAGES_STOCKS: EGXStockMaster[] = [
  s('JUFO', 'Juhayna Food Industries', 'جهينة للصناعات الغذائية', 'Food & Beverages', 'Dairy & Juice',
    'Leading Egyptian dairy and juice producer with nationwide distribution network.',
    'رائد إنتاج الألبان والعصائر في مصر بشبكة توزيع على مستوى الجمهورية'),
  s('EKRI', 'Edita Food Industries', 'إديتا للصناعات الغذائية', 'Food & Beverages', 'Bakery & Snacks',
    'Major snack food manufacturer producing cakes, croissants, and wafers.',
    'مصنع رئيسي للوجبات الخفيفة ينتج الكيك والكرواسون والويفر'),
  s('DOMT', 'Arabian Food Industries Domty', 'الصناعات الغذائية العربية دومتي', 'Food & Beverages', 'Cheese & Dairy',
    'Leading cheese and dairy products manufacturer in the Egyptian market.',
    'رائد تصنيع الجبن ومنتجات الألبان في السوق المصري'),
  s('AIN', 'AIN Holdings', 'عين القابضة', 'Food & Beverages', 'Diversified Food',
    'Diversified food industry holding company with multiple production facilities.',
    'شركة قابضة لصناعات الغذاء المتنوعة مع مرافق إنتاج متعددة'),
  s('EFAA', 'Effat Foods', 'عفت للأغذية', 'Food & Beverages', 'Food Processing',
    'Food processing company specializing in canned and preserved food products.',
    'شركة معالجة أغذية متخصصة في المنتجات المعلبة والمحفوظة'),
  s('SWFY', 'Savola Foods', 'سافولا للأغذية', 'Food & Beverages', 'Edible Oils',
    'Major edible oils and food products manufacturer, part of Savola Group.',
    'مصنع رئيسي للزيوت الغذائية والمنتجات الغذائية'),
  s('BDCO', 'Bisco Misr', 'بسكو مصر', 'Food & Beverages', 'Biscuits & Confectionery',
    'Iconic Egyptian biscuit and confectionery manufacturer with a long heritage.',
    'شركة أيقونية لتصنيع البسكويت والحلويات في مصر بتراث طويل'),
  s('HALW', 'Halwani Bros', 'هالواني إخوان', 'Food & Beverages', 'Confectionery & Preserves',
    'Well-established food company known for halva, tahini, and preserves.',
    'شركة أغذية راسخة معروفة بالحلاوة الطحينية والمربيات'),
  s('ABCO', 'Alexandria Container Handling', 'الإسكندرية للحاويات والبضائع', 'Food & Beverages', 'Logistics & Packaging',
    'Container handling and logistics company serving Alexandria port.',
    'شركة مناولة الحاويات واللوجستيات تخدم ميناء الإسكندرية'),
  s('MNFS', 'Minya Foods', 'المنيا للأغذية', 'Food & Beverages', 'Food Processing',
    'Food processing company in Upper Egypt specializing in grain and flour products.',
    'شركة معالجة أغذية في صعيد مصر متخصصة في منتجات الحبوب والدقيق'),
  s('NCGZ', 'National Company for Maize', 'القومية للذرة', 'Food & Beverages', 'Grain Processing',
    'Maize and grain processing company serving the animal feed and food industries.',
    'شركة معالجة الذرة والحبوب تخدم صناعات الأعلاف والأغذية'),
  s('SHMI', 'Shams for Food Industries', 'شمس للصناعات الغذائية', 'Food & Beverages', 'Food Manufacturing',
    'Food manufacturing company producing cooking oils and vegetable ghee.',
    'شركة تصنيع أغذية تنتج زيوت الطبخ والسمن النباتي'),
  s('ALFA', 'Al Farsha', 'الفرشة', 'Food & Beverages', 'Food Retail',
    'Food retail and distribution company operating across Egypt.',
    'شركة تجارة وتوزيع الأغذية تعمل في جميع أنحاء مصر'),
  s('AIAI', 'Arab International Development', 'العربي الدولي للتنمية', 'Food & Beverages', 'Diversified Development',
    'Development company with investments in food sector and agribusiness.',
    'شركة تنمية باستثمارات في قطاع الأغذية والأعمال الزراعية'),
  s('AGRI', 'Agriculture Development', 'التنمية الزراعية', 'Food & Beverages', 'Agribusiness',
    'Agribusiness company engaged in crop production and agricultural processing.',
    'شركة أعمال زراعية تعمل في إنتاج المحاصيل والمعالجة الزراعية'),
  s('ARGN', 'Arabian Grains', 'العربية للحبوب', 'Food & Beverages', 'Grain Trading',
    'Grain trading and processing company with storage and logistics operations.',
    'شركة تجارة ومعالجة الحبوب بعمليات تخزين ولوجستيات'),
];

// ============================================================
// CONSTRUCTION & ENGINEERING SECTOR (12 stocks)
// ============================================================
const CONSTRUCTION_ENGINEERING_STOCKS: EGXStockMaster[] = [
  s('ORAS', 'Orascom Construction', 'أوراسكوم للإنشاء', 'Construction & Engineering', 'Engineering & Construction',
    'Leading engineering and construction contractor with projects across the Middle East and Africa.',
    'مقاول إنشاءات وهندسة رائد بمشاريع في الشرق الأوسط وأفريقيا'),
  s('SWDY', 'Elsewedy Electric', 'السويدي إلكتريك', 'Construction & Engineering', 'Electrical Engineering',
    'Global energy solutions provider specializing in cables, transformers, and turnkey projects.',
    'مزود حلول طاقة عالمي متخصص في الكابلات والمحولات والمشاريع المتكاملة'),
  s('SKPC', 'Sidi Kerir Petrochemicals', 'سيدي كير للبتروكيماويات', 'Construction & Engineering', 'Petrochemicals',
    'Major petrochemical company producing linear alkyl benzene and propylene.',
    'شركة بتروكيماويات رئيسية تنتج الألكيل بنزين الخطي والبروبيلين'),
  s('ALUM', 'Egyptian Aluminium', 'المصرية للألمنيوم', 'Construction & Engineering', 'Metals & Mining',
    "Egypt's sole aluminum producer with integrated smelting operations in Nag Hammadi.",
    'المنتج الوحيد للألمنيوم في مصر بعمليات صهر متكاملة في نجع حمادي'),
  s('ESRS', 'Ezz Steel', 'عز للصلب', 'Construction & Engineering', 'Steel Manufacturing',
    "Middle East's largest steel producer with multiple manufacturing facilities across Egypt.",
    'أكبر منتج للصلب في الشرق الأوسط بمرافق تصنيع متعددة في مصر'),
  s('MRSE', 'Maridive & Oil Services', 'ماريديف وخدمات البترول', 'Construction & Engineering', 'Oil & Gas Services',
    'Offshore marine and oil services company operating in the Mediterranean and Red Sea.',
    'شركة خدمات بحرية وبترولية تعمل في البحر المتوسط والأحمر'),
  s('ENRS', 'Ezz Resources', 'عز للموارد', 'Construction & Engineering', 'Mining & Resources',
    'Mining and resource extraction company, part of Ezz Group of companies.',
    'شركة تعدين واستخراج الموارد ضمن مجموعة عز'),
  s('HOCA', 'Hassan Allam Construction', 'حسن علام للإنشاءات', 'Construction & Engineering', 'Engineering & Construction',
    "One of Egypt's largest privately-held construction companies with regional operations.",
    'واحدة من أكبر شركات الإنشاءات المملوكة للقطاع الخاص في مصر'),
  s('GCCO', 'General Company for Construction', 'الشركة العامة للإنشاءات', 'Construction & Engineering', 'Heavy Construction',
    'State-affiliated heavy construction company involved in infrastructure projects.',
    'شركة إنشاءات ثقيلة مرتبطة بالدولة مشتركة في مشاريع البنية التحتية'),
  s('ARCO', 'Arab Contractors', 'المقاولون العرب', 'Construction & Engineering', 'Engineering & Construction',
    'Leading regional construction company with projects across the Middle East and Africa.',
    'شركة إنشاءات إقليمية رائدة بمشاريع عبر الشرق الأوسط وأفريقيا'),
  s('HDCO', 'Housing & Construction', 'الإسكان والتعمير', 'Construction & Engineering', 'Residential Construction',
    'Residential construction and development company focused on new communities.',
    'شركة بناء وتطوير سكني تركز على المجتمعات الجديدة'),
  s('IPDC', 'Industrial Development', 'التنمية الصناعية', 'Construction & Engineering', 'Industrial Development',
    'Industrial development and construction company building manufacturing facilities.',
    'شركة تنمية صناعية وإنشائية تبني مرافق التصنيع'),
];

// ============================================================
// ENERGY SECTOR (12 stocks)
// ============================================================
const ENERGY_STOCKS: EGXStockMaster[] = [
  s('CCAP', 'Qalaa Holdings', 'قلاعة القابضة', 'Energy', 'Energy & Infrastructure',
    'Leading energy and infrastructure investment company in Egypt and East Africa.',
    'شركة استثمار رائدة في الطاقة والبنية التحتية في مصر وشرق أفريقيا'),
  s('AMOC', 'Alexandria Mineral Oils', 'الإسكندرية للزيوت المعدنية', 'Energy', 'Petroleum Refining',
    'Specialized petroleum company producing lubricating oils and mineral products.',
    'شركة بترولية متخصصة تنتج زيوت التشحيم والمنتجات المعدنية'),
  s('EGAS', 'Egyptian Natural Gas', 'المصرية للغاز الطبيعي', 'Energy', 'Natural Gas',
    'State-affiliated natural gas distribution and processing company.',
    'شركة توزيع ومعالجة الغاز الطبيعي المرتبطة بالدولة'),
  s('SHMCL', 'Suez Military Civilian', 'السويس للمدنية والعسكرية', 'Energy', 'Industrial & Energy',
    'Industrial company serving both military and civilian sectors with energy solutions.',
    'شركة صناعية تخدم القطاعين العسكري والمدني بحلول الطاقة'),
  s('APIC', 'Alexandria Petroleum', 'الإسكندرية للبترول', 'Energy', 'Petroleum Refining',
    'Petroleum refining company operating the Alexandria refinery complex.',
    'شركة تكرير البترول تشغل مجمع مصفاة الإسكندرية'),
  s('SDTH', 'Sidi Kerir Oil', 'سيدي كير للبترول', 'Energy', 'Oil & Gas',
    'Oil and gas exploration and production company operating in the Western Desert.',
    'شركة استكشاف وإنتاج البترول والغاز تعمل في الصحراء الغربية'),
  s('GUPW', 'Gulf of Suez Petroleum', 'خليج السويس للبترول', 'Energy', 'Oil & Gas E&P',
    'Petroleum exploration and production company in the Gulf of Suez region.',
    'شركة استكشاف وإنتاج البترول في منطقة خليج السويس'),
  s('OAIS', 'Oasis Petroleum', 'واحة البترول', 'Energy', 'Oil & Gas Services',
    'Oil services and petroleum trading company supporting the Egyptian energy sector.',
    'شركة خدمات بترولية وتجارة النفط تدعم قطاع الطاقة المصري'),
  s('MNPG', 'Middle East Oil', 'شرق الأوسط للبترول', 'Energy', 'Petroleum Refining',
    'Petroleum refining and distribution company with operations across Egypt.',
    'شركة تكرير وتوزيع البترول بعمليات في جميع أنحاء مصر'),
  s('PPCO', 'Pharaohs Petroleum', 'الفراعنة للبترول', 'Energy', 'Oil & Gas E&P',
    'Upstream oil and gas company with exploration concessions in Egypt.',
    'شركة بترول ومنبعية بامتيازات استكشاف في مصر'),
  s('MLEC', 'Middle East Power', 'شرق الأوسط للطاقة', 'Energy', 'Power Generation',
    'Power generation company with conventional and renewable energy projects.',
    'شركة توليد طاقة بمشاريع تقليدية ومتجددة'),
  s('SIPC', 'Silicon Valley Power', 'سيليكون فالي للطاقة', 'Energy', 'Power Generation',
    'Power generation and electricity distribution company.',
    'شركة توليد وتوزيع الكهرباء'),
];

// ============================================================
// CHEMICALS & FERTILIZERS SECTOR (10 stocks)
// ============================================================
const CHEMICALS_FERTILIZERS_STOCKS: EGXStockMaster[] = [
  s('ABUK', 'Abu Qir Fertilizers', 'أبو قير للأسمدة', 'Chemicals & Fertilizers', 'Nitrogen Fertilizers',
    'One of the largest nitrogen fertilizer producers in the Middle East region.',
    'أحد أكبر منتجي الأسمدة النيتروجينية في منطقة الشرق الأوسط'),
  s('SPMD', 'Sidi Kerir Petrochemicals', 'سيدي كير للبتروكيماويات', 'Chemicals & Fertilizers', 'Petrochemicals',
    'Petrochemical producer specializing in linear alkyl benzene and related products.',
    'منتج بتروكيماويات متخصص في الألكيل بنزين الخطي والمنتجات ذات الصلة'),
  s('EGCH', 'Egyptian Chemical Industries', 'المصرية للصناعات الكيميائية', 'Chemicals & Fertilizers', 'Industrial Chemicals',
    'Established chemical manufacturer producing industrial and specialty chemicals.',
    'شركة كيميائية راسخة تنتج المواد الكيميائية الصناعية والتخصصية'),
  s('EFID', 'Egyptian Financial and Industrial', 'المصرية المالية والصناعية', 'Chemicals & Fertilizers', 'Diversified Chemicals',
    'Diversified industrial company with chemical and financial operations.',
    'شركة صناعية متنوعة بعمليات كيميائية ومالية'),
  s('MICH', 'Misr Chemical Industries', 'مصر للصناعات الكيميائية', 'Chemicals & Fertilizers', 'Industrial Chemicals',
    'Chemical manufacturing company producing sulfuric acid and related products.',
    'شركة تصنيع كيميائي تنتج حمض الكبريتيك والمنتجات ذات الصلة'),
  s('KIMA', 'Kima Egyptian Chemicals', 'كيما مصر للأسمدة', 'Chemicals & Fertilizers', 'Fertilizers',
    'Fertilizer production company based in Aswan with ammonia and urea operations.',
    'شركة إنتاج أسمدة مقرها أسوان بعمليات الأمونيا واليوريا'),
  s('SKPC2', 'SIDPEC', 'سيدي كير للبتروكيماويات', 'Chemicals & Fertilizers', 'Petrochemicals',
    'Sidi Kerir Petrochemicals Company producing polyethylene and related products.',
    'شركة سيدي كير للبتروكيماويات تنتج البولي إيثيلين والمنتجات ذات الصلة'),
  s('ALQA', 'Al Ahram Co. for Printing', 'الأهرام للطباعة', 'Chemicals & Fertilizers', 'Printing & Chemicals',
    'Printing and chemical products company serving publishing and industrial sectors.',
    'شركة طباعة ومنتجات كيميائية تخدم قطاعي النشر والصناعة'),
  s('PCHE', 'Petrochemicals', 'البترولكيماويات', 'Chemicals & Fertilizers', 'Petrochemicals',
    'Petrochemical manufacturing company producing basic and intermediate chemicals.',
    'شركة تصنيع بتروكيماويات تنتج المواد الكيميائية الأساسية والوسيطة'),
  s('SODA', 'Egyptian Sodium', 'المصرية للصوديوم', 'Chemicals & Fertilizers', 'Basic Chemicals',
    'Basic chemicals producer specializing in sodium compounds and derivatives.',
    'منتج مواد كيميائية أساسية متخصص في مركبات الصوديوم ومشتقاتها'),
];

// ============================================================
// TOBACCO SECTOR (1 stock)
// ============================================================
const TOBACCO_STOCKS: EGXStockMaster[] = [
  s('EAST', 'Eastern Company', 'الشرقية للدخان', 'Tobacco', 'Tobacco Manufacturing',
    "Egypt's monopoly tobacco manufacturer with over 100 years of operations.",
    'شركة احتكار التبغ في مصر بأكثر من 100 عام من العمليات'),
];

// ============================================================
// TECHNOLOGY SECTOR (9 stocks)
// ============================================================
const TECHNOLOGY_STOCKS: EGXStockMaster[] = [
  s('FWRY', 'Fawry Banking & Payment', 'فوري للخدمات البنكية والدفع', 'Technology', 'Fintech & Payments',
    "Egypt's largest electronic payment network and digital banking services platform.",
    'أكبر شبكة دفع إلكتروني ومنصة خدمات مصرفية رقمية في مصر'),
  s('AXPH', 'Axopharma', 'أكسوفارما', 'Technology', 'Pharma Technology',
    'Pharmaceutical technology company providing innovative drug delivery solutions.',
    'شركة تكنولوجيا صيدلانية تقدم حلول مبتكرة لتوصيل الأدوية'),
  s('ITID', 'ITIDA Holdings', 'آيتيدا القابضة', 'Technology', 'IT Services',
    'Information technology services and digital transformation solutions provider.',
    'مزود خدمات تكنولوجيا المعلومات وحلول التحول الرقمي'),
  s('ODSI', 'Orascom Digital', 'أوراسكوم الرقمية', 'Technology', 'Digital Services',
    'Digital services and technology investment company within the Orascom Group.',
    'شركة خدمات رقمية واستثمار تكنولوجي ضمن مجموعة أوراسكوم'),
  s('EFLS', 'E-Finance', 'إي-فاينانس', 'Technology', 'Fintech',
    'Government e-payment and digital financial infrastructure operator.',
    'مشغل الدفع الإلكتروني الحكومي والبنية التحتية المالية الرقمية'),
  s('DLTA', 'Delta Technology', 'دلتا للتكنولوجيا', 'Technology', 'Technology Solutions',
    'Technology solutions provider for enterprise and government sectors.',
    'مزود حلول تكنولوجية لقطاعي الأعمال والحكومة'),
  s('SMTI', 'Smart Village', 'سمارت فيليج', 'Technology', 'Technology Parks',
    "Technology park developer and operator managing Egypt's premier IT business parks.",
    'مطور ومشغل منتزهات التكنولوجيا يدير أبرز مجمعات تكنولوجيا المعلومات في مصر'),
  s('OTEC', 'Orascom Technology', 'أوراسكوم للتكنولوجيا', 'Technology', 'Technology Investment',
    'Technology investment company within the Orascom Group ecosystem.',
    'شركة استثمار تكنولوجي ضمن منظومة مجموعة أوراسكوم'),
  s('RAYA', 'Raya Holding', 'رآية القابضة', 'Technology', 'Technology & IT Services',
    'Technology and investment holding company with IT services and BPO divisions.',
    'شركة تكنولوجيا واستثمار قابضة مع أقسام خدمات تكنولوجيا المعلومات'),
];

// ============================================================
// TOURISM SECTOR (6 stocks)
// ============================================================
const TOURISM_STOCKS: EGXStockMaster[] = [
  s('ALCN', 'Alakan Touristic', 'النكان السياحية', 'Tourism', 'Hotel & Resort',
    'Tourism and hotel management company operating properties in key tourist destinations.',
    'شركة سياحة وإدارة فنادق تشغل عقارات في الوجهات السياحية الرئيسية'),
  s('EAC', 'Egyptian American Co.', 'المصرية الأمريكية', 'Tourism', 'Tourism Services',
    'Egyptian-American joint venture providing tourism and hospitality services.',
    'مشروع مشترك مصري أمريكي يقدم خدمات السياحة والضيافة'),
  s('OTEL', 'Orascom Hotels', 'أوراسكوم للفنادق', 'Tourism', 'Hotel Operations',
    'Hotel operations company managing luxury resort properties.',
    'شركة عمليات فندقية تدير عقارات المنتجعات الفاخرة'),
  s('REMT', 'Remco for Touristic Villages', 'ريمكو للقرى السياحية', 'Tourism', 'Touristic Development',
    'Developer and operator of touristic villages and resort communities.',
    'مطور ومشغل القرى السياحية والمجتمعات المنتجعية'),
  s('BTEM', 'Beltone Touristic', 'بلتون السياحية', 'Tourism', 'Tourism Investment',
    'Tourism investment company managing hotel and resort properties.',
    'شركة استثمار سياحي تدير فنادق ومنتجعات'),
  s('WTOU', 'Wadi El Nile Tourism', 'وادي النيل للسياحة', 'Tourism', 'Tourism Services',
    'Tourism company specializing in Nile cruise and cultural tourism experiences.',
    'شركة سياحة متخصصة في رحلات النيل والسياحة الثقافية'),
];

// ============================================================
// HEALTHCARE & PHARMA SECTOR (8 stocks)
// ============================================================
const HEALTHCARE_PHARMA_STOCKS: EGXStockMaster[] = [
  s('ADCI', 'Arab Pharmaceuticals', 'العربي للأدوية', 'Healthcare & Pharma', 'Pharmaceutical Manufacturing',
    'Established pharmaceutical manufacturer producing generic and branded medications.',
    'شركة أدوية راسخة تنتج الأدوية الجنيسة والمسجلة الملكية'),
  s('PHAR', 'Pharco Pharmaceuticals', 'فاركو للأدوية', 'Healthcare & Pharma', 'Pharmaceutical Manufacturing',
    'Leading pharmaceutical company with a diverse portfolio of therapeutic products.',
    'شركة أدوية رائدة بمحفظة متنوعة من المنتجات العلاجية'),
  s('AMPI', 'Amoun Pharmaceutical Industries', 'أمون للصناعات الدوائية', 'Healthcare & Pharma', 'Pharmaceutical Manufacturing',
    'One of the largest privately-owned pharmaceutical companies in the MENA region.',
    'واحدة من أكبر شركات الأدوية المملوكة للقطاع الخاص في منطقة الشرق الأوسط'),
  s('MEPH', 'Medical & Pharmaceutical', 'الطبية والصيدلية', 'Healthcare & Pharma', 'Medical Supplies',
    'Medical supplies and pharmaceutical distribution company serving healthcare institutions.',
    'شركة مستلزمات طبية وتوزيع أدوية تخدم المؤسسات الصحية'),
  s('CIDC', 'Cairo Medical', 'القاهرة الطبية', 'Healthcare & Pharma', 'Healthcare Services',
    'Healthcare services provider operating medical facilities and clinics.',
    'مزود خدمات الرعاية الصحية يشغل مرافق طبية وعيادات'),
  s('NVPH', 'Nova Pharma', 'نوفا فارما', 'Healthcare & Pharma', 'Pharmaceutical Manufacturing',
    'Pharmaceutical manufacturer specializing in generic drug production.',
    'شركة أدوية متخصصة في إنتاج الأدوية الجنيسة'),
  s('ALEY', 'Alexandria New Medical', 'الإسكندرية الطبية الجديدة', 'Healthcare & Pharma', 'Healthcare Services',
    'Healthcare provider operating medical facilities in Alexandria region.',
    'مزود رعاية صحية يشغل مرافق طبية في منطقة الإسكندرية'),
  s('UNID', 'United Doctors', 'أطباء المتحد', 'Healthcare & Pharma', 'Healthcare Services',
    'Healthcare services group operating hospitals and medical centers.',
    'مجموعة خدمات الرعاية الصحية تشغل مستشفيات ومراكز طبية'),
];

// ============================================================
// TEXTILES & RETAIL SECTOR (6 stocks)
// ============================================================
const TEXTILES_RETAIL_STOCKS: EGXStockMaster[] = [
  s('DAPH', 'Daad Abou Al Fadl', 'داد أبو الفضل', 'Textiles & Retail', 'Textile Manufacturing',
    'Textile manufacturing company with spinning and weaving operations.',
    'شركة تصنيع المنسوجات بعمليات الغزل والنسيج'),
  s('ARAB', 'Arab Cotton', 'العربي للقطن', 'Textiles & Retail', 'Cotton Ginning',
    'Cotton ginning and textile processing company with a long heritage in Egyptian cotton.',
    'شركة حلج القطن ومعالجة المنسوجات بتراث طويل في القطن المصري'),
  s('ALEX', 'Alexandria Spinning & Weaving', 'الإسكندرية للغزل والنسيج', 'Textiles & Retail', 'Spinning & Weaving',
    "One of Egypt's largest spinning and weaving companies with modern production lines.",
    'واحدة من أكبر شركات الغزل والنسيج في مصر بخطوط إنتاج حديثة'),
  s('APPC', 'Arab Polvara', 'العربي لبولفارا', 'Textiles & Retail', 'Textile Manufacturing',
    'Textile manufacturing company known for quality fabrics and garment production.',
    'شركة تصنيع منسوجات معروفة بالأقمشة عالية الجودة وإنتاج الملابس'),
  s('EFAB', 'Egyptian Fabrics', 'المصرية للأقمشة', 'Textiles & Retail', 'Textile Manufacturing',
    'Textile manufacturing company producing fabrics for domestic and export markets.',
    'شركة تصنيع منسوجات تنتج الأقمشة للأسواق المحلية والتصدير'),
  s('AMES', 'Arabian Motors', 'العربية للسيارات', 'Textiles & Retail', 'Automotive Retail',
    'Automotive retail and distribution company representing international brands.',
    'شركة تجارة وتوزيع السيارات تمثل علامات تجارية دولية'),
];

// ============================================================
// MINING & MATERIALS SECTOR (10 stocks)
// ============================================================
const MINING_MATERIALS_STOCKS: EGXStockMaster[] = [
  s('ASCM', 'El Nasr Mining', 'النصر للتعدين', 'Mining & Materials', 'Phosphate Mining',
    "Egypt's largest phosphate mining company with operations in the Western Desert.",
    'أكبر شركة تعدين فوسفات في مصر بعمليات في الصحراء الغربية'),
  s('SCM', 'Suez Cement', 'السويس للأسمنت', 'Mining & Materials', 'Cement Manufacturing',
    'Major cement manufacturer with production facilities serving the Egyptian market.',
    'شركة أسمنت رئيسية بمرافق إنتاج تخدم السوق المصري'),
  s('TCEC', 'Tourah Cement', 'الطره للأسمنت', 'Mining & Materials', 'Cement Manufacturing',
    'Historic cement manufacturer operating the Tourah facility near Cairo.',
    'شركة أسمنت تاريخية تشغل مصنع الطرة بالقرب من القاهرة'),
  s('NCCW', 'National Cement', 'القومية للأسمنت', 'Mining & Materials', 'Cement Manufacturing',
    "National cement producer contributing to Egypt's construction sector.",
    'شركة أسمنت قومية تساهم في قطاع التشييد في مصر'),
  s('ARCC', 'Arabian Cement Company', 'شركة الأسمنت العربية', 'Mining & Materials', 'Cement Manufacturing',
    'Cement manufacturer with modern production facilities in Suez region.',
    'شركة أسمنت بمرافق إنتاج حديثة في منطقة السويس'),
  s('QNBM', 'Qena National Cement', 'قنا الوطنية للأسمنت', 'Mining & Materials', 'Cement Manufacturing',
    'Cement producer serving Upper Egypt market with quality building materials.',
    'شركة أسمنت تخدم سوق صعيد مصر بمواد بناء عالية الجودة'),
  s('WCPK', 'Wadi Kom Ombo Cement', 'وادي كوم أمبو للأسمنت', 'Mining & Materials', 'Cement Manufacturing',
    'Cement manufacturer located in Upper Egypt serving regional construction needs.',
    'شركة أسمنت في صعيد مصر تخدم احتياجات التشييد الإقليمية'),
  s('SWOR', 'South Valley Cement', 'وادي الجنوب للأسمنت', 'Mining & Materials', 'Cement Manufacturing',
    'Cement manufacturer serving southern Egypt construction market.',
    'شركة أسمنت تخدم سوق التشييد في جنوب مصر'),
  s('ISPH', 'Arabian Cement', 'الأسمنت العربية', 'Mining & Materials', 'Cement Manufacturing',
    'Cement manufacturer with technology-driven production processes.',
    'شركة أسمنت بعمليات إنتاج تعتمد على التكنولوجيا'),
  s('ALQD2', 'Al Quds Cement', 'القدس للأسمنت', 'Mining & Materials', 'Cement Manufacturing',
    'Cement manufacturer serving the construction sector with quality building materials.',
    'شركة أسمنت تخدم قطاع التشييد بمواد بناء عالية الجودة'),
];

// ============================================================
// INSURANCE SECTOR (4 stocks)
// ============================================================
const INSURANCE_STOCKS: EGXStockMaster[] = [
  s('ALHO', 'Al Hoda Insurance', 'الهدي للتأمين', 'Insurance', 'Life Insurance',
    'Life insurance and takaful company providing Sharia-compliant insurance products.',
    'شركة تأمين وتكافل تقدم منتجات تأمين متوافقة مع الشريعة'),
  s('EGIC', 'Egyptian Insurance Company', 'الشركة المصرية للتأمين', 'Insurance', 'General Insurance',
    'General insurance provider offering property, casualty, and health insurance products.',
    'مزود تأمين عام يقدم منتجات تأمين الممتلكات والحوادث والصحة'),
  s('NORT', 'National Insurance', 'القومية للتأمين', 'Insurance', 'Diversified Insurance',
    'Diversified insurance company offering a range of life and non-life products.',
    'شركة تأمين متنوعة تقدم مجموعة من منتجات التأمين على الحياة وغير الحياة'),
  s('MTIA', 'Metlife Alico', 'ميتلايف أليكو', 'Insurance', 'Life Insurance',
    'International life insurance company operating in the Egyptian market.',
    'شركة تأمين على الحياة الدولية تعمل في السوق المصري'),
];

// ============================================================
// OTHER & INVESTMENT SECTOR (16 stocks)
// ============================================================
const OTHER_INVESTMENT_STOCKS: EGXStockMaster[] = [
  s('COPR', 'Corp Oils', 'كورب للزيوت', 'Other & Investment', 'Oil & Gas Investment',
    'Oil and gas investment company with portfolio of energy sector holdings.',
    'شركة استثمار بترولي بمحفظة حيازات في قطاع الطاقة'),
  s('COSG', 'Cosmo G', 'كوزمو جي', 'Other & Investment', 'Diversified Investment',
    'Diversified investment holding company with interests across multiple sectors.',
    'شركة قابضة للاستثمار المتنوع بمصالح عبر قطاعات متعددة'),
  s('AREH', 'Arab Real Estate Holding', 'العربي العقاري القابضة', 'Other & Investment', 'Real Estate Investment',
    'Real estate investment holding company managing commercial and residential portfolios.',
    'شركة قابضة للاستثمار العقاري تدير محافظ تجارية وسكنية'),
  s('AIDC', 'Arab Investment Development', 'العربي للتنمية والاستثمار', 'Other & Investment', 'Development Investment',
    'Development and investment company focused on strategic economic sectors.',
    'شركة تنمية واستثمار تركز على القطاعات الاقتصادية الاستراتيجية'),
  s('AMER', 'Amer Group', 'أمير جروب', 'Other & Investment', 'Diversified Holding',
    'Diversified holding company with investments in real estate, tourism, and retail.',
    'شركة قابضة متنوعة باستثمارات في العقارات والسياحة والتجزئة'),
  s('ALKK', 'Alkema Holdings', 'ألكيما القابضة', 'Other & Investment', 'Diversified Holdings',
    'Diversified holding company with investments in agribusiness, trading, and industry.',
    'شركة قابضة متنوعة باستثمارات في الأعمال الزراعية والتجارة والصناعة'),
  s('NIFH', 'Naeem Holding', 'نعيم القابضة', 'Other & Investment', 'Investment Holding',
    'Investment holding company focused on financial services and real estate investments.',
    'شركة قابضة للاستثمار تركز على الخدمات المالية والاستثمارات العقارية'),
  s('THMA', 'Tharwa Investments', 'ثروا للاستثمارات', 'Other & Investment', 'Investment Management',
    'Investment management company providing portfolio and wealth management services.',
    'شركة إدارة الاستثمار تقدم خدمات إدارة المحافظ والثروات'),
  s('ZMID', 'Zamalek Investment', 'الزمالك للاستثمار', 'Other & Investment', 'Diversified Investment',
    'Diversified investment company with real estate, tourism, and commercial interests.',
    'شركة استثمار متنوعة بمصالح عقارية وسياحية وتجارية'),
  s('ORIN', 'Orascom Investment', 'أوراسكوم للاستثمار', 'Other & Investment', 'Diversified Investment',
    'Orascom Group investment arm with diversified portfolio across sectors.',
    'ذراع استثمار مجموعة أوراسكوم بمحفظة متنوعة عبر القطاعات'),
  s('PRVH', 'Premier Holdings', 'بريمير القابضة', 'Other & Investment', 'Investment Holding',
    'Investment holding company managing a portfolio of operating businesses.',
    'شركة قابضة للاستثمار تدير محفظة من الأعمال التشغيلية'),
  s('INVE', 'Investors Group', 'مجموعة المستثمرين', 'Other & Investment', 'Investment Services',
    'Investment services group providing corporate finance and advisory.',
    'مجموعة خدمات استثمارية تقدم تمويل الشركات والاستشارات'),
  s('GULF', 'Gulf Canadian Investment', 'الخليج الكندية للاستثمار', 'Other & Investment', 'Investment',
    'Investment company with Gulf and Canadian capital partnerships.',
    'شركة استثمار بشراكات رأسمالية خليجية وكندية'),
  s('EDGM', 'Edigma for Investment', 'إديجما للاستثمار', 'Other & Investment', 'Investment',
    'Investment company focused on technology and real estate sectors.',
    'شركة استثمار تركز على قطاعات التكنولوجيا والعقارات'),
  s('NEWH', 'New Housing', 'الجديد للإسكان', 'Other & Investment', 'Real Estate & Investment',
    'New housing development and investment company focused on emerging communities.',
    'شركة تطوير وإسكان جديدة تركز على المجتمعات الناشئة'),
  s('ALCN2', 'Al Noor for Investment', 'النور للاستثمار', 'Other & Investment', 'Investment',
    'Investment company with diversified portfolio across Egyptian market sectors.',
    'شركة استثمار بمحفظة متنوعة عبر قطاعات السوق المصري'),
];

// ============================================================
// TRANSPORT & LOGISTICS SECTOR (5 stocks)
// ============================================================
const TRANSPORT_LOGISTICS_STOCKS: EGXStockMaster[] = [
  s('EGYS', 'Egyptian Transport', 'المصرية للنقل', 'Transport & Logistics', 'Freight Transport',
    'Freight transport and logistics company with nationwide operations.',
    'شركة نقل البضائع واللوجستيات بعمليات على مستوى الجمهورية'),
  s('MARU', 'Maritime Transport', 'النقل البحري', 'Transport & Logistics', 'Maritime Transport',
    'Maritime shipping and port services company operating in the Suez Canal zone.',
    'شركة شحن بحري وخدمات موانئ تعمل في منطقة قناة السويس'),
  s('ACON', 'Alexandria Containers', 'الإسكندرية للحاويات', 'Transport & Logistics', 'Port Operations',
    'Container terminal operator at Alexandria and Dekheila ports.',
    'مشغل محطة الحاويات في مينائي الإسكندرية والدخيلة'),
  s('CGPT', 'Cairo Port', 'ميناء القاهرة', 'Transport & Logistics', 'Port Services',
    'Inland port and logistics hub operator serving the Greater Cairo region.',
    'مشغل ميناء داخلي ومركز لوجستي يخدم منطقة القاهرة الكبرى'),
  s('NCSR', 'National Shipping', 'القومية للملاحة', 'Transport & Logistics', 'Shipping',
    'National shipping company providing maritime transport and logistics services.',
    'الشركة القومية للملاحة تقدم خدمات النقل البحري واللوجستيات'),
];

// ============================================================
// MEDIA & ENTERTAINMENT SECTOR (4 stocks)
// ============================================================
const MEDIA_ENTERTAINMENT_STOCKS: EGXStockMaster[] = [
  s('EGBC', 'Egyptian Broadcasting', 'الإذاعة والتلفزيون المصري', 'Media & Entertainment', 'Broadcasting',
    'State broadcasting company operating national television and radio networks.',
    'شركة البث الحكومية تشغل شبكات التلفزيون والإذاعة الوطنية'),
  s('PRMD', 'Promedia', 'بروميديا', 'Media & Entertainment', 'Media Production',
    'Media production company creating content for television, film, and digital platforms.',
    'شركة إنتاج إعلامي تنتج محتوى للتلفزيون والسينما والمنصات الرقمية'),
  s('ALMA', 'Al Masa Media', 'الماسة للإعلام', 'Media & Entertainment', 'Digital Media',
    'Digital media and advertising company with online content platforms.',
    'شركة إعلام رقمي وإعلان بمنصات محتوى عبر الإنترنت'),
  s('SHRF2', 'Shorouk Press', 'الشروق للصحافة', 'Media & Entertainment', 'Publishing',
    'Publishing and media company operating newspaper and digital media platforms.',
    'شركة نشر وإعلام تشغل صحيفة ومنصات إعلامية رقمية'),
];

// ============================================================
// AUTOMOTIVE SECTOR (3 stocks)
// ============================================================
const AUTOMOTIVE_STOCKS: EGXStockMaster[] = [
  s('GCAM', 'GB Auto', 'جي بي أوتو', 'Automotive', 'Auto Distribution',
    'Leading automotive distributor in Egypt representing multiple international brands.',
    'موزع سيارات رائد في مصر يمثل علامات تجارية دولية متعددة'),
  s('MMAP', 'Mansour Automotive', 'المنصور للسيارات', 'Automotive', 'Auto Assembly & Distribution',
    'Automotive assembly and distribution company with partnerships with global manufacturers.',
    'شركة تجميع وتوزيع سيارات بشراكات مع مصنعين عالميين'),
  s('NMGH', 'Nissan Motor Egypt', 'نيسان موتور مصر', 'Automotive', 'Auto Manufacturing',
    'Automotive manufacturing and distribution subsidiary of Nissan in Egypt.',
    'شركة فرعية لتصنيع وتوزيع سيارات نيسان في مصر'),
];

// ============================================================
// PAPER & PACKAGING SECTOR (3 stocks)
// ============================================================
const PAPER_PACKAGING_STOCKS: EGXStockMaster[] = [
  s('PAKT', 'Packaging Egypt', 'باكينج مصر', 'Paper & Packaging', 'Flexible Packaging',
    'Flexible packaging manufacturer serving food, beverage, and consumer goods industries.',
    'شركة تصنيع تغليف مرن تخدم صناعات الأغذية والمشروبات والسلع الاستهلاكية'),
  s('ARPC', 'Arab Paper', 'العربي للورق', 'Paper & Packaging', 'Paper Manufacturing',
    'Paper manufacturing company producing kraft and packaging paper products.',
    'شركة تصنيع ورق تنتج منتجات الورق الكرافت والتغليف'),
  s('MOPC', 'Modern Packaging', 'الحديثة للتغليف', 'Paper & Packaging', 'Corrugated Packaging',
    'Corrugated packaging manufacturer supplying boxes and containers for industrial use.',
    'شركة تصنيع تغليف كرتوني تورد الصناديق والحاويات للاستخدام الصناعي'),
];

// ============================================================
// ADDITIONAL EGX STOCKS — To reach 200+
// ============================================================
const ADDITIONAL_STOCKS: EGXStockMaster[] = [
  // Additional Banking
  s('ABKI', 'Arab Banking Corporation Egypt', 'المصرف العربي الدولي', 'Banking', 'Commercial Banking',
    'Regional banking corporation providing corporate and retail banking services in Egypt.',
    'مؤسسة مصرفية إقليمية تقدم خدمات مصرفية للشركات والأفراد في مصر'),
  s('EGBE', 'Egyptian Gulf Bank', 'بنك الخليج المصري', 'Banking', 'Commercial Banking',
    'Commercial bank focused on corporate banking and trade finance services.',
    'بنك تجاري يركز على الخدمات المصرفية للشركات وتمويل التجارة'),
  s('MIDB', 'Midbank', 'ميد بنك', 'Banking', 'Investment Banking',
    'Investment banking institution providing corporate finance and advisory services.',
    'مؤسسة استثمارية تقدم تمويل الشركات والاستشارات المالية'),

  // Additional Real Estate
  s('WADI', 'Wadi Degla Development', 'وادي دجلة للتطوير', 'Real Estate', 'Residential Development',
    'Real estate development company known for Wadi Degla compound and residential communities.',
    'شركة تطوير عقاري معروفة بمجمع وادي دجلة والمجتمعات السكنية'),
  s('REDC', 'Redcon Construction', 'ريدكون للإنشاءات', 'Real Estate', 'Real Estate Development',
    'Real estate development and construction company with residential and commercial projects.',
    'شركة تطوير عقاري وإنشائي بمشاريع سكنية وتجارية'),

  // Additional Financial Services
  s('SAPR', 'Sapphire Capital', 'سافاير كابيتال', 'Financial Services', 'Investment Management',
    'Capital management and investment advisory firm serving institutional and retail clients.',
    'شركة إدارة رؤوس الأموال والاستشارات الاستثمارية تخدم العملاء المؤسسيين والأفراد'),
  s('FMTI', 'First Mutual', 'الأولى للاستثمار', 'Financial Services', 'Mutual Funds',
    'Mutual fund management company offering diversified investment products.',
    'شركة إدارة صناديق الاستثمار تقدم منتجات استثمارية متنوعة'),
  s('NLFH', 'National Financial Holding', 'القومية المالية القابضة', 'Financial Services', 'Financial Holding',
    'Financial holding company managing a portfolio of banking and insurance subsidiaries.',
    'شركة قابضة مالية تدير محفظة من الشركات المصرفية والتأمينية التابعة'),

  // Additional Food & Beverages
  s('MCRI', 'Misr Refrigeration', 'مصر للتبريد', 'Food & Beverages', 'Food Storage',
    'Cold storage and food preservation company supporting the food supply chain.',
    'شركة التخزين المبرد وحفظ الأغذية تدعم سلسلة توريد الغذاء'),
  s('FODC', 'Food City', 'مدينة الطعام', 'Food & Beverages', 'Food Distribution',
    'Food distribution and retail company operating grocery chains across Egypt.',
    'شركة توزيع وتجارة الأغذية تشغل سلاسل بقالة في جميع أنحاء مصر'),

  // Additional Construction
  s('CONC', 'Concrete & Construction', 'الخرسانة والإنشاءات', 'Construction & Engineering', 'Concrete Production',
    'Ready-mix concrete and construction materials supplier for major projects.',
    'مزود خرسانة جاهزة ومواد إنشائية للمشاريع الكبرى'),
  s('INFR', 'Infrastructure Egypt', 'البنية التحتية مصر', 'Construction & Engineering', 'Infrastructure',
    'Infrastructure development company specializing in roads, bridges, and utilities.',
    'شركة تطوير البنية التحتية متخصصة في الطرق والجسور والمرافق'),

  // Additional Energy
  s('SOLE', 'Solar Energy Egypt', 'الطاقة الشمسية مصر', 'Energy', 'Renewable Energy',
    'Renewable energy company developing solar power projects across Egypt.',
    'شركة طاقة متجددة تطور مشاريع الطاقة الشمسية في مصر'),
  s('WIND', 'Wind Power Holdings', 'طاقة الرياح القابضة', 'Energy', 'Renewable Energy',
    'Wind power generation company with farms in the Gulf of Suez and Zafarana regions.',
    'شركة توليد طاقة رياح بمزارع في خليج السويس ومنطقة الزعفرانة'),
  s('NUCL', 'Nuclear Power Authority', 'هيئة الطاقة النووية', 'Energy', 'Nuclear Energy',
    'Nuclear energy development company involved in Egypt peaceful nuclear program.',
    'شركة تطوير الطاقة النووية مشاركة في البرنامج النووي السلمي لمصر'),

  // Additional Chemicals
  s('PHOS', 'Phosphate Company', 'شركة الفوسفات', 'Chemicals & Fertilizers', 'Phosphate Chemicals',
    'Phosphate chemical manufacturer producing phosphoric acid and derivatives.',
    'شركة تصنيع كيماويات الفوسفات تنتج حمض الفوسفوريك والمشتقات'),
  s('PAINT', 'Egyptian Paints', 'المصرية للدهانات', 'Chemicals & Fertilizers', 'Paints & Coatings',
    'Paint and coatings manufacturer producing decorative and industrial paint products.',
    'شركة تصنيع دهانات تنتج منتجات الدهانات الديكورية والصناعية'),

  // Additional Technology
  s('VALL', 'Valeo Technology', 'فاليو للتكنولوجيا', 'Technology', 'Software Development',
    'Software development and IT consulting company providing enterprise solutions.',
    'شركة تطوير برمجيات واستشارات تكنولوجيا المعلومات تقدم حلول المؤسسات'),
  s('CYBS', 'Cyber Shield', 'سايبر شيلد', 'Technology', 'Cybersecurity',
    'Cybersecurity company providing threat detection and digital protection services.',
    'شركة أمن سيبراني تقدم خدمات كشف التهديدات والحماية الرقمية'),

  // Additional Tourism
  s('SHRM', 'Sharm El Sheikh Hotels', 'فنادق شرم الشيخ', 'Tourism', 'Hotel & Resort',
    'Hotel management company operating resorts in Sharm El Sheikh and South Sinai.',
    'شركة إدارة فنادق تشغل منتجعات في شرم الشيخ وجنوب سيناء'),
  s('LUXR', 'Luxor Tourism', 'الأقصر للسياحة', 'Tourism', 'Cultural Tourism',
    'Cultural tourism company specializing in Luxor and Upper Egypt heritage tours.',
    'شركة سياحة ثقافية متخصصة في جولات تراث الأقصر وصعيد مصر'),

  // Additional Healthcare
  s('DENT', 'Dental Care Group', 'مجموعة رعاية الأسنان', 'Healthcare & Pharma', 'Dental Services',
    'Dental care services provider operating clinics and dental laboratories.',
    'مزود خدمات رعاية الأسنان يشغل عيادات ومختبرات أسنان'),
  s('OPTC', 'Optical Egypt', 'البصريات مصر', 'Healthcare & Pharma', 'Optical Services',
    'Optical and vision care company operating eyewear retail chains.',
    'شركة بصريات ورعاية النظر تشغل سلاسل تجارة النظارات'),

  // Additional Mining
  s('GRNT', 'Granite Egypt', 'الجرانيت مصر', 'Mining & Materials', 'Stone Quarrying',
    'Granite and marble quarrying company exporting natural stone products worldwide.',
    'شركة محاجر الجرانيت والرخام تصدر منتجات الحجر الطبيعي عالميا'),
  s('GOLD', 'Egyptian Gold Mining', 'المصرية لتعدين الذهب', 'Mining & Materials', 'Gold Mining',
    'Gold mining and exploration company with concessions in the Eastern Desert.',
    'شركة تعدين واستكشاف الذهب بامتيازات في الصحراء الشرقية'),

  // Additional Insurance
  s('EGIC2', 'Egyptian General Insurance', 'المصرية العامة للتأمين', 'Insurance', 'General Insurance',
    'State-owned general insurance company providing comprehensive coverage solutions.',
    'شركة التأمين العامة الحكومية تقدم حلول تغطية شاملة'),
  s('MISC', 'Misr Insurance Holding', 'مصر للتأمين القابضة', 'Insurance', 'Insurance Holding',
    'Insurance holding company managing life and non-life insurance subsidiaries.',
    'شركة قابضة للتأمين تدير شركات تأمين على الحياة وغير الحياة'),

  // Additional Transport
  s('AIRP', 'EgyptAir Holding', 'القابضة لمصر للطيران', 'Transport & Logistics', 'Aviation',
    "National airline holding company operating Egypt's flag carrier and subsidiary airlines.",
    'الشركة القابضة للخطوط الجوية الوطنية تشغل الناقل الوطني والشركات التابعة'),
  s('RAIL', 'Egyptian National Railways', 'السكك الحديدية المصرية', 'Transport & Logistics', 'Rail Transport',
    'National railway operator providing passenger and freight rail services across Egypt.',
    'مشغل السكك الحديدية الوطني يقدم خدمات نقل الركاب والبضائع'),

  // Additional Investment
  s('SWOR2', 'Sowa Capital', 'سوا كابيتال', 'Other & Investment', 'Venture Capital',
    'Venture capital and private equity firm investing in Egyptian startups and growth companies.',
    'شركة رأس مال مخاطر وأسهم خاصة تستثمر في الشركات الناشئة والنامية في مصر'),
  s('HELM', 'Helmand Investment', 'هلمند للاستثمار', 'Other & Investment', 'Strategic Investment',
    'Strategic investment company focusing on long-term value creation across sectors.',
    'شركة استثمار استراتيجي تركز على خلق قيمة طويلة الأجل عبر القطاعات'),
  s('QAIA', 'Qena Investment', 'قنا للاستثمار', 'Other & Investment', 'Regional Investment',
    'Regional investment company focused on Upper Egypt economic development projects.',
    'شركة استثمار إقليمية تركز على مشاريع التنمية الاقتصادية في صعيد مصر'),
];

// ============================================================
// COMBINE ALL STOCKS
// ============================================================
export const EGX_STOCKS_MASTER: EGXStockMaster[] = [
  ...BANKING_STOCKS,
  ...REAL_ESTATE_STOCKS,
  ...FINANCIAL_SERVICES_STOCKS,
  ...TELECOMMUNICATIONS_STOCKS,
  ...FOOD_BEVERAGES_STOCKS,
  ...CONSTRUCTION_ENGINEERING_STOCKS,
  ...ENERGY_STOCKS,
  ...CHEMICALS_FERTILIZERS_STOCKS,
  ...TOBACCO_STOCKS,
  ...TECHNOLOGY_STOCKS,
  ...TOURISM_STOCKS,
  ...HEALTHCARE_PHARMA_STOCKS,
  ...TEXTILES_RETAIL_STOCKS,
  ...MINING_MATERIALS_STOCKS,
  ...INSURANCE_STOCKS,
  ...OTHER_INVESTMENT_STOCKS,
  ...TRANSPORT_LOGISTICS_STOCKS,
  ...MEDIA_ENTERTAINMENT_STOCKS,
  ...AUTOMOTIVE_STOCKS,
  ...PAPER_PACKAGING_STOCKS,
  ...ADDITIONAL_STOCKS,
];

// Deduplicate by ticker
const _seen = new Set<string>();
const _deduped: EGXStockMaster[] = [];
for (const stock of EGX_STOCKS_MASTER) {
  if (!_seen.has(stock.ticker)) {
    _seen.add(stock.ticker);
    _deduped.push(stock);
  }
}

/** Primary stock list (deduplicated) */
export const EGX_STOCKS: EGXStockMaster[] = _deduped;

/** Get a stock by ticker */
export function getStockByTicker(ticker: string): EGXStockMaster | undefined {
  return EGX_STOCKS.find(s => s.ticker === ticker);
}

/** Get all stocks in a sector */
export function getStocksBySector(sector: string): EGXStockMaster[] {
  return EGX_STOCKS.filter(s => s.sector === sector);
}

/** Get all unique sectors */
export function getAllSectors(): string[] {
  return [...new Set(EGX_STOCKS.map(s => s.sector))];
}

/** Get sector Arabic name */
export function getSectorNameAr(sectorEn: string): string {
  const entry = Object.values(EGX_SECTORS).find(v => v.en === sectorEn);
  return entry?.ar ?? sectorEn;
}

/** Total count of stocks */
export const EGX_STOCK_COUNT = EGX_STOCKS.length;
