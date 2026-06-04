import { NextRequest, NextResponse } from 'next/server'
import { refreshAllPrices } from '@/lib/data/ingestion'
import { z } from 'zod'

const RefreshBodySchema = z.object({
  source: z.enum(['egx', 'manual']).optional(),
}).optional()

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate request body if present
  try {
    const bodyText = await req.text()
    if (bodyText) {
      const bodyParsed = RefreshBodySchema.safeParse(JSON.parse(bodyText))
      if (!bodyParsed.success) {
        return NextResponse.json({ error: 'Invalid request body', details: bodyParsed.error.flatten() }, { status: 400 })
      }
    }
  } catch {
    // Empty body is acceptable
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
