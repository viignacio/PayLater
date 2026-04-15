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
        eq(tripMembers.tripId, id),
        eq(tripMembers.userId, userId)
      ))

    return NextResponse.json({ message: 'Member removed from trip' })
  } catch (error) {
    const err = error as Error;
    console.error('Error removing trip member:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
