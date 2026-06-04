// GET /api/economic - Get economic indicators for Egypt
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { z } from 'zod';

const EconomicQuerySchema = z.object({
  category: z.enum(['monetary', 'macro', 'external', 'fiscal']).optional(),
}).optional();

export async function GET(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError.error;

  try {
    // Validate query params
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsed = EconomicQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
    }
    const indicators = await db.economicIndicator.findMany({
      orderBy: { name: 'asc' },
    });

    // Group by category for better organization
    const monetary = indicators.filter(i => 
      ['CBE Policy Rate', 'USD/EGP Rate'].includes(i.name)
    );
    const macro = indicators.filter(i => 
      ['GDP Growth Rate', 'Inflation Rate', 'Unemployment Rate'].includes(i.name)
    );
    const external = indicators.filter(i => 
      ['Foreign Reserves', 'Current Account % GDP'].includes(i.name)
    );
    const fiscal = indicators.filter(i => 
      ['Budget Deficit %'].includes(i.name)
    );

    // Calculate derived metrics
    const inflationRate = indicators.find(i => i.name === 'Inflation Rate');
    const policyRate = indicators.find(i => i.name === 'CBE Policy Rate');
    const realInterestRate = inflationRate && policyRate
      ? policyRate.value - inflationRate.value
      : null;

    const gdpGrowth = indicators.find(i => i.name === 'GDP Growth Rate');
    const usdEgpRate = indicators.find(i => i.name === 'USD/EGP Rate');

    return NextResponse.json({
      indicators: indicators.map(i => ({
        id: i.id,
        name: i.name,
        nameAr: i.nameAr,
        value: i.value,
        previousValue: i.previousValue,
        change: i.change,
        unit: i.unit,
        source: i.source,
        date: i.date,
        formattedValue: formatValue(i.value, i.unit),
        changeDirection: i.change > 0 ? 'up' : i.change < 0 ? 'down' : 'flat',
      })),
      categories: {
        monetary: monetary.map(formatIndicator),
        macro: macro.map(formatIndicator),
        external: external.map(formatIndicator),
        fiscal: fiscal.map(formatIndicator),
      },
      derived: {
        realInterestRate: realInterestRate !== null ? parseFloat(realInterestRate.toFixed(2)) : null,
        realInterestRateDescription: realInterestRate !== null
          ? realInterestRate > 0
            ? 'Positive real rate - attractive for fixed income'
            : 'Negative real rate - eroding purchasing power'
          : 'N/A',
        gdpGrowthTrend: gdpGrowth
          ? gdpGrowth.change > 0 ? 'Accelerating' : gdpGrowth.change < 0 ? 'Decelerating' : 'Stable'
          : 'N/A',
        currencyOutlook: usdEgpRate
          ? usdEgpRate.change > 5 ? 'Significant depreciation' 
            : usdEgpRate.change > 0 ? 'Gradual depreciation' 
            : 'Stable/Appreciating'
          : 'N/A',
      },
      lastUpdated: indicators[0]?.date ?? null,
    });
  } catch (error) {
    console.error('Error fetching economic indicators:', error);
    return NextResponse.json({ error: 'Failed to fetch economic indicators' }, { status: 500 });
  }
}

function formatIndicator(i: { name: string; nameAr: string; value: number; previousValue: number; change: number; unit: string; source: string; date: string }) {
  return {
    name: i.name,
    nameAr: i.nameAr,
    value: i.value,
    previousValue: i.previousValue,
    change: i.change,
    unit: i.unit,
    source: i.source,
    date: i.date,
    formattedValue: formatValue(i.value, i.unit),
    changeDirection: i.change > 0 ? 'up' : i.change < 0 ? 'down' : 'flat',
  };
}

function formatValue(value: number, unit: string): string {
  switch (unit) {
    case 'Billion USD':
      return `$${value.toFixed(1)}B`;
    case 'EGP':
      return `EGP ${value.toFixed(2)}`;
    case '%':
      return `${value.toFixed(1)}%`;
    case '% GDP':
      return `${value.toFixed(1)}% of GDP`;
    default:
      return `${value.toFixed(2)} ${unit}`;
  }
}
