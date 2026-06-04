// GET /api/portfolio - List all portfolios for the current user
// POST /api/portfolio - Create a new portfolio
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'

const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function GET() {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    const session = await getServerSession()
    const userId = session?.user?.email || 'default'

    const portfolios = await db.portfolio.findMany({
      where: { userId },
      include: {
        holdings: {
          include: {
            stock: {
              select: {
                ticker: true,
                name: true,
                price: true,
                valuations: {
                  where: { model: 'Composite (Weighted)' },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { fairValue: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = portfolios.map((portfolio) => {
      const totalValue = portfolio.holdings.reduce(
        (sum, h) => sum + h.quantity * h.stock.price,
        0
      )
      const totalCost = portfolio.holdings.reduce(
        (sum, h) => sum + h.quantity * h.costBasis,
        0
      )
      const totalGainLoss = totalValue - totalCost
      const weightedFairValue = portfolio.holdings.reduce((sum, h) => {
        const fv = h.stock.valuations[0]?.fairValue ?? h.stock.price
        return sum + h.quantity * fv
      }, 0)
      const weightedMarginOfSafety =
        weightedFairValue > 0 ? 1 - totalCost / weightedFairValue : 0

      return {
        id: portfolio.id,
        name: portfolio.name,
        userId: portfolio.userId,
        holdingsCount: portfolio.holdings.length,
        totalValue,
        totalCost,
        totalGainLoss,
        weightedFairValue,
        weightedMarginOfSafety,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
      }
    })

    return NextResponse.json({ portfolios: result })
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolios' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    const body = await request.json()
    const parsed = CreatePortfolioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const session = await getServerSession()
    const userId = session?.user?.email || 'default'

    const portfolio = await db.portfolio.create({
      data: {
        name: parsed.data.name,
        userId,
      },
    })

    return NextResponse.json({ portfolio }, { status: 201 })
  } catch (error) {
    console.error('Error creating portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 }
    )
  }
}
