import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { tripInvites, tripMembers, trips } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const invite = await db.query.tripInvites.findFirst({
    where: and(
      eq(tripInvites.token, token),
      eq(tripInvites.status, 'PENDING')
    ),
  })

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  if (new Date(invite.expiresAt) < new Date()) {
    await db.update(tripInvites)
      .set({ status: 'EXPIRED' })
      .where(eq(tripInvites.id, invite.id))
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  // Require the user to be authenticated before accepting
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        tripId: invite.tripId,
        email: invite.email,
      },
      { status: 401 }
    )
  }

  // Add user to trip
  try {
    await db.insert(tripMembers).values({
      tripId: invite.tripId,
      userId: userId,
      role: invite.role,
    })
  } catch (error) {
    const err = error as { code?: string; message?: string };
    // Ignore duplicate member errors (code 23505)
    if (err.code !== '23505') {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // Mark invite as accepted
  await db.update(tripInvites)
    .set({ status: 'ACCEPTED' })
    .where(eq(tripInvites.id, invite.id))

  return NextResponse.json({ tripId: invite.tripId, message: 'Invite accepted' })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const invite = await db.query.tripInvites.findFirst({
    where: and(
      eq(tripInvites.token, token),
      eq(tripInvites.status, 'PENDING')
    ),
  })

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, invite.tripId),
    columns: {
      id: true,
      name: true,
    },
  })

  return NextResponse.json({
    tripId: invite.tripId,
    tripName: trip?.name ?? '',
    email: invite.email,
    expiresAt: invite.expiresAt,
  })
}
