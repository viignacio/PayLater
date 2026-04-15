import { NextRequest, NextResponse } from 'next/server'
import { auth, syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, tripMembers } from '@/lib/db/schema'
import { toTrip } from '@/lib/transformers'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch trips where user is a member
  const results = await db.query.trips.findMany({
    where: eq(trips.isActive, true),
    with: {
      creator: true,
      members: {
        with: {
          user: true,
        },
      },
      expenses: true,
    },
    orderBy: [desc(trips.createdAt)],
  })

  // Filter trips in application logic if RLS-equivalent filtering is needed
  // Since we are moving away from DB RLS for now and using app logic.
  // Actually, we should filter by membership in the query.
  const userTrips = results.filter(trip => 
    trip.members.some(member => member.userId === userId)
  )

  return NextResponse.json({ trips: userTrips.map(toTrip) })
}

export async function POST(request: NextRequest) {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, startDate, endDate } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Trip name is required' }, { status: 400 })
  }

  // Create trip
  const [newTrip] = await db.insert(trips).values({
    name: name.trim(),
    description: description?.trim() ?? null,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    createdBy: userId,
  }).returning()

  if (!newTrip) {
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }

  // Add creator as member
  await db.insert(tripMembers).values({
    tripId: newTrip.id,
    userId: userId,
    role: 'CREATOR',
  })

  // Fetch full trip with relations
  const fullTrip = await db.query.trips.findFirst({
    where: eq(trips.id, newTrip.id),
    with: {
      creator: true,
      members: {
        with: {
          user: true,
        },
      },
    },
  })

  return NextResponse.json({ 
    trip: toTrip(fullTrip), 
    message: 'Trip created successfully' 
  })
}
