import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateUserTotalBalance } from '@/lib/balance-calculator'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all trips where this user is a member, with expenses + splits + settlements
  const { data: memberships, error } = await supabase
    .from('trip_members')
    .select(`
      trip:trips(
        id,
        name,
        expenses(
          id,
          amount,
          paid_by,
          splits:expense_splits(user_id, amount)
        ),
        settlements(paid_by, paid_to, amount)
      )
    `)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let totalOwed = 0
  let totalOwing = 0
  const tripBalances: Array<{ tripId: string; tripName: string; youOwe: number; youAreOwed: number }> = []

  for (const membership of memberships ?? []) {
    const trip = membership.trip as any
    if (!trip) continue

    const expenses = (trip.expenses ?? []).map((e: any) => ({
      amount: Number(e.amount),
      paidBy: e.paid_by,
      splits: (e.splits ?? []).map((s: any) => ({ userId: s.user_id, amount: Number(s.amount) })),
    }))

    const settlements = (trip.settlements ?? []).map((s: any) => ({
      paidBy: s.paid_by,
      paidTo: s.paid_to,
      amount: Number(s.amount),
    }))

    const balance = calculateUserTotalBalance(userId, expenses, settlements)
    totalOwed += balance.totalOwed
    totalOwing += balance.totalOwing

    if (balance.totalOwed > 0 || balance.totalOwing > 0) {
      tripBalances.push({
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
    tripBalances,
  })
}
