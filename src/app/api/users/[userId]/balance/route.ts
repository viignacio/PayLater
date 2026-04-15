import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { tripMembers, settlements } from '@/lib/db/schema'
import { calculateUserTotalBalance } from '@/lib/balance-calculator'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const currentUserId = await syncUser()
  if (!currentUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all trips where this user is a member
  const memberships = await db.query.tripMembers.findMany({
    where: eq(tripMembers.userId, userId),
    with: {
      trip: {
        with: {
          expenses: {
            with: {
              splits: true,
            },
          },
        },
      },
    },
  })

  let totalOwed = 0
  let totalOwing = 0
  const tripBalancesByTrip: Array<{ tripId: string; tripName: string; youOwe: number; youAreOwed: number }> = []

  for (const membership of memberships) {
    const trip = membership.trip
    if (!trip) continue

    // Fetch settlements for each trip manually (or we could have defined the relation)
    const tripSettlements = await db.query.settlements.findMany({
      where: eq(settlements.tripId, trip.id),
    })

    const expensesData = (trip.expenses ?? []).map((e) => ({
      amount: Number(e.amount),
      paidBy: e.paidBy,
      splits: (e.splits ?? []).map((s) => ({ userId: s.userId, amount: Number(s.amount) })),
    }))

    const settlementsData = (tripSettlements ?? []).map((s) => ({
      paidBy: s.paidBy,
      paidTo: s.paidTo,
      amount: Number(s.amount),
    }))

    const balance = calculateUserTotalBalance(userId, expensesData, settlementsData)
    totalOwed += balance.totalOwed
    totalOwing += balance.totalOwing

    if (balance.totalOwed > 0 || balance.totalOwing > 0) {
      tripBalancesByTrip.push({
        tripId: trip.id,
        tripName: trip.name,
        youOwe: balance.totalOwed,
        youAreOwed: balance.totalOwing,
      })
    }
  }

  return NextResponse.json({
    userId,
    youOwe: totalOwed,
    youAreOwed: totalOwing,
    netBalance: totalOwing - totalOwed,
    tripBalances: tripBalancesByTrip,
  })
}
