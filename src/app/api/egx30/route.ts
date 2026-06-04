import { NextRequest, NextResponse } from 'next/server'
import { CURRENT_EGX30, getIndexRelativePerformance } from '@/lib/valuation/egx30'
import { requireAuth } from '@/lib/auth/requireAuth'
import { db } from '@/lib/db'
import { z } from 'zod'

const EGX30QuerySchema = z.object({
  ticker: z.string().min(2).max(10).optional(),
}).optional()

export async function GET(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    // Validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const parsed = EGX30QuerySchema.safeParse(queryParams)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
    }

    // Get all stocks with their valuations for relative performance
    const stocks = await db.stock.findMany({
      select: {
        ticker: true,
        name: true,
        price: true,
        beta: true,
        egx30Beta: true,
        marketCap: true,
      }
    })

    // Calculate relative performance for each stock
    const relativePerformance = stocks.map(stock => {
      // Approximate stock YTD return from 52-week range
      // This is a rough approximation; ideally use actual price history
      const approxReturn = 0.15 // Default; in production, calculate from priceHistory
      const beta = stock.egx30Beta || stock.beta
      return {
        ticker: stock.ticker,
        name: stock.name,
        ...getIndexRelativePerformance(approxReturn, beta),
      }
    })

    return NextResponse.json({
      egx30: CURRENT_EGX30,
      relativePerformance,
    })
  } catch (error) {
    console.error('Error fetching EGX30 data:', error)
    return NextResponse.json({ error: 'Failed to fetch EGX30 data' }, { status: 500 })
  }
}
