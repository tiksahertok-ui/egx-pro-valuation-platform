// POST /api/report/[ticker] - Generate AI analyst report using z-ai-web-dev-sdk
// GET /api/report/[ticker] - Get existing AI reports for a stock
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import ZAI from 'z-ai-web-dev-sdk';
import { z } from 'zod';

const TickerParamsSchema = z.object({
  ticker: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/),
});

const ReportBodySchema = z.object({
  forceRefresh: z.boolean().optional(),
  language: z.enum(['en', 'ar', 'both']).optional(),
}).optional();

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_GENERATIONS_PER_DAY = 5;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError.error;

  try {
    const { ticker } = await params;

    const parsed = TickerParamsSchema.safeParse({ ticker: ticker.toUpperCase() });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ticker', details: parsed.error.flatten() }, { status: 400 });
    }

    const stock = await db.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      reports: stock.reports.map(r => ({
        id: r.id,
        title: r.title,
        titleAr: r.titleAr,
        content: r.content,
        contentAr: r.contentAr,
        rating: r.rating,
        targetPrice: r.targetPrice,
        language: r.language,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  // Auth check
  const authResult = await requireAuth();
  if (authResult) {
    return authResult.error;
  }

  try {
    const { ticker } = await params;

    const tickerParsed = TickerParamsSchema.safeParse({ ticker: ticker.toUpperCase() });
    if (!tickerParsed.success) {
      return NextResponse.json({ error: 'Invalid ticker', details: tickerParsed.error.flatten() }, { status: 400 });
    }

    // Validate request body if present
    let bodyResult: { success: boolean; data?: unknown } = { success: true, data: undefined };
    try {
      const bodyText = await request.text();
      if (bodyText) {
        const bodyJson = JSON.parse(bodyText);
        bodyResult = ReportBodySchema.safeParse(bodyJson);
      }
    } catch {
      // Empty or invalid body is acceptable for this endpoint
    }
    if (!bodyResult.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const forceRefresh = request.nextUrl.searchParams.get('forceRefresh') === 'true';

    const stock = await db.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: {
        financials: {
          orderBy: { year: 'desc' },
          take: 3,
        },
        valuations: {
          orderBy: { createdAt: 'desc' },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    // Cache check: return cached report if less than 24 hours old
    if (!forceRefresh && stock.reports.length > 0) {
      const latestReport = stock.reports[0];
      const reportAge = Date.now() - new Date(latestReport.createdAt).getTime();
      if (reportAge < CACHE_DURATION_MS) {
        return NextResponse.json({
          id: latestReport.id,
          ticker: stock.ticker,
          name: stock.name,
          nameAr: stock.nameAr,
          title: latestReport.title,
          titleAr: latestReport.titleAr,
          content: latestReport.content,
          contentAr: latestReport.contentAr,
          rating: latestReport.rating,
          targetPrice: latestReport.targetPrice,
          createdAt: latestReport.createdAt,
          cached: true,
          cacheExpiresAt: new Date(new Date(latestReport.createdAt).getTime() + CACHE_DURATION_MS).toISOString(),
        });
      }
    }

    // Rate limit: max 5 generations per stock per day
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const todayReportCount = await db.analystReport.count({
      where: {
        stockId: stock.id,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (todayReportCount >= MAX_GENERATIONS_PER_DAY) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Maximum ${MAX_GENERATIONS_PER_DAY} report generations per stock per day. Use forceRefresh after the cache expires.`,
          retryAfter: new Date(oneDayAgo.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { status: 429 }
      );
    }

    const latestFinancial = stock.financials[0];
    const compositeValuation = stock.valuations.find(v => v.model === 'Composite (Weighted)');
    const dcfValuation = stock.valuations.find(v => v.model === 'DCF FCFF');
    const relativeValuation = stock.valuations.find(v => v.model === 'Relative Valuation');

    // Prepare financial summary for AI
    const financialSummary = latestFinancial ? `
Revenue: EGP ${(latestFinancial.revenue / 1e9).toFixed(1)}B
Net Income: EGP ${(latestFinancial.netIncome / 1e9).toFixed(1)}B
EPS: EGP ${latestFinancial.eps.toFixed(2)}
EBITDA: EGP ${(latestFinancial.ebitda / 1e9).toFixed(1)}B
Total Assets: EGP ${(latestFinancial.totalAssets / 1e9).toFixed(1)}B
Total Equity: EGP ${(latestFinancial.totalEquity / 1e9).toFixed(1)}B
Total Debt: EGP ${((latestFinancial.longTermDebt + latestFinancial.shortTermDebt) / 1e9).toFixed(1)}B
Free Cash Flow: EGP ${(latestFinancial.freeCashFlow / 1e9).toFixed(1)}B
Gross Margin: ${latestFinancial.revenue > 0 ? ((latestFinancial.grossProfit / latestFinancial.revenue) * 100).toFixed(1) : 'N/A'}%
Net Margin: ${latestFinancial.revenue > 0 ? ((latestFinancial.netIncome / latestFinancial.revenue) * 100).toFixed(1) : 'N/A'}%
ROE: ${latestFinancial.totalEquity > 0 ? ((latestFinancial.netIncome / latestFinancial.totalEquity) * 100).toFixed(1) : 'N/A'}%
    `.trim() : 'No financial data available';

    const valuationSummary = compositeValuation ? `
Composite Fair Value: EGP ${compositeValuation.fairValue.toFixed(2)}
Bear Case: EGP ${compositeValuation.bearCase.toFixed(2)}
Base Case: EGP ${compositeValuation.baseCase.toFixed(2)}
Bull Case: EGP ${compositeValuation.bullCase.toFixed(2)}
Upside: ${compositeValuation.upside.toFixed(1)}%
Confidence: ${(compositeValuation.confidence * 100).toFixed(0)}%
${dcfValuation ? `DCF FCFF Fair Value: EGP ${dcfValuation.fairValue.toFixed(2)}` : ''}
${relativeValuation ? `Relative Valuation: EGP ${relativeValuation.fairValue.toFixed(2)}` : ''}
    `.trim() : 'No valuation data available';

    // Generate English report using z-ai-web-dev-sdk
    const zai = await ZAI.create();

    const englishCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an institutional-grade equity research analyst specializing in the Egyptian stock market (EGX). You provide detailed, data-driven analysis with clear investment recommendations. Your reports follow a structured format: Executive Summary, Investment Thesis, Financial Analysis, Valuation, Risk Factors, and Recommendation. Use Egyptian Pounds (EGP) for all monetary values. Be specific, quantitative, and actionable.`,
        },
        {
          role: 'user',
          content: `Generate a comprehensive equity research report for ${stock.name} (${stock.ticker}) listed on the Egyptian Exchange.

Company Information:
- Sector: ${stock.sector} (${stock.industry})
- Current Price: EGP ${stock.price.toFixed(2)}
- Market Cap: EGP ${(stock.marketCap / 1e9).toFixed(1)}B
- 52-Week Range: EGP ${stock.fiftyTwoWeekLow.toFixed(2)} - ${stock.fiftyTwoWeekHigh.toFixed(2)}
- P/E Ratio: ${stock.peRatio.toFixed(1)}x
- P/B Ratio: ${stock.pbRatio.toFixed(1)}x
- Beta: ${stock.beta.toFixed(2)}
- Dividend Yield: ${(stock.dividendYield * 100).toFixed(1)}%
- Description: ${stock.description}

Latest Financial Data (Year ${latestFinancial?.year ?? 'N/A'}):
${financialSummary}

Valuation Summary:
${valuationSummary}

Please provide:
1. Executive Summary with clear Buy/Hold/Sell recommendation
2. Investment Thesis (3-4 key points)
3. Detailed Financial Analysis
4. Valuation Assessment
5. Key Risk Factors
6. 12-Month Target Price with justification
7. Rating (Strong Buy / Buy / Hold / Sell / Strong Sell)

Format the report in clean markdown.`,
        },
      ],
    });

    const englishContent = englishCompletion.choices?.[0]?.message?.content ?? 'Report generation failed.';

    // Generate Arabic report
    const arabicCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `أنت محلل أسهم مؤسسي محترف متخصص في البورصة المصرية (EGX). تقدم تحليلاً مفصلاً قائماً على البيانات مع توصيات استثمارية واضحة. استخدم الجنيه المصري (EGP) لجميع القيم المالية. كن محدداً وكمياً وعملياً.`,
        },
        {
          role: 'user',
          content: `أنشئ تقرير تحليل أسهم شامل لشركة ${stock.nameAr} (${stock.ticker}) المدرجة في البورصة المصرية.

معلومات الشركة:
- القطاع: ${stock.sector} (${stock.industry})
- السعر الحالي: ${stock.price.toFixed(2)} جنيه مصري
- القيمة السوقية: ${(stock.marketCap / 1e9).toFixed(1)} مليار جنيه مصري
- نطاق 52 أسبوع: ${stock.fiftyTwoWeekLow.toFixed(2)} - ${stock.fiftyTwoWeekHigh.toFixed(2)} جنيه مصري
- مكرر الربحية: ${stock.peRatio.toFixed(1)}x
- مكرر القيمة الدفترية: ${stock.pbRatio.toFixed(1)}x
- بيتا: ${stock.beta.toFixed(2)}
- عائد التوزيعات: ${(stock.dividendYield * 100).toFixed(1)}%

البيانات المالية الأخيرة:
${financialSummary}

ملخص التقييم:
${valuationSummary}

يرجى تقديم تقرير مفصل يتضمن: الملخص التنفيذي، أطروحة الاستثمار، التحليل المالي، التقييم، عوامل الخطر، والتوصية بسعر مستهدف.`,
        },
      ],
    });

    const arabicContent = arabicCompletion.choices?.[0]?.message?.content ?? 'فشل إنشاء التقرير.';

    // Determine rating from English content
    let rating = 'Hold';
    let targetPrice = stock.price;

    const contentLower = englishContent.toLowerCase();
    if (contentLower.includes('strong buy')) rating = 'Strong Buy';
    else if (contentLower.includes('buy') && !contentLower.includes('strong buy')) rating = 'Buy';
    else if (contentLower.includes('strong sell')) rating = 'Strong Sell';
    else if (contentLower.includes('sell') && !contentLower.includes('strong sell')) rating = 'Sell';

    // Try to extract target price
    const targetPriceMatch = englishContent.match(/target\s*price[:\s]*EGP\s*([\d,]+\.?\d*)/i)
      ?? englishContent.match(/target\s*price[:\s]*([\d,]+\.?\d*)/i)
      ?? englishContent.match(/12.month\s*target[:\s]*EGP\s*([\d,]+\.?\d*)/i)
      ?? englishContent.match(/12.month\s*target[:\s]*([\d,]+\.?\d*)/i);

    if (targetPriceMatch) {
      const parsed = parseFloat(targetPriceMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) targetPrice = parsed;
    } else if (compositeValuation) {
      targetPrice = compositeValuation.fairValue;
    }

    // Save report to database
    const report = await db.analystReport.create({
      data: {
        stockId: stock.id,
        title: `${stock.name} (${stock.ticker}) - Equity Research Report`,
        titleAr: `${stock.nameAr} (${stock.ticker}) - تقرير تحليل أسهم`,
        content: englishContent,
        contentAr: arabicContent,
        rating,
        targetPrice,
        language: 'both',
      },
    });

    return NextResponse.json({
      id: report.id,
      ticker: stock.ticker,
      name: stock.name,
      nameAr: stock.nameAr,
      title: report.title,
      titleAr: report.titleAr,
      content: englishContent,
      contentAr: arabicContent,
      rating,
      targetPrice,
      createdAt: report.createdAt,
      cached: false,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
