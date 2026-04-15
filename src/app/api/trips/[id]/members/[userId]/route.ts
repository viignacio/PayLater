import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tripMembers } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params
  const { userId: currentUserId } = await auth()
  
  if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await db.delete(tripMembers)
      .where(and(
        eq(tripMembers.tripId, id as any),
        eq(tripMembers.userId, userId)
      ))

    return NextResponse.json({ message: 'Member removed from trip' })
  } catch (error: any) {
    console.error('Error removing trip member:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
