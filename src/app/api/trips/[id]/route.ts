import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips } from '@/lib/db/schema'
import { toTrip } from '@/lib/transformers'
import { calculateBalances, applySettlements } from '@/lib/balance-calculator'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      creator: true,
      members: {
        with: {
          user: true,
        },
      },
      expenses: {
        with: {
          payer: true,
          splits: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  })

  if (!data) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json({ trip: toTrip(data) })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, startDate, endDate } = body

  // Update trip
  await db.update(trips)
    .set({
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      updatedAt: new Date(),
    })
    .where(eq(trips.id, id))

  const data = await db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      creator: true,
      members: {
        with: {
          user: true,
        },
      },
    },
  })

  if (!data) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json({ 
    trip: toTrip(data), 
    message: 'Trip updated successfully' 
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch trip with expenses, splits, settlements, and members for balance check
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      members: {
        with: {
          user: true,
        },
      },
      expenses: {
        with: {
          splits: true,
        },
      },
    },
  })

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Fetch settlements separately since they aren't directly linked in the 'with' above 
  // without defining the relation in schema.ts (which we did but let's be sure).
  // Actually, I didn't add the 'settlements' relation to 'trips' in schema.ts.
  // I'll fetch them manually or update schema later if needed.
  const tripSettlements = await db.query.settlements.findMany({
    where: (settlements, { eq }) => eq(settlements.tripId, id),
  })

  const expenses = (trip.expenses ?? []).map((e) => ({
    id: e.id,
    amount: Number(e.amount),
    paidBy: e.paidBy,
    splits: (e.splits ?? []).map((s) => ({ userId: s.userId, amount: Number(s.amount) })),
  }))

  const settlements = (tripSettlements ?? []).map((s) => ({
    paidBy: s.paidBy, 
    paidTo: s.paidTo, 
    amount: Number(s.amount),
  }))

  const members = (trip.members ?? []).map((m) => ({
    id: m.user?.id ?? '', 
    name: m.user?.name ?? '',
  })).filter(m => m.id)

  const balances = applySettlements(calculateBalances(expenses, members), settlements)
  const hasUnsettledAmounts = balances.some(b => b.netBalance < -0.01)

  if (hasUnsettledAmounts) {
    return NextResponse.json(
      { error: 'Cannot delete trip with unsettled amounts.', code: 'UNSETTLED_AMOUNTS' },
      { status: 400 }
    )
  }

  await db.delete(trips).where(eq(trips.id, id))

  return NextResponse.json({ message: 'Trip deleted successfully' })
}
