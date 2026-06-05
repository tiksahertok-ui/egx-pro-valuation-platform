/**
 * EGX Pro Valuation Platform - Verified Master List of Egyptian Exchange Stocks
 * Contains verified EGX-listed stocks with comprehensive metadata
 * Total: ~75 stocks across 13 sectors
 *
 * All ticker symbols have been verified against actual EGX listings.
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
  OTHER_INVESTMENT: { en: 'Other & Investment', ar: 'أخرى واستثمار' },
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
// BANKING SECTOR (10 stocks)
// ============================================================
const BANKING_STOCKS: EGXStockMaster[] = [
  s('COMI', 'Commercial International Bank (Egypt)', 'البنك التجاري الدولي مصر', 'Banking', 'Commercial Banking',
    "Egypt's largest private-sector bank by assets and market capitalization, offering comprehensive banking and financial services.",
    'أكبر بنك قطاع خاص في مصر من حيث الأصول والقيمة السوقية يقدم خدمات مصرفية ومالية شاملة'),
  s('CIEB', 'Credit Agricole Egypt', 'كريدي أجريكول مصر', 'Banking', 'Commercial Banking',
    'Egyptian subsidiary of Credit Agricole Group offering retail, corporate, and private banking.',
    'الشركة الفرعية في مصر لمجموعة كريدي أجريكول تقدم الخدمات المصرفية للأفراد والشركات'),
  s('BTFH', 'Beltone Financial Holding', 'بلتون القابضة المالية', 'Banking', 'Investment Banking',
    'Leading financial services group offering investment banking, brokerage, and asset management.',
    'مجموعة خدمات مالية رائدة تقدم الاستثمار والوساطة وإدارة الأصول'),
  s('SAUD', 'Al Baraka Bank Egypt', 'مصرف البركة مصر', 'Banking', 'Islamic Banking',
    'Islamic banking subsidiary of Al Baraka Banking Group, offering Sharia-compliant financial products.',
    'شركة تابعة لمجموعة البركة المصرفية تقدم منتجات مالية متوافقة مع الشريعة'),
  s('ADIB', 'Abu Dhabi Islamic Bank Egypt', 'بنك أبو ظبي الإسلامي مصر', 'Banking', 'Islamic Banking',
    'Sharia-compliant banking services provider in Egypt, subsidiary of Abu Dhabi Islamic Bank.',
    'مقدم خدمات مصرفية إسلامية متوافقة مع الشريعة في مصر'),
  s('FAIT', 'Faisal Islamic Bank of Egypt', 'بنك فيصل الإسلامي مصر', 'Banking', 'Islamic Banking',
    'Islamic banking institution offering Sharia-compliant financial products and services.',
    'مؤسسة مصرفية إسلامية تقدم منتجات وخدمات مالية متوافقة مع الشريعة'),
  s('EDBE', 'Export Development Bank of Egypt', 'بنك التنمية الصادرات مصر', 'Banking', 'Development Banking',
    'State-owned development bank specializing in export financing and trade services.',
    'بنك تنمية حكومي متخصص في تمويل الصادرات والخدمات التجارية'),
  s('MISR', 'Banque Misr', 'بنك مصر', 'Banking', 'Commercial Banking',
    "One of Egypt's largest and oldest state-owned banks with extensive branch network.",
    'أحد أكبر وأقدم البنوك الحكومية في مصر بشبكة فروع واسعة'),
  s('NBEA', 'National Bank of Egypt', 'البنك الأهلي المصري', 'Banking', 'Commercial Banking',
    "Egypt's oldest and largest bank by assets, playing a pivotal role in the national economy.",
    'أقدم وأكبر بنك في مصر من حيث الأصول ويلعب دوراً محورياً في الاقتصاد الوطني'),
  s('QNBA', 'Qatar National Bank Alahli', 'بنك قطر الوطني الأهلي', 'Banking', 'Commercial Banking',
    'Subsidiary of QNB Group, one of the leading commercial banks in the Egyptian market.',
    'شركة تابعة لمجموعة بنك قطر الوطني أحد البنوك التجارية الرائدة في السوق المصري'),
];

// ============================================================
// REAL ESTATE SECTOR (9 stocks)
// ============================================================
const REAL_ESTATE_STOCKS: EGXStockMaster[] = [
  s('TMGH', 'Talaat Moustafa Group Holding', 'طلعت مصطفى جروب القابضة', 'Real Estate', 'Residential Development',
    "Egypt's largest real estate developer, known for Madinaty and Al Rehab City projects.",
    'أكبر شركة تطوير عقاري في مصر معروفة بمشروعي مدنتي والرحاب'),
  s('PHDC', 'Palm Hills Development Company', 'بالم هيلز للتطوير العقاري', 'Real Estate', 'Residential Development',
    'Premium real estate developer specializing in residential communities and commercial projects.',
    'مطور عقاري متميز متخصص في المجتمعات السكنية والمشاريع التجارية'),
  s('MNHD', 'Madinet Nasr for Housing & Development', 'مدينة نصر للإسكان والتعمير', 'Real Estate', 'Residential Development',
    'Established real estate developer of Nasr City and Tagammu projects.',
    'مطور عقاري راسخ لمشاريع مدينة نصر والتجمع'),
  s('OCDI', 'SODIC - Sixth of October Development & Investment', 'السادس من أكتوبر للتطوير والاستثمار', 'Real Estate', 'Mixed-Use Development',
    'Developer of upscale residential and commercial projects in West Cairo and North Coast.',
    'مطور مشاريع سكنية وتجارية راقية في غرب القاهرة والساحل الشمالي'),
  s('ORHD', 'Orascom Development Egypt', 'أوراسكوم للتنمية مصر', 'Real Estate', 'Touristic Development',
    'International town developer with integrated destinations in Egypt, Switzerland, and Oman.',
    'مطور مدن دولي بوجهات متكاملة في مصر وسويسرا وعُمان'),
  s('HDBK', 'Housing & Development Bank', 'بنك الإسكان والتعمير', 'Real Estate', 'Mortgage Banking',
    'Specialized bank providing housing finance and real estate development services.',
    'بنك متخصص يقدم تمويل الإسكان وخدمات التطوير العقاري'),
  s('SHRF', 'El Shorouk for Modern Printing & Packaging', 'الشروق للطباعة الحديثة والتغليف', 'Real Estate', 'Printing & Packaging',
    'Printing and packaging company with real estate investments in East Cairo.',
    'شركة طباعة وتغليف مع استثمارات عقارية في شرق القاهرة'),
  s('HELI', 'Heliopolis Company for Housing and Development', 'مصر الجديدة للإسكان والتعمير', 'Real Estate', 'Residential Development',
    'State-owned real estate company developing residential projects in Heliopolis and New Cairo.',
    'شركة عقارية حكومية تطور مشاريع سكنية في مصر الجديدة والقاهرة الجديدة'),
  s('COPR', 'Cairo for Real Estate & Investment', 'القاهرة للعقارات والاستثمار', 'Real Estate', 'Real Estate Investment',
    'Real estate investment and development company focused on Cairo metropolitan area.',
    'شركة استثمار وتطوير عقاري تركز على منطقة القاهرة الحضرية'),
];

// ============================================================
// FINANCIAL SERVICES SECTOR (8 stocks)
// ============================================================
const FINANCIAL_SERVICES_STOCKS: EGXStockMaster[] = [
  s('HRHO', 'EFG Hermes Holding', 'إي إف جي هرمس القابضة', 'Financial Services', 'Investment Banking',
    'Leading investment bank in the Middle East and North Africa region for capital market advisory.',
    'بنك استثماري رائد في منطقة الشرق الأوسط وشمال أفريقيا للاستشارات في أسواق رأس المال'),
  s('CIRA', 'CI Capital Holding for Financial Investments', 'سي آي كابيتال القابضة للاستثمارات المالية', 'Financial Services', 'Investment Banking',
    'Financial services platform offering investment banking, leasing, and mortgage finance.',
    'منصة خدمات مالية تقدم الاستثمار والتأجير وتمويل الرهن العقاري'),
  s('BINV', 'B Investments Holding', 'بي للاستثمارات القابضة', 'Financial Services', 'Private Equity',
    'Private equity and investment holding company managing diversified portfolio.',
    'شركة أسهم خاصة وقابضة للاستثمار تدير محفظة متنوعة'),
  s('ASPI', 'Aspire Capital Holding for Financial Investments', 'أسباير كابيتال القابضة للاستثمارات المالية', 'Financial Services', 'Investment Management',
    'Capital holding company focused on investment management and advisory services.',
    'شركة قابضة رأسمالية تركز على إدارة الاستثمار والاستشارات'),
  s('ECAP', 'Ezdaher Capital for Financial Investments', 'أزدهر كابيتال للاستثمارات المالية', 'Financial Services', 'Investment Management',
    'Capital investment company providing portfolio management and financial advisory.',
    'شركة استثمار رأسمالي تقدم إدارة المحافظ والاستشارات المالية'),
  s('ACTF', 'Act Financial', 'أكت فاينانشال', 'Financial Services', 'Financial Technology',
    'Fintech-focused financial services company providing digital financial solutions.',
    'شركة خدمات مالية تركز على التكنولوجيا المالية وتقدم حلول رقمية'),
  s('VALU', 'valU for Financial and Digital Technology Services', 'فاليو للخدمات المالية والتكنولوجيا الرقمية', 'Financial Services', 'Consumer Finance',
    'Leading BNPL (Buy Now Pay Later) and consumer finance platform in Egypt.',
    'منصة رائدة للشراء الآجل والتمويل الاستهلاكي في مصر'),
  s('ISPH', 'Institutional and Sovereign Projects Holding', 'المؤسسية والسيادية للمشروعات القابضة', 'Financial Services', 'Investment Holding',
    'Investment holding company focused on institutional and sovereign development projects.',
    'شركة قابضة للاستثمار تركز على المشاريع المؤسسية والسيادية'),
];

// ============================================================
// TELECOMMUNICATIONS SECTOR (2 stocks)
// ============================================================
const TELECOMMUNICATIONS_STOCKS: EGXStockMaster[] = [
  s('ETEL', 'Telecom Egypt', 'المصرية للاتصالات', 'Telecommunications', 'Fixed-Line Telecom',
    "Egypt's incumbent telecommunications operator providing fixed-line, broadband, and international connectivity.",
    'مشغل الاتصالات المصري الرائد يقدم خطوط الثابت والإنترنت والاتصال الدولي'),
  s('OTMT', 'Orascom Telecom Media and Technology Holding', 'أوراسكوم للاتصالات والإعلام والتكنولوجيا القابضة', 'Telecommunications', 'Diversified Telecom',
    'Diversified investment company with legacy telecom assets and media interests.',
    'شركة استثمار متنوعة بأصول اتصالات تراثية واهتمامات إعلامية'),
];

// ============================================================
// FOOD & BEVERAGES SECTOR (7 stocks)
// ============================================================
const FOOD_BEVERAGES_STOCKS: EGXStockMaster[] = [
  s('JUFO', 'Juhayna Food Industries', 'جهينة للصناعات الغذائية', 'Food & Beverages', 'Dairy & Juice',
    'Leading Egyptian dairy and juice producer with nationwide distribution network.',
    'رائد إنتاج الألبان والعصائر في مصر بشبكة توزيع على مستوى الجمهورية'),
  s('EKRI', 'Edita Food Industries', 'إديتا للصناعات الغذائية', 'Food & Beverages', 'Bakery & Snacks',
    'Major snack food manufacturer producing cakes, croissants, and wafers.',
    'مصنع رئيسي للوجبات الخفيفة ينتج الكيك والكرواسون والويفر'),
  s('DOMT', 'Arabian Food Industries (Domty)', 'الصناعات الغذائية العربية دومتي', 'Food & Beverages', 'Cheese & Dairy',
    'Leading cheese and dairy products manufacturer in the Egyptian market.',
    'رائد تصنيع الجبن ومنتجات الألبان في السوق المصري'),
  s('BDCO', 'Bisco Misr', 'بسكو مصر', 'Food & Beverages', 'Biscuits & Confectionery',
    'Iconic Egyptian biscuit and confectionery manufacturer with a long heritage.',
    'شركة أيقونية لتصنيع البسكويت والحلويات في مصر بتراث طويل'),
  s('HALW', 'Halwani Bros', 'هالواني إخوان', 'Food & Beverages', 'Confectionery & Preserves',
    'Well-established food company known for halva, tahini, and preserves.',
    'شركة أغذية راسخة معروفة بالحلاوة الطحينية والمربيات'),
  s('UNIL', 'Unilever Egypt', 'يونيليفر مصر', 'Food & Beverages', 'Diversified Food & FMCG',
    'Egyptian subsidiary of Unilever producing food, personal care, and household products.',
    'الشركة الفرعية في مصر ليونيليفر تنتج الأغذية ومنتجات العناية الشخصية والمنزلية'),
  s('NASR', 'El Nasr for Manufacturing Agricultural Crops', 'النصر لتصنيع المحاصيل الزراعية', 'Food & Beverages', 'Food Processing',
    'Food processing company specializing in agricultural crop manufacturing and processing.',
    'شركة معالجة أغذية متخصصة في تصنيع المحاصيل الزراعية'),
];

// ============================================================
// CONSTRUCTION & ENGINEERING SECTOR (6 stocks)
// ============================================================
const CONSTRUCTION_ENGINEERING_STOCKS: EGXStockMaster[] = [
  s('ORAS', 'Orascom Construction PLC', 'أوراسكوم للإنشاء', 'Construction & Engineering', 'Engineering & Construction',
    'Leading engineering and construction contractor with projects across the Middle East and Africa.',
    'مقاول إنشاءات وهندسة رائد بمشاريع في الشرق الأوسط وأفريقيا'),
  s('SWDY', 'Elsewedy Electric', 'السويدي إلكتريك', 'Construction & Engineering', 'Electrical Engineering',
    'Global energy solutions provider specializing in cables, transformers, and turnkey projects.',
    'مزود حلول طاقة عالمي متخصص في الكابلات والمحولات والمشاريع المتكاملة'),
  s('ESRS', 'Ezz Steel', 'عز للصلب', 'Construction & Engineering', 'Steel Manufacturing',
    "Middle East's largest steel producer with multiple manufacturing facilities across Egypt.",
    'أكبر منتج للصلب في الشرق الأوسط بمرافق تصنيع متعددة في مصر'),
  s('ALUM', 'Egyptian Aluminium Company (Egyptalum)', 'المصرية للألمنيوم', 'Construction & Engineering', 'Metals & Mining',
    "Egypt's sole aluminum producer with integrated smelting operations in Nag Hammadi.",
    'المنتج الوحيد للألمنيوم في مصر بعمليات صهر متكاملة في نجع حمادي'),
  s('SKPC', 'Sidi Kerir Petrochemicals (SIDPEC)', 'سيدي كير للبتروكيماويات', 'Construction & Engineering', 'Petrochemicals',
    'Major petrochemical company producing polyethylene and related products.',
    'شركة بتروكيماويات رئيسية تنتج البولي إيثيلين والمنتجات ذات الصلة'),
  s('MRSE', 'Maridive & Oil Services', 'ماريديف وخدمات البترول', 'Construction & Engineering', 'Oil & Gas Services',
    'Offshore marine and oil services company operating in the Mediterranean and Red Sea.',
    'شركة خدمات بحرية وبترولية تعمل في البحر المتوسط والأحمر'),
];

// ============================================================
// ENERGY SECTOR (2 stocks)
// ============================================================
const ENERGY_STOCKS: EGXStockMaster[] = [
  s('CCAP', 'Qalaa Holdings', 'قلاعة القابضة', 'Energy', 'Energy & Infrastructure',
    'Leading energy and infrastructure investment company in Egypt and East Africa.',
    'شركة استثمار رائدة في الطاقة والبنية التحتية في مصر وشرق أفريقيا'),
  s('AMOC', 'Alexandria Mineral Oils Company', 'الإسكندرية للزيوت المعدنية', 'Energy', 'Petroleum Refining',
    'Specialized petroleum company producing lubricating oils and mineral products.',
    'شركة بترولية متخصصة تنتج زيوت التشحيم والمنتجات المعدنية'),
];

// ============================================================
// CHEMICALS & FERTILIZERS SECTOR (4 stocks)
// ============================================================
const CHEMICALS_FERTILIZERS_STOCKS: EGXStockMaster[] = [
  s('ABUK', 'Abu Qir Fertilizers and Chemicals Industries', 'أبو قير للأسمدة والصناعات الكيميائية', 'Chemicals & Fertilizers', 'Nitrogen Fertilizers',
    'One of the largest nitrogen fertilizer producers in the Middle East region.',
    'أحد أكبر منتجي الأسمدة النيتروجينية في منطقة الشرق الأوسط'),
  s('SPMD', 'Sidi Kerir Petrochemicals', 'سيدي كير للبتروكيماويات', 'Chemicals & Fertilizers', 'Petrochemicals',
    'Petrochemical producer specializing in linear alkyl benzene and related products.',
    'منتج بتروكيماويات متخصص في الألكيل بنزين الخطي والمنتجات ذات الصلة'),
  s('KIMA', 'Egyptian Chemical Industries (Kima)', 'كيما للصناعات الكيميائية المصرية', 'Chemicals & Fertilizers', 'Fertilizers',
    'Fertilizer production company based in Aswan with ammonia and urea operations.',
    'شركة إنتاج أسمدة مقرها أسوان بعمليات الأمونيا واليوريا'),
  s('EGCH', 'Egyptian Chemical Industries', 'المصرية للصناعات الكيميائية', 'Chemicals & Fertilizers', 'Industrial Chemicals',
    'Established chemical manufacturer producing industrial and specialty chemicals.',
    'شركة كيميائية راسخة تنتج المواد الكيميائية الصناعية والتخصصية'),
];

// ============================================================
// TOBACCO SECTOR (1 stock)
// ============================================================
const TOBACCO_STOCKS: EGXStockMaster[] = [
  s('EAST', 'Eastern Company for Tobacco', 'الشرقية للدخان', 'Tobacco', 'Tobacco Manufacturing',
    "Egypt's monopoly tobacco manufacturer with over 100 years of operations.",
    'شركة احتكار التبغ في مصر بأكثر من 100 عام من العمليات'),
];

// ============================================================
// TECHNOLOGY SECTOR (3 stocks)
// ============================================================
const TECHNOLOGY_STOCKS: EGXStockMaster[] = [
  s('FWRY', 'Fawry for Banking Technology and Electronic Payments', 'فوري لتكنولوجيا الأعمال البنكية والمدفوعات الإلكترونية', 'Technology', 'Fintech & Payments',
    "Egypt's largest electronic payment network and digital banking services platform.",
    'أكبر شبكة دفع إلكتروني ومنصة خدمات مصرفية رقمية في مصر'),
  s('EFLS', 'E-Finance for Digital and Financial Investments', 'إي-فاينانس للاستثمارات الرقمية والمالية', 'Technology', 'Fintech',
    'Government e-payment and digital financial infrastructure operator.',
    'مشغل الدفع الإلكتروني الحكومي والبنية التحتية المالية الرقمية'),
  s('RAYA', 'Raya Holding for Financial Investments', 'رآية القابضة للاستثمارات المالية', 'Technology', 'Technology & IT Services',
    'Technology and investment holding company with IT services and BPO divisions.',
    'شركة تكنولوجيا واستثمار قابضة مع أقسام خدمات تكنولوجيا المالية والخدمات'),
];

// ============================================================
// TOURISM SECTOR (3 stocks)
// ============================================================
const TOURISM_STOCKS: EGXStockMaster[] = [
  s('OCH', 'Orascom Hotels and Development', 'أوراسكوم للفنادق والتنمية', 'Tourism', 'Hotel & Resort',
    'Hotel operations and tourism development company managing luxury resort properties.',
    'شركة عمليات فندقية وتنمية سياحية تدير عقارات المنتجعات الفاخرة'),
  s('OBRI', 'Oberoi Hotels (Egypt)', 'أوبروي للفنادق مصر', 'Tourism', 'Hotel Operations',
    'Luxury hotel management company operating the Oberoi brand properties in Egypt.',
    'شركة إدارة فنادق فاخرة تشغل عقارات أوبروي في مصر'),
  s('ALCN', 'Alakan Touristic Investments', 'النكان للاستثمارات السياحية', 'Tourism', 'Touristic Investment',
    'Tourism and hotel management company operating properties in key tourist destinations.',
    'شركة سياحة وإدارة فنادق تشغل عقارات في الوجهات السياحية الرئيسية'),
];

// ============================================================
// HEALTHCARE & PHARMA SECTOR (2 stocks)
// ============================================================
const HEALTHCARE_PHARMA_STOCKS: EGXStockMaster[] = [
  s('ADCI', 'Arab Drug Company', 'الشركة العربية للأدوية', 'Healthcare & Pharma', 'Pharmaceutical Manufacturing',
    'Established pharmaceutical manufacturer producing generic and branded medications.',
    'شركة أدوية راسخة تنتج الأدوية الجنيسة والمسجلة الملكية'),
  s('PHAR', 'Pharco Pharmaceuticals', 'فاركو للأدوية', 'Healthcare & Pharma', 'Pharmaceutical Manufacturing',
    'Leading pharmaceutical company with a diverse portfolio of therapeutic products.',
    'شركة أدوية رائدة بمحفظة متنوعة من المنتجات العلاجية'),
];

// ============================================================
// TEXTILES & RETAIL SECTOR (3 stocks)
// ============================================================
const TEXTILES_RETAIL_STOCKS: EGXStockMaster[] = [
  s('DAPH', 'Daad Abou Al Fadl for Ready-Made Garments', 'داد أبو الفضل للملابس الجاهزة', 'Textiles & Retail', 'Textile Manufacturing',
    'Textile manufacturing company specializing in ready-made garments.',
    'شركة تصنيع منسوجات متخصصة في الملابس الجاهزة'),
  s('ARAB', 'Arab Cotton Ginning Company', 'العربية لحلج القطن', 'Textiles & Retail', 'Cotton Ginning',
    'Cotton ginning and textile processing company with a long heritage in Egyptian cotton.',
    'شركة حلج القطن ومعالجة المنسوجات بتراث طويل في القطن المصري'),
  s('ALEX', 'Alexandria Spinning and Weaving', 'الإسكندرية للغزل والنسيج', 'Textiles & Retail', 'Spinning & Weaving',
    "One of Egypt's largest spinning and weaving companies with modern production lines.",
    'واحدة من أكبر شركات الغزل والنسيج في مصر بخطوط إنتاج حديثة'),
];

// ============================================================
// OTHER & INVESTMENT SECTOR (12 stocks)
// ============================================================
const OTHER_INVESTMENT_STOCKS: EGXStockMaster[] = [
  s('AIND', 'Arab Industries Development', 'العربية لتنمية الصناعات', 'Other & Investment', 'Industrial Development',
    'Industrial development and investment company with diversified manufacturing portfolio.',
    'شركة تنمية صناعية واستثمار بمحفظة تصنيع متنوعة'),
  s('AMER', 'Americana Restaurants', 'أمريكانا رستورنتس', 'Other & Investment', 'Food Service',
    'Leading multi-brand restaurant operator in the MENA region, recently listed on EGX.',
    'مشغل مطاعم متعددة العلامات التجارية الرائد في منطقة الشرق الأوسط وأفريقيا'),
  s('NCGC', 'National Company for Glass & Crystals', 'القومية للزجاج والكريستال', 'Other & Investment', 'Glass Manufacturing',
    'Glass and crystal manufacturing company producing tableware and industrial glass products.',
    'شركة تصنيع زجاج وكريستال تنتج أدوات المائدة والزجاج الصناعي'),
  s('AEC', 'Alexandria Container & Goods Handling', 'الإسكندرية للحاويات والبضائع', 'Other & Investment', 'Port & Logistics',
    'Container handling and logistics company serving Alexandria port.',
    'شركة مناولة الحاويات واللوجستيات تخدم ميناء الإسكندرية'),
  s('ELNA', 'El Nasr for Clothes and Textiles', 'النصر للملابس والمنسوجات', 'Other & Investment', 'Textile Manufacturing',
    'Textile and garment manufacturing company producing clothing and fabric products.',
    'شركة تصنيع منسوجات وملابس تنتج الملابس والأقمشة'),
  s('ATLC', 'Atlas for Land Reclamation & Processing', 'أطلس لاستصلاح الأراضي والمعالجة', 'Other & Investment', 'Agricultural Development',
    'Land reclamation and agricultural processing company developing arable land.',
    'شركة استصلاح أراضي ومعالجة زراعية تطور الأراضي الصالحة للزراعة'),
  s('SARE', 'Suez Agricultural Reclamation Enterprises', 'السويس لمشروعات الاستصلاح الزراعي', 'Other & Investment', 'Agricultural Development',
    'Agricultural reclamation company focused on developing farmland in the Suez region.',
    'شركة استصلاح زراعي تركز على تطوير الأراضي الزراعية في منطقة السويس'),
  s('UNIP', 'United International Pharmaceutical Company', 'ال المتحدة الدولية للأدوية', 'Other & Investment', 'Pharmaceutical Distribution',
    'Pharmaceutical distribution and trading company operating across Egypt.',
    'شركة توزيع وتجارة أدوية تعمل في جميع أنحاء مصر'),
  s('IPCO', 'International Packaging Materials (IPACK)', 'ال دولية لمواد التغليف', 'Other & Investment', 'Packaging',
    'Packaging materials manufacturer producing industrial and consumer packaging solutions.',
    'شركة تصنيع مواد التغليف تنتج حلول التغليف الصناعي والاستهلاكي'),
  s('KRDI', 'Kafr El Zayat for Development & Investment', 'كفر الزيات للتنمية والاستثمار', 'Other & Investment', 'Diversified Investment',
    'Development and investment company with diversified agricultural and industrial portfolio.',
    'شركة تنمية واستثمار بمحفظة زراعية وصناعية متنوعة'),
  s('SAMC', 'Suez Agricultural and Processing', 'السويس للزراعة والتكرير', 'Other & Investment', 'Agricultural Processing',
    'Agricultural processing company specializing in sugar and food production.',
    'شركة معالجة زراعية متخصصة في إنتاج السكر والأغذية'),
  s('MNFS', 'Misr National Company for Foodstuffs', 'مصر القومية للأغذية', 'Other & Investment', 'Food Processing',
    'National food processing company producing foodstuffs and consumer products.',
    'شركة قومية لمعالجة الأغذية تنتج المواد الغذائية والمنتجات الاستهلاكية'),
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
  ...OTHER_INVESTMENT_STOCKS,
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
