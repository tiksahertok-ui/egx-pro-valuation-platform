// GET /api/portfolio/[id] - Get portfolio with holdings and aggregate metrics
// DELETE /api/portfolio/[id] - Delete a portfolio
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'

const IdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    const { id } = await params
    const parsed = IdParamsSchema.safeParse({ id })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    const session = await getServerSession()
    const userId = session?.user?.email || 'default'

    const portfolio = await db.portfolio.findUnique({
      where: { id: parsed.data.id },
      include: {
        holdings: {
          include: {
            stock: {
              select: {
                id: true,
                ticker: true,
                name: true,
                price: true,
                sector: true,
                beta: true,
                egx30Beta: true,
                valuations: {
                  where: { model: 'Composite (Weighted)' },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: {
                    fairValue: true,
                    upside: true,
                    confidence: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    if (portfolio.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate aggregate metrics
    const totalValue = portfolio.holdings.reduce(
      (sum, h) => sum + h.quantity * h.stock.price,
      0
    )
    const totalCost = portfolio.holdings.reduce(
      (sum, h) => sum + h.quantity * h.costBasis,
      0
    )
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    const weightedFairValue = portfolio.holdings.reduce((sum, h) => {
      const fv = h.stock.valuations[0]?.fairValue ?? h.stock.price
      return sum + h.quantity * fv
    }, 0)
    const weightedMarginOfSafety =
      weightedFairValue > 0 ? 1 - totalCost / weightedFairValue : 0

    const holdings = portfolio.holdings.map((h) => {
      const currentValue = h.quantity * h.stock.price
      const costBasisTotal = h.quantity * h.costBasis
      const gainLoss = currentValue - costBasisTotal
      const gainLossPct = costBasisTotal > 0 ? (gainLoss / costBasisTotal) * 100 : 0
      const fairValue = h.stock.valuations[0]?.fairValue ?? h.stock.price
      const marginOfSafety =
        fairValue > 0 ? 1 - h.costBasis / fairValue : 0
      const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0

      return {
        id: h.id,
        stockId: h.stock.id,
        ticker: h.stock.ticker,
        name: h.stock.name,
        sector: h.stock.sector,
        quantity: h.quantity,
        costBasis: h.costBasis,
        currentPrice: h.stock.price,
        currentValue,
        costBasisTotal,
        gainLoss,
        gainLossPct,
        fairValue,
        marginOfSafety,
        weight,
        upside: h.stock.valuations[0]?.upside ?? 0,
        confidence: h.stock.valuations[0]?.confidence ?? 0,
        createdAt: h.createdAt,
      }
    })

    return NextResponse.json({
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        userId: portfolio.userId,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
      },
      holdings,
      aggregates: {
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPct,
        weightedFairValue,
        weightedMarginOfSafety,
        holdingsCount: portfolio.holdings.length,
      },
    })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    const { id } = await params
    const parsed = IdParamsSchema.safeParse({ id })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    const session = await getServerSession()
    const userId = session?.user?.email || 'default'

    const portfolio = await db.portfolio.findUnique({
      where: { id: parsed.data.id },
    })

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    if (portfolio.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete holdings first (cascade should handle this, but be explicit)
    await db.portfolioHolding.deleteMany({
      where: { portfolioId: parsed.data.id },
    })
    await db.portfolio.delete({
      where: { id: parsed.data.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to delete portfolio' },
      { status: 500 }
    )
  }
}
