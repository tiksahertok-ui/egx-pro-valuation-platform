import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { calculateCBESensitivity } from '@/lib/valuation/cbeSensitivity'
import { z } from 'zod'

const TickerParamsSchema = z.object({
  ticker: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    const { ticker } = await params
    const parsed = TickerParamsSchema.safeParse({ ticker: ticker.toUpperCase() })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ticker', details: parsed.error.flatten() }, { status: 400 })
    }

    const stock = await db.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: {
        financials: { orderBy: { year: 'desc' }, take: 1 },
        valuations: { where: { model: 'Composite (Weighted)' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    const latestFin = stock.financials[0]
    const compositeVal = stock.valuations[0]

    if (!latestFin) {
      return NextResponse.json({ error: 'No financial data available' }, { status: 400 })
    }

    const totalDebt = latestFin.longTermDebt + latestFin.shortTermDebt
    const totalCapital = latestFin.totalEquity + totalDebt
    const costOfDebt = totalDebt > 0 ? latestFin.interestExpense / totalDebt : 0.10
    const equityWeight = totalCapital > 0 ? latestFin.totalEquity / totalCapital : 0.5
    const debtWeight = totalCapital > 0 ? totalDebt / totalCapital : 0.5
    const fairValue = compositeVal?.fairValue ?? stock.price

    const sensitivity = calculateCBESensitivity(
      stock.egx30Beta || stock.beta,
      costOfDebt,
      equityWeight,
      debtWeight,
      fairValue
    )

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      currentPrice: stock.price,
      fairValue,
      sensitivity,
    })
  } catch (error) {
    console.error('Error calculating CBE sensitivity:', error)
    return NextResponse.json({ error: 'Failed to calculate sensitivity' }, { status: 500 })
  }
}
