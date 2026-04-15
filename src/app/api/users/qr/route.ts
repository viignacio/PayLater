import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { toProfile } from '@/lib/transformers'
import { eq } from 'drizzle-orm'

export async function PUT(request: NextRequest) {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { qrCode } = await request.json()

  await db.update(profiles)
    .set({ qrCode, updatedAt: new Date() })
    .where(eq(profiles.id, userId))

  const updatedProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  })

  return NextResponse.json({ 
    user: toProfile(updatedProfile), 
    message: 'QR code updated' 
  })
}
