import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses, expenseSplits } from '@/lib/db/schema'
import { toExpense } from '@/lib/transformers'
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

  const data = await db.query.expenses.findFirst({
    where: eq(expenses.id, id),
    with: {
      payer: true,
      splits: {
        with: {
          user: true,
        },
      },
    },
  })

  if (!data) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  return NextResponse.json({ expense: toExpense(data) })
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

  const body: {
    title?: string
    description?: string
    amount?: string | number
    date?: string
    paidBy?: string
    splitType?: string
    splits?: Array<{ userId: string; amount: string | number }>
  } = await request.json()
  const { title, description, amount, date, paidBy, splitType, splits = [] } = body

  if (amount && parseFloat(String(amount)) <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  }

  try {
    const fullExpense = await db.transaction(async (tx) => {
      // Update expense
      await tx.update(expenses)
        .set({
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() ?? null }),
          ...(amount && { amount: parseFloat(String(amount)).toString() }),
          ...(date && { date: new Date(date) }),
          ...(paidBy && { paidBy }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(splitType && { splitType: splitType as any }),
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, id))

      // Update splits if provided
      if (splits.length > 0) {
        await tx.delete(expenseSplits).where(eq(expenseSplits.expenseId, id))
        await tx.insert(expenseSplits).values(
          splits.map((s) => ({
            expenseId: id,
            userId: s.userId,
            amount: parseFloat(s.amount.toString()).toString(),
          }))
        )
      }

      // Fetch full expense
      return await tx.query.expenses.findFirst({
        where: eq(expenses.id, id),
        with: {
          payer: true,
          splits: {
            with: {
              user: true,
            },
          },
        },
      })
    })

    return NextResponse.json({ 
      expense: toExpense(fullExpense), 
      message: 'Expense updated successfully' 
    })
  } catch (error) {
    const err = error as Error;
    console.error('Expense update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
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

  await db.delete(expenses).where(eq(expenses.id, id))

  return NextResponse.json({ message: 'Expense deleted successfully' })
}
