import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function requireAuth(): Promise<{ error: NextResponse } | null> {
  const session = await getServerSession()
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return null
}
