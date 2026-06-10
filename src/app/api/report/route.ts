import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { supabase } from '@/lib/supabase';
import { getFinancialDataByTicker, getHardcodedSectorAverages } from '@/lib/data/egx-financial-data';
import { runAllModels, DEFAULT_MARKET_PARAMS, type StockFundamentals, type SectorAverages } from '@/lib/valuation-engine';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

const ReportSchema = z.object({
  stockId: z.string().min(1).max(10).regex(/^[A-Za-z0-9.]+$/),
  scenario: z.enum(['bear', 'base', 'bull']),
  lang: z.enum(['ar', 'en']),
});

export async function POST(request: Request) {
  // P1.3: Rate limiting
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit('api/report', ip, RATE_LIMITS.report.limit, RATE_LIMITS.report.windowMs);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } }
    );
  }

  // Validate input
  let parsed: ReturnType<typeof ReportSchema.safeParse>;
  try {
    const body = await request.json();
    parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { stockId, scenario, lang } = parsed.data;

  try {
    // Get stock data
    let stock: Record<string, unknown>;
    const { data: dbStock } = await supabase.from('Stock').select('*').eq('ticker', stockId.toUpperCase()).single();

    if (dbStock) {
      stock = dbStock as Record<string, unknown>;
    } else {
      const finData = getFinancialDataByTicker(stockId);
      if (!finData) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
      }
      stock = {
        ticker: stockId.toUpperCase(),
        name: finData.name,
        sector: finData.sector,
        price: finData.price,
        eps: finData.eps,
        bookValuePerShare: finData.bookValuePerShare,
        peRatio: finData.peRatio,
        pbRatio: finData.pbRatio,
        marketCap: finData.marketCap,
        dividendYield: finData.dividendYield,
        beta: finData.beta,
        sharesOutstanding: finData.sharesOutstanding,
        roe: finData.roe,
        roa: finData.roa,
        debtToEquity: finData.debtToEquity,
        evToEbitda: finData.evToEbitda,
        revenue: finData.revenue,
        netIncome: finData.netIncome,
        totalAssets: finData.totalAssets,
        totalEquity: finData.totalEquity,
        totalDebt: finData.totalDebt,
        operatingCashflow: finData.operatingCashflow,
        freeCashflow: finData.freeCashflow,
        grossMargin: finData.grossMargin,
        operatingMargin: finData.operatingMargin,
        profitMargin: finData.profitMargin,
        revenueGrowth: finData.revenueGrowth,
        earningsGrowth: finData.earningsGrowth,
      };
    }

    // Run valuation
    const finData = getFinancialDataByTicker(stockId);
    const sectorAvgs = getHardcodedSectorAverages((stock.sector as string) || '');
    const sectorAvg: SectorAverages = {
      avgPE: sectorAvgs.avgPE,
      avgPB: sectorAvgs.avgPB,
      avgROE: sectorAvgs.avgROE,
      avgEVEbitda: sectorAvgs.avgEVEbitda,
      avgDividendYield: sectorAvgs.avgDividendYield,
    };

    const fundamentals: StockFundamentals = {
      ticker: (stock.ticker as string) || stockId.toUpperCase(),
      price: (stock.price as number) ?? finData?.price ?? 0,
      eps: (stock.eps as number) ?? finData?.eps ?? 0,
      bookValuePerShare: (stock.bookValuePerShare as number) ?? finData?.bookValuePerShare ?? 0,
      sharesOutstanding: (stock.sharesOutstanding as number) ?? finData?.sharesOutstanding ?? 0,
      marketCap: (stock.marketCap as number) ?? finData?.marketCap ?? 0,
      dividendYield: (stock.dividendYield as number) ?? finData?.dividendYield ?? 0,
      peRatio: (stock.peRatio as number) ?? finData?.peRatio ?? 0,
      pbRatio: (stock.pbRatio as number) ?? finData?.pbRatio ?? 0,
      beta: (stock.beta as number) ?? finData?.beta ?? 1.0,
      roe: (stock.roe as number) ?? finData?.roe ?? 0,
      roa: (stock.roa as number) ?? finData?.roa ?? 0,
      debtToEquity: (stock.debtToEquity as number) ?? finData?.debtToEquity ?? 0,
      evToEbitda: (stock.evToEbitda as number) ?? finData?.evToEbitda ?? 0,
      revenue: (stock.revenue as number) ?? finData?.revenue ?? 0,
      netIncome: (stock.netIncome as number) ?? finData?.netIncome ?? 0,
      totalAssets: (stock.totalAssets as number) ?? finData?.totalAssets ?? 0,
      totalEquity: (stock.totalEquity as number) ?? finData?.totalEquity ?? 0,
      totalDebt: (stock.totalDebt as number) ?? finData?.totalDebt ?? 0,
      operatingCashflow: (stock.operatingCashflow as number) ?? finData?.operatingCashflow ?? 0,
      freeCashflow: (stock.freeCashflow as number) ?? finData?.freeCashflow ?? 0,
      grossMargin: (stock.grossMargin as number) ?? finData?.grossMargin ?? 0,
      operatingMargin: (stock.operatingMargin as number) ?? finData?.operatingMargin ?? 0,
      profitMargin: (stock.profitMargin as number) ?? finData?.profitMargin ?? 0,
      revenueGrowth: (stock.revenueGrowth as number) ?? finData?.revenueGrowth ?? 0,
      earningsGrowth: (stock.earningsGrowth as number) ?? finData?.earningsGrowth ?? 0,
    };

    const valuation = runAllModels(fundamentals, sectorAvg, DEFAULT_MARKET_PARAMS, (stock.sector as string) || '');

    const scenarioMultiplier = scenario === 'bear' ? 0.8 : scenario === 'bull' ? 1.2 : 1.0;
    const scenarioFairValue = valuation.averageFairValue * scenarioMultiplier;

    // Use proper WACC calculation
    const costOfEquity = DEFAULT_MARKET_PARAMS.riskFreeRate + (fundamentals.beta || 1.0) * DEFAULT_MARKET_PARAMS.equityRiskPremium;
    const preTaxCostOfDebt = DEFAULT_MARKET_PARAMS.riskFreeRate + (DEFAULT_MARKET_PARAMS.corporateDebtSpread ?? 0.03);
    const afterTaxCostOfDebt = preTaxCostOfDebt * 0.7;
    const equityWeight = fundamentals.totalEquity / (fundamentals.totalEquity + fundamentals.totalDebt) || 0.7;
    const debtWeight = 1 - equityWeight;
    const wacc = equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt;

    // Get technical indicators
    let techSignal = 'Neutral';
    try {
      const stockIdField = (stock.id as string) || (stock.ticker as string);
      const { data: techData } = await supabase
        .from('TechnicalIndicator')
        .select('rsi14, macdLine, macdSignal')
        .eq('stockId', stockIdField)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (techData) {
        const rsi = (techData as Record<string, unknown>).rsi14 as number ?? 50;
        const macdLine = (techData as Record<string, unknown>).macdLine as number ?? 0;
        const macdSignal = (techData as Record<string, unknown>).macdSignal as number ?? 0;
        if (rsi > 70) techSignal = 'Overbought (RSI > 70)';
        else if (rsi < 30) techSignal = 'Oversold (RSI < 30)';
        else if (macdLine > macdSignal) techSignal = 'Bullish (MACD above signal)';
        else techSignal = 'Bearish (MACD below signal)';
      }
    } catch { /* use default */ }

    const langInstruction = lang === 'ar' ? 'Respond entirely in Arabic.' : 'Respond entirely in English.';

    const prompt = `You are an institutional-grade equity research analyst covering the Egyptian Exchange (EGX). Generate a comprehensive investment research report.

STOCK: ${stock.name as string} (${stock.ticker as string})
SECTOR: ${stock.sector as string}

CURRENT PRICE: EGP ${fundamentals.price.toFixed(2)}
DCF COMPOSITE FAIR VALUE: EGP ${valuation.averageFairValue.toFixed(2)}
UPSIDE/DOWNSIDE: ${valuation.averageUpside > 0 ? '+' : ''}${valuation.averageUpside.toFixed(1)}%

WACC: ${(wacc * 100).toFixed(1)}%
COST OF EQUITY: ${(costOfEquity * 100).toFixed(1)}%
PRE-TAX COST OF DEBT: ${(preTaxCostOfDebt * 100).toFixed(1)}%
TERMINAL GROWTH RATE: ${(DEFAULT_MARKET_PARAMS.gdpGrowthRate * 50).toFixed(1)}%

KEY FINANCIAL RATIOS:
- P/E: ${fundamentals.peRatio.toFixed(1)}
- P/B: ${fundamentals.pbRatio.toFixed(2)}
- EV/EBITDA: ${fundamentals.evToEbitda.toFixed(1)}
- ROE: ${(fundamentals.roe * 100).toFixed(1)}%
- Net Margin: ${(fundamentals.profitMargin * 100).toFixed(1)}%
- D/E: ${fundamentals.debtToEquity.toFixed(2)}

SCENARIO ANALYSIS:
- Bear Case: EGP ${(valuation.averageFairValue * 0.8).toFixed(2)} (-20%)
- Base Case: EGP ${valuation.averageFairValue.toFixed(2)}
- Bull Case: EGP ${(valuation.averageFairValue * 1.2).toFixed(2)} (+20%)

TECHNICAL SIGNAL: ${techSignal}

VALUATION MODELS SUMMARY:
${valuation.models.map(m => `- ${m.modelName}: EGP ${m.fairValue.toFixed(2)} (${m.upsideDownside > 0 ? '+' : ''}${m.upsideDownside.toFixed(1)}%, confidence: ${(m.confidence * 100).toFixed(0)}%)`).join('\n')}

OVERALL VERDICT: ${valuation.overallVerdict}
CONFIDENCE SCORE: ${(valuation.confidenceScore * 100).toFixed(0)}%

Generate a structured report with these sections:
1. Investment Thesis (2-3 paragraphs analyzing the stock's value proposition)
2. Valuation Summary (key metrics, fair value estimate, and model convergence)
3. Key Risks (3-5 specific risks for this Egyptian stock)
4. Catalysts (3-5 potential positive catalysts)
5. Recommendation (Buy/Hold/Sell with target price range)

${langInstruction}`;

    // Call Anthropic Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const report = generateFallbackReport(stock, fundamentals, valuation, scenario, scenarioFairValue, wacc, costOfEquity, techSignal, lang);
      return NextResponse.json({ report, source: 'fallback', ticker: stock.ticker as string, scenario, lang });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      const report = generateFallbackReport(stock, fundamentals, valuation, scenario, scenarioFairValue, wacc, costOfEquity, techSignal, lang);
      return NextResponse.json({ report, source: 'fallback', ticker: stock.ticker as string, scenario, lang });
    }

    const data = await response.json();
    const report = data.content?.[0]?.text || 'Report generation failed.';

    return NextResponse.json({ report, source: 'anthropic', ticker: stock.ticker as string, scenario, lang });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Report generation failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

function generateFallbackReport(
  stock: Record<string, unknown>,
  fundamentals: StockFundamentals,
  valuation: { averageFairValue: number; averageUpside: number; overallVerdict: string; confidenceScore: number; models: Array<{ modelName: string; fairValue: number; upsideDownside: number; confidence: number }> },
  scenario: string,
  scenarioFairValue: number,
  wacc: number,
  costOfEquity: number,
  techSignal: string,
  lang: 'ar' | 'en'
): string {
  if (lang === 'ar') {
    return `# تقرير استثمار - ${stock.name as string} (${stock.ticker as string})

## أطروحة الاستثمار
يُقدر السهم بقيمة عادلة تبلغ ${valuation.averageFairValue.toFixed(2)} ج.م، مع هامش ${valuation.averageUpside > 0 ? 'صعود' : 'هبوط'} بنسبة ${Math.abs(valuation.averageUpside).toFixed(1)}% من السعر الحالي البالغ ${fundamentals.price.toFixed(2)} ج.م. يعتمد هذا التقدير على تحليل متعدد النماذج يشمل التدفق النقدي المخصوم ونموذج جراهام والتقييم النسبي.

## ملخص التقييم
- القيمة العادلة: ${valuation.averageFairValue.toFixed(2)} ج.م
- سيناريو ${scenario === 'bear' ? 'متشائم' : scenario === 'bull' ? 'متفائل' : 'أساسي'}: ${scenarioFairValue.toFixed(2)} ج.م
- WACC: ${(wacc * 100).toFixed(1)}%
- تكلفة حقوق الملكية: ${(costOfEquity * 100).toFixed(1)}%
- درجة الثقة: ${(valuation.confidenceScore * 100).toFixed(0)}%

## المخاطر الرئيسية
1. تقلب سعر الصرف (التعرض للدولار الأمريكي)
2. ارتفاع أسعار الفائدة (سعر الكبي عند 19%)
3. مخاطر تنظيمية وتشريعية
4. مخاطر دورية قطاعية
5. قيود السيولة على البورصة المصرية

## المحفزات
1. تقدم الإصلاح الاقتصادي وامتثال برنامج صندوق النقد
2. تسارع نمو الإيرادات
3. استثمارات استراتيجية وتوسعات
4. جاذبية العائد التوزيعي
5. احتمال إدراج/إعادة توازن المؤشرات

## التوصية
**${valuation.overallVerdict === 'strong_buy' ? 'شراء قوي' : valuation.overallVerdict === 'buy' ? 'شراء' : valuation.overallVerdict === 'sell' ? 'بيع' : valuation.overallVerdict === 'strong_sell' ? 'بيع قوي' : 'احتفاظ'}**
نطاق السعر المستهدف: ${Math.round(valuation.averageFairValue * 0.9 * 100) / 100} - ${Math.round(valuation.averageFairValue * 1.1 * 100) / 100} ج.م`;
  }

  return `# Investment Report - ${stock.name as string} (${stock.ticker as string})

## Investment Thesis
The stock is estimated at a fair value of EGP ${valuation.averageFairValue.toFixed(2)}, representing ${valuation.averageUpside > 0 ? 'an upside' : 'a downside'} of ${Math.abs(valuation.averageUpside).toFixed(1)}% from the current price of EGP ${fundamentals.price.toFixed(2)}. This estimate is based on a multi-model analysis including Discounted Cash Flow, Graham Number, and Relative Valuation, with sector-appropriate weighting applied.

## Valuation Summary
- Fair Value: EGP ${valuation.averageFairValue.toFixed(2)}
- ${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Scenario: EGP ${scenarioFairValue.toFixed(2)}
- WACC: ${(wacc * 100).toFixed(1)}%
- Cost of Equity: ${(costOfEquity * 100).toFixed(1)}%
- Confidence Score: ${(valuation.confidenceScore * 100).toFixed(0)}%
- Technical Signal: ${techSignal}

## Key Risks
1. Currency devaluation risk (USD/EGP exposure at ${DEFAULT_MARKET_PARAMS.usdegpRate})
2. Rising interest rate environment (CBE overnight rate at 19%)
3. Regulatory and policy changes affecting the sector
4. Sector-specific cyclical risks
5. Liquidity constraints on the EGX

## Catalysts
1. Economic reform progress and IMF program compliance
2. Revenue growth acceleration
3. Strategic investments and expansion
4. Dividend yield attractiveness
5. Potential index inclusion/rebalancing

## Recommendation
**${valuation.overallVerdict === 'strong_buy' ? 'Strong Buy' : valuation.overallVerdict === 'buy' ? 'Buy' : valuation.overallVerdict === 'sell' ? 'Sell' : valuation.overallVerdict === 'strong_sell' ? 'Strong Sell' : 'Hold'}**
Target Price Range: EGP ${(valuation.averageFairValue * 0.9).toFixed(2)} - ${(valuation.averageFairValue * 1.1).toFixed(2)}`;
}
