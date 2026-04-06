import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toExpense } from '@/lib/transformers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get('tripId')
  if (!tripId) return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('expenses')
    .select(`*, payer:profiles!paid_by(*), splits:expense_splits(*, user:profiles(*))`)
    .eq('trip_id', tripId)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ expenses: (data ?? []).map(toExpense) })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tripId, title, description, amount, paidBy, splitType = 'EQUAL', splits = [] } = body

  if (!tripId || !title || !amount || !paidBy) {
    return NextResponse.json(
      { error: 'Trip ID, title, amount, and paid by are required' },
      { status: 400 }
    )
  }

  if (parseFloat(amount) <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  }

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      trip_id: tripId,
      title: title.trim(),
      description: description?.trim() ?? null,
      amount: parseFloat(amount),
      paid_by: paidBy,
      split_type: splitType,
    })
    .select()
    .single()

  if (expenseError) return NextResponse.json({ error: expenseError.message }, { status: 500 })

  if (splits.length > 0) {
    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splits.map((s: { userId: string; amount: string | number }) => ({
        expense_id: expense.id,
        user_id: s.userId,
        amount: parseFloat(s.amount.toString()),
      })))

    if (splitsError) return NextResponse.json({ error: splitsError.message }, { status: 500 })
  }

  const { data: fullExpense, error: fetchError } = await supabase
    .from('expenses')
    .select(`*, payer:profiles!paid_by(*), splits:expense_splits(*, user:profiles(*))`)
    .eq('id', expense.id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  return NextResponse.json({ expense: toExpense(fullExpense), message: 'Expense created successfully' })
}
