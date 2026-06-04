export interface OHLCVRow {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Fetch price history for an EGX stock from Yahoo Finance
 * Uses the free chart API endpoint
 */
export async function fetchEGXPriceHistory(
  ticker: string,
  fromDate: Date
): Promise<OHLCVRow[]> {
  // Yahoo Finance uses .CA suffix for Cairo exchange
  const yahooTicker = `${ticker}.CA`
  const period2 = Math.floor(Date.now() / 1000)
  const period1 = Math.floor(fromDate.getTime() / 1000)

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&period1=${period1}&period2=${period2}`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!response.ok) {
      console.warn(`Yahoo Finance API returned ${response.status} for ${ticker}`)
      return []
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]
    if (!result) return []

    const timestamps = result.timestamp ?? []
    const quotes = result.indicators?.quote?.[0]
    if (!quotes) return []

    const rows: OHLCVRow[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const open = quotes.open?.[i]
      const high = quotes.high?.[i]
      const low = quotes.low?.[i]
      const close = quotes.close?.[i]
      const volume = quotes.volume?.[i]

      // Skip rows with null values
      if (open == null || high == null || low == null || close == null) continue

      rows.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: volume ?? 0,
      })
    }

    return rows
  } catch (error) {
    console.error(`Failed to fetch price data for ${ticker}:`, error)
    return []
  }
}

/**
 * Refresh all stock prices from data sources
 * Called by scheduled route
 */
export async function refreshAllPrices(): Promise<{ updated: number; errors: string[] }> {
  const { db } = await import('@/lib/db')
  const errors: string[] = []
  let updated = 0

  try {
    const stocks = await db.stock.findMany({ select: { id: true, ticker: true } })
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    for (const stock of stocks) {
      try {
        const priceData = await fetchEGXPriceHistory(stock.ticker, twoYearsAgo)

        if (priceData.length === 0) {
          errors.push(`No data returned for ${stock.ticker}`)
          continue
        }

        // Upsert price history
        for (const row of priceData) {
          await db.priceHistory.upsert({
            where: {
              stockId_date: { stockId: stock.id, date: row.date },
            },
            create: {
              stockId: stock.id,
              date: row.date,
              open: row.open,
              high: row.high,
              low: row.low,
              close: row.close,
              volume: row.volume,
              source: 'yahoo',
              isAdjusted: true,
            },
            update: {
              open: row.open,
              high: row.high,
              low: row.low,
              close: row.close,
              volume: row.volume,
            },
          })
        }

        // Update last price timestamp
        const latestPrice = priceData[priceData.length - 1]
        await db.stock.update({
          where: { id: stock.id },
          data: {
            price: latestPrice.close,
            lastPriceAt: new Date(latestPrice.date),
          },
        })

        updated++
      } catch (err) {
        errors.push(`Error refreshing ${stock.ticker}: ${err}`)
      }
    }
  } catch (err) {
    errors.push(`Database error: ${err}`)
  }

  return { updated, errors }
}

/**
 * Import financial data from a CSV file
 * CSV format: ticker,year,quarter,revenue,ebitda,netIncome,totalAssets,totalEquity,totalDebt,eps,dividendsPerShare,sharesOutstanding
 */
export async function importFinancialsFromCSV(filePath: string): Promise<{ imported: number; errors: string[] }> {
  const { db } = await import('@/lib/db')
  const fs = await import('fs')
  const errors: string[] = []
  let imported = 0

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.trim().split('\n')
    const _header = lines[0] // Skip header

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < 12) continue

      const [ticker, yearStr, quarterStr, revenueStr, ebitdaStr, netIncomeStr,
             totalAssetsStr, totalEquityStr, totalDebtStr, epsStr, divStr, sharesStr] = cols

      try {
        const stock = await db.stock.findUnique({ where: { ticker: ticker.trim() } })
        if (!stock) {
          errors.push(`Stock ${ticker} not found`)
          continue
        }

        const year = parseInt(yearStr)
        const quarter = parseInt(quarterStr) || 0

        await db.financialData.upsert({
          where: {
            stockId_year_quarter: { stockId: stock.id, year, quarter },
          },
          create: {
            stockId: stock.id,
            year,
            quarter,
            revenue: parseFloat(revenueStr) || 0,
            ebitda: parseFloat(ebitdaStr) || 0,
            netIncome: parseFloat(netIncomeStr) || 0,
            totalAssets: parseFloat(totalAssetsStr) || 0,
            totalEquity: parseFloat(totalEquityStr) || 0,
            totalLiabilities: parseFloat(totalDebtStr) || 0,
            eps: parseFloat(epsStr) || 0,
            dividendsPerShare: parseFloat(divStr) || 0,
            sharesOutstanding: parseFloat(sharesStr) || 0,
            dataSource: 'csv_import',
            reportType: quarter > 0 ? 'quarterly' : 'annual',
            currency: 'EGP',
            reportingDate: new Date(year, quarter > 0 ? (quarter - 1) * 3 : 11, quarter > 0 ? 30 : 31),
          },
          update: {
            revenue: parseFloat(revenueStr) || 0,
            ebitda: parseFloat(ebitdaStr) || 0,
            netIncome: parseFloat(netIncomeStr) || 0,
            totalAssets: parseFloat(totalAssetsStr) || 0,
            totalEquity: parseFloat(totalEquityStr) || 0,
            totalLiabilities: parseFloat(totalDebtStr) || 0,
            eps: parseFloat(epsStr) || 0,
            dividendsPerShare: parseFloat(divStr) || 0,
            sharesOutstanding: parseFloat(sharesStr) || 0,
          },
        })

        imported++
      } catch (err) {
        errors.push(`Error importing line ${i}: ${err}`)
      }
    }
  } catch (err) {
    errors.push(`File error: ${err}`)
  }

  return { imported, errors }
}
