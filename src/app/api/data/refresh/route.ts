import { NextRequest, NextResponse } from 'next/server'
import { refreshAllPrices } from '@/lib/data/ingestion'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await refreshAllPrices()
    return NextResponse.json({
      ok: true,
      refreshedAt: new Date().toISOString(),
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Refresh failed', details: String(error) },
      { status: 500 }
    )
  }
}
