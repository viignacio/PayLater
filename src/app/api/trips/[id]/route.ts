import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toTrip } from '@/lib/transformers'
import { calculateBalances, applySettlements } from '@/lib/balance-calculator'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      creator:profiles!created_by(*),
      members:trip_members(*, user:profiles(*)),
      expenses(
        *,
        payer:profiles!paid_by(*),
        splits:expense_splits(*, user:profiles(*))
      )
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  return NextResponse.json({ trip: toTrip(data) })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, description, startDate, endDate } = body

  const { data, error } = await supabase
    .from('trips')
    .update({
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`*, creator:profiles!created_by(*), members:trip_members(*, user:profiles(*))`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ trip: toTrip(data), message: 'Trip updated successfully' })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch trip with expenses, splits, settlements, and members for balance check
  const { data: trip, error: fetchError } = await supabase
    .from('trips')
    .select(`
      id,
      members:trip_members(user:profiles(id, name)),
      expenses(id, amount, paid_by, splits:expense_splits(user_id, amount)),
      settlements(paid_by, paid_to, amount)
    `)
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  type TripWithRelations = {
    id: string
    expenses: Array<{ id: string; amount: number; paid_by: string; splits: Array<{ user_id: string; amount: number }> }>
    settlements: Array<{ paid_by: string; paid_to: string; amount: number }>
    members: Array<{ user: { id: string; name: string } | null }>
  }
  const tripData = trip as unknown as TripWithRelations

  const expenses = (tripData.expenses ?? []).map((e) => ({
    id: e.id,
    amount: Number(e.amount),
    paidBy: e.paid_by,
    splits: (e.splits ?? []).map((s) => ({ userId: s.user_id, amount: Number(s.amount) })),
  }))

  const settlements = (tripData.settlements ?? []).map((s) => ({
    paidBy: s.paid_by, paidTo: s.paid_to, amount: Number(s.amount),
  }))

  const members = (tripData.members ?? []).map((m) => ({
    id: m.user?.id ?? '', name: m.user?.name ?? '',
  })).filter(m => m.id)

  const balances = applySettlements(calculateBalances(expenses, members), settlements)
  const hasUnsettledAmounts = balances.some(b => b.netBalance < -0.01)

  if (hasUnsettledAmounts) {
    return NextResponse.json(
      { error: 'Cannot delete trip with unsettled amounts.', code: 'UNSETTLED_AMOUNTS' },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'Trip deleted successfully' })
}
