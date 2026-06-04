// POST /api/portfolio/[id]/holdings - Add a holding
// DELETE /api/portfolio/[id]/holdings - Remove a holding
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/requireAuth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'

const AddHoldingSchema = z.object({
  stockId: z.string().min(1),
  quantity: z.number().positive(),
  costBasis: z.number().positive(),
})

const RemoveHoldingSchema = z.object({
  holdingId: z.number().int().positive(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    const { id: portfolioIdStr } = await params
    const portfolioId = parseInt(portfolioIdStr, 10)
    if (isNaN(portfolioId) || portfolioId <= 0) {
      return NextResponse.json(
        { error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = AddHoldingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const session = await getServerSession()
    const userId = session?.user?.email || 'default'

    // Verify portfolio belongs to user
    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
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

    // Verify stock exists
    const stock = await db.stock.findUnique({
      where: { id: parsed.data.stockId },
    })
    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      )
    }

    // Check if holding already exists for this stock in this portfolio
    const existingHolding = await db.portfolioHolding.findFirst({
      where: {
        portfolioId,
        stockId: parsed.data.stockId,
      },
    })

    if (existingHolding) {
      // Update existing holding: average cost basis
      const totalQuantity = existingHolding.quantity + parsed.data.quantity
      const newCostBasis =
        (existingHolding.quantity * existingHolding.costBasis +
          parsed.data.quantity * parsed.data.costBasis) /
        totalQuantity

      const updated = await db.portfolioHolding.update({
        where: { id: existingHolding.id },
        data: {
          quantity: totalQuantity,
          costBasis: newCostBasis,
        },
      })

      return NextResponse.json({ holding: updated })
    }

    // Create new holding
    const holding = await db.portfolioHolding.create({
      data: {
        portfolioId,
        stockId: parsed.data.stockId,
        quantity: parsed.data.quantity,
        costBasis: parsed.data.costBasis,
      },
    })

    return NextResponse.json({ holding }, { status: 201 })
  } catch (error) {
    console.error('Error adding holding:', error)
    return NextResponse.json(
      { error: 'Failed to add holding' },
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
    const { id: portfolioIdStr } = await params
    const portfolioId = parseInt(portfolioIdStr, 10)
    if (isNaN(portfolioId) || portfolioId <= 0) {
      return NextResponse.json(
        { error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = RemoveHoldingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const session = await getServerSession()
    const userId = session?.user?.email || 'default'

    // Verify portfolio belongs to user
    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
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

    // Verify holding belongs to this portfolio
    const holding = await db.portfolioHolding.findUnique({
      where: { id: parsed.data.holdingId },
    })
    if (!holding || holding.portfolioId !== portfolioId) {
      return NextResponse.json(
        { error: 'Holding not found in this portfolio' },
        { status: 404 }
      )
    }

    await db.portfolioHolding.delete({
      where: { id: parsed.data.holdingId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing holding:', error)
    return NextResponse.json(
      { error: 'Failed to remove holding' },
      { status: 500 }
    )
  }
}
