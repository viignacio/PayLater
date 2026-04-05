import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toSettlement } from '@/lib/transformers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get('tripId')
  if (!tripId) return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      payer:profiles!paid_by(*),
      receiver:profiles!paid_to(*)
    `)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settlements: (data ?? []).map(toSettlement) })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tripId, paidBy, paidTo, amount, currency = 'PHP', note } = body

  if (!tripId || !paidBy || !paidTo || !amount) {
    return NextResponse.json(
      { error: 'Trip ID, paid by, paid to, and amount are required' },
      { status: 400 }
    )
  }

  if (parseFloat(amount) <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  }

  if (paidBy === paidTo) {
    return NextResponse.json({ error: 'Payer and receiver cannot be the same' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('settlements')
    .insert({
      trip_id: tripId,
      paid_by: paidBy,
      paid_to: paidTo,
      amount: parseFloat(amount),
      currency,
      note: note ?? null,
    })
    .select(`*, payer:profiles!paid_by(*), receiver:profiles!paid_to(*)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settlement: toSettlement(data), message: 'Settlement recorded successfully' })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const settlementId = searchParams.get('id')
  if (!settlementId) return NextResponse.json({ error: 'Settlement ID is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('settlements').delete().eq('id', settlementId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'Settlement deleted' })
}
