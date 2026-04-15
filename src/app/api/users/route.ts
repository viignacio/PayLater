import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { toProfile } from '@/lib/transformers'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await db.query.profiles.findMany({
    orderBy: [desc(profiles.createdAt)],
  })

  const users = results.map(row => ({
    ...toProfile(row),
    name: row.deletedAt ? `${row.name} (Deleted User)` : row.name,
  }))

  return NextResponse.json({ users })
}

export async function PUT(request: NextRequest) {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, name, avatar, qrCode } = body

  const targetId = id || userId

  await db.update(profiles)
    .set({
      ...(name && { name: name.trim() }),
      ...(avatar !== undefined && { avatar }),
      ...(qrCode !== undefined && { qrCode }),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, targetId))

  const updatedProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, targetId),
  })

  return NextResponse.json({ 
    user: toProfile(updatedProfile), 
    message: 'Profile updated successfully' 
  })
}

export async function DELETE(request: NextRequest) {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get('id')

  if (!targetUserId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  if (targetUserId !== userId) return NextResponse.json({ error: 'Can only delete your own account' }, { status: 403 })

  await db.update(profiles)
    .set({ 
      deletedAt: new Date(), 
      updatedAt: new Date() 
    })
    .where(eq(profiles.id, targetUserId))

  return NextResponse.json({ message: 'User deleted successfully' })
}
