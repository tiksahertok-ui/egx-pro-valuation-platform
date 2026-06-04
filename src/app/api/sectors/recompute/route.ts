// POST /api/sectors/recompute - Recompute sector averages from live stock data
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'

const RecomputeBodySchema = z.object({
  sector: z.string().optional(),
}).optional()

export async function POST(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    // Validate request body
    let bodyData: z.infer<typeof RecomputeBodySchema> = undefined
    try {
      const bodyText = await request.text()
      if (bodyText) {
        const bodyParsed = RecomputeBodySchema.safeParse(JSON.parse(bodyText))
        if (!bodyParsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: bodyParsed.error.flatten() }, { status: 400 })
        }
        bodyData = bodyParsed.data
      }
    } catch {
      // Empty body is acceptable
    }

    const sectorFilter = bodyData?.sector

    // Group all stocks by sector
    const stocks = await db.stock.findMany({
      where: sectorFilter ? { sector: sectorFilter } : undefined,
      include: {
        financials: { orderBy: { year: 'desc' }, take: 1 },
        valuations: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    const sectorGroups: Record<string, typeof stocks> = {}
    for (const stock of stocks) {
      if (!sectorGroups[stock.sector]) sectorGroups[stock.sector] = []
      sectorGroups[stock.sector].push(stock)
    }

    // Compute weighted averages for each sector from actual data
    const sectorResults: { sector: string; numCompanies: number; computed: boolean }[] = []

    for (const [sector, sectorStocks] of Object.entries(sectorGroups)) {
      const totalMarketCap = sectorStocks.reduce((sum, s) => sum + s.marketCap, 0)

      if (totalMarketCap === 0) {
        sectorResults.push({ sector, numCompanies: sectorStocks.length, computed: false })
        continue
      }

      // Weighted P/E: market-cap weighted average of stocks with positive P/E
      const peStocks = sectorStocks.filter(s => s.peRatio > 0)
      const avgPE = peStocks.length > 0
        ? peStocks.reduce((sum, s) => sum + s.peRatio * s.marketCap, 0) / peStocks.reduce((sum, s) => sum + s.marketCap, 0)
        : 0

      // Weighted P/B: market-cap weighted average of stocks with positive P/B
      const pbStocks = sectorStocks.filter(s => s.pbRatio > 0)
      const avgPB = pbStocks.length > 0
        ? pbStocks.reduce((sum, s) => sum + s.pbRatio * s.marketCap, 0) / pbStocks.reduce((sum, s) => sum + s.marketCap, 0)
        : 0

      // Weighted ROE: computed from latest financials
      const avgROE = sectorStocks.reduce((sum, s) => {
        const roe = s.financials[0] && s.financials[0].totalEquity > 0
          ? s.financials[0].netIncome / s.financials[0].totalEquity : 0
        return sum + roe * s.marketCap
      }, 0) / totalMarketCap

      // Weighted ROA: computed from latest financials
      const avgROA = sectorStocks.reduce((sum, s) => {
        const roa = s.financials[0] && s.financials[0].totalAssets > 0
          ? s.financials[0].netIncome / s.financials[0].totalAssets : 0
        return sum + roa * s.marketCap
      }, 0) / totalMarketCap

      // Weighted dividend yield
      const avgDivYield = sectorStocks.reduce((sum, s) => sum + s.dividendYield * s.marketCap, 0) / totalMarketCap

      // Weighted debt/equity
      const avgDebtEquity = sectorStocks.reduce((sum, s) => {
        const de = s.financials[0] && s.financials[0].totalEquity > 0
          ? (s.financials[0].longTermDebt + s.financials[0].shortTermDebt) / s.financials[0].totalEquity : 0
        return sum + de * s.marketCap
      }, 0) / totalMarketCap

      // Compute EV/EBITDA from actual valuations if available
      // Use market-cap weighted average of EV/EBITDA fair values as a proxy
      const avgEVEbitda = (() => {
        // Try to compute from financial data directly
        const stocksWithebitda = sectorStocks.filter(s => s.financials[0] && s.financials[0].ebitda > 0)
        if (stocksWithebitda.length === 0) return 0

        // Calculate enterprise value for each stock and then EV/EBITDA
        let totalEV = 0
        let totalEBITDA = 0
        for (const s of stocksWithebitda) {
          const f = s.financials[0]
          const ev = s.marketCap + (f.totalLiabilities - f.cash) // simplified EV
          totalEV += ev
          totalEBITDA += f.ebitda
        }
        return totalEBITDA > 0 ? totalEV / totalEBITDA : 0
      })()

      // Compute P/S ratio: market-cap weighted price-to-sales
      const avgPS = sectorStocks.reduce((sum, s) => {
        const ps = s.financials[0] && s.financials[0].revenue > 0
          ? s.marketCap / s.financials[0].revenue : 0
        return sum + (ps > 0 ? ps * s.marketCap : 0)
      }, 0) / (sectorStocks.filter(s => s.financials[0] && s.financials[0].revenue > 0).reduce((sum, s) => sum + s.marketCap, 0) || 1)

      await db.sectorStats.upsert({
        where: { sector },
        create: {
          sector,
          avgPE: parseFloat((avgPE || 0).toFixed(2)),
          avgPB: parseFloat((avgPB || 0).toFixed(2)),
          avgEVEbitda: parseFloat((avgEVEbitda || 0).toFixed(2)),
          avgDivYield: parseFloat((avgDivYield || 0).toFixed(4)),
          avgROE: parseFloat((avgROE || 0).toFixed(4)),
          avgROA: parseFloat((avgROA || 0).toFixed(4)),
          avgDebtEquity: parseFloat((avgDebtEquity || 0).toFixed(4)),
          avgPS: parseFloat((avgPS || 0).toFixed(2)),
          totalMarketCap,
          numCompanies: sectorStocks.length,
          computedAt: new Date(),
        },
        update: {
          avgPE: parseFloat((avgPE || 0).toFixed(2)),
          avgPB: parseFloat((avgPB || 0).toFixed(2)),
          avgEVEbitda: parseFloat((avgEVEbitda || 0).toFixed(2)),
          avgDivYield: parseFloat((avgDivYield || 0).toFixed(4)),
          avgROE: parseFloat((avgROE || 0).toFixed(4)),
          avgROA: parseFloat((avgROA || 0).toFixed(4)),
          avgDebtEquity: parseFloat((avgDebtEquity || 0).toFixed(4)),
          avgPS: parseFloat((avgPS || 0).toFixed(2)),
          totalMarketCap,
          numCompanies: sectorStocks.length,
          computedAt: new Date(),
        },
      })

      sectorResults.push({ sector, numCompanies: sectorStocks.length, computed: true })
    }

    return NextResponse.json({
      ok: true,
      sectorsComputed: sectorResults.filter(r => r.computed).length,
      sectorsSkipped: sectorResults.filter(r => !r.computed).length,
      results: sectorResults,
      computedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Recompute failed', details: String(error) }, { status: 500 })
  }
}
