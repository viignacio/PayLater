import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { tripInvites } from '@/lib/db/schema'
import { toTripInvite } from '@/lib/transformers'
import { randomBytes } from 'crypto'
import { desc, eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tripId, email, role = 'MEMBER' } = body

  if (!tripId || !email) {
    return NextResponse.json({ error: 'Trip ID and email are required' }, { status: 400 })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  try {
    const [newInvite] = await db.insert(tripInvites).values({
      tripId: tripId,
      invitedBy: userId,
      email: email.toLowerCase().trim(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: role as any,
      token,
      expiresAt: expiresAt,
    }).returning()

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/invite?token=${token}`

    return NextResponse.json({
      invite: toTripInvite(newInvite),
      inviteUrl,
      message: 'Invite created. Share this link with the invitee.',
    })
  } catch (error) {
    const err = error as any;
    if (err.code === '23505') {
      return NextResponse.json({ error: 'This email has already been invited to this trip' }, { status: 400 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get('tripId')
  if (!tripId) return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })

  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await db.query.tripInvites.findMany({
    where: eq(tripInvites.tripId, tripId),
    orderBy: [desc(tripInvites.createdAt)],
  })

  return NextResponse.json({ invites: results.map(toTripInvite) })
}
