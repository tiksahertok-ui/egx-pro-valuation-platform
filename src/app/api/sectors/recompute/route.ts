import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/requireAuth'

export async function POST() {
  const authError = await requireAuth()
  if (authError) return authError.error

  try {
    // Group all stocks by sector
    const stocks = await db.stock.findMany({
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

    // Compute weighted averages for each sector
    for (const [sector, sectorStocks] of Object.entries(sectorGroups)) {
      const totalMarketCap = sectorStocks.reduce((sum, s) => sum + s.marketCap, 0)

      const avgPE = sectorStocks.filter(s => s.peRatio > 0).reduce((sum, s) => sum + s.peRatio * s.marketCap, 0) / totalMarketCap
      const avgPB = sectorStocks.filter(s => s.pbRatio > 0).reduce((sum, s) => sum + s.pbRatio * s.marketCap, 0) / totalMarketCap
      const avgROE = sectorStocks.reduce((sum, s) => {
        const roe = s.financials[0] && s.financials[0].totalEquity > 0
          ? s.financials[0].netIncome / s.financials[0].totalEquity : 0
        return sum + roe * s.marketCap
      }, 0) / totalMarketCap
      const avgROA = sectorStocks.reduce((sum, s) => {
        const roa = s.financials[0] && s.financials[0].totalAssets > 0
          ? s.financials[0].netIncome / s.financials[0].totalAssets : 0
        return sum + roa * s.marketCap
      }, 0) / totalMarketCap
      const avgDivYield = sectorStocks.reduce((sum, s) => sum + s.dividendYield * s.marketCap, 0) / totalMarketCap
      const avgDebtEquity = sectorStocks.reduce((sum, s) => {
        const de = s.financials[0] && s.financials[0].totalEquity > 0
          ? (s.financials[0].longTermDebt + s.financials[0].shortTermDebt) / s.financials[0].totalEquity : 0
        return sum + de * s.marketCap
      }, 0) / totalMarketCap

      // Get EV/EBITDA from valuations
      const avgEVEbitda = sectorStocks.reduce((sum, s) => {
        const evVal = s.valuations.find(v => v.model === 'EV/EBITDA')
        return sum + (evVal ? evVal.fairValue * s.marketCap : 0)
      }, 0) / totalMarketCap

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
          totalMarketCap,
          numCompanies: sectorStocks.length,
          computedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ ok: true, sectorsComputed: Object.keys(sectorGroups).length, computedAt: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'Recompute failed', details: String(error) }, { status: 500 })
  }
}
