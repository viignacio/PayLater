import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tripMembers } from '@/lib/db/schema'
import { toTripMember } from '@/lib/transformers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { userId: currentUserId } = await auth()
  
  if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })

  try {
    const [newMember] = await db.insert(tripMembers).values({
      tripId: id as any,
      userId: userId,
      role: 'MEMBER'
    }).returning()

    const memberWithProfile = await db.query.tripMembers.findFirst({
      where: (members, { eq }) => eq(members.id, newMember.id),
      with: {
        user: true
      }
    })

    return NextResponse.json({ message: 'User added to trip successfully', member: toTripMember(memberWithProfile) })
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'User is already a member of this trip' }, { status: 400 })
    }
    console.error('Error adding trip member:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
