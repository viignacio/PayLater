import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toExpense } from '@/lib/transformers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('expenses')
    .select(`*, payer:profiles!paid_by(*), splits:expense_splits(*, user:profiles(*))`)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

  return NextResponse.json({ expense: toExpense(data) })
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
  const { title, description, amount, date, paidBy, splitType, splits = [] } = body

  if (amount && parseFloat(amount) <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('expenses')
    .update({
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(date && { date }),
      ...(paidBy && { paid_by: paidBy }),
      ...(splitType && { split_type: splitType }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  if (splits.length > 0) {
    await supabase.from('expense_splits').delete().eq('expense_id', id)
    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splits.map((s: { userId: string; amount: string | number }) => ({
        expense_id: id,
        user_id: s.userId,
        amount: parseFloat(s.amount.toString()),
      })))
    if (splitsError) return NextResponse.json({ error: splitsError.message }, { status: 500 })
  }

  const { data, error: fetchError } = await supabase
    .from('expenses')
    .select(`*, payer:profiles!paid_by(*), splits:expense_splits(*, user:profiles(*))`)
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  return NextResponse.json({ expense: toExpense(data), message: 'Expense updated successfully' })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'Expense deleted successfully' })
}
