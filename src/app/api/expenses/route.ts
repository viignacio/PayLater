import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses, expenseSplits } from '@/lib/db/schema'
import { toExpense } from '@/lib/transformers'
import { desc, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get('tripId')
  if (!tripId) {
    return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
  }

  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await db.query.expenses.findMany({
    where: eq(expenses.tripId, tripId),
    with: {
      payer: true,
      splits: {
        with: {
          user: true,
        },
      },
    },
    orderBy: [desc(expenses.date)],
  })

  return NextResponse.json({ expenses: results.map(toExpense) })
}

export async function POST(request: NextRequest) {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tripId, title, description, amount, paidBy, splitType = 'EQUAL', splits = [] } = body

  if (!tripId || !title || !amount || !paidBy) {
    return NextResponse.json(
      { error: 'Trip ID, title, amount, and paid by are required' },
      { status: 400 }
    )
  }

  const parsedAmount = parseFloat(amount)
  if (parsedAmount <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  }

  try {
    const fullExpense = await db.transaction(async (tx) => {
      // Create expense
      const [newExpense] = await tx.insert(expenses).values({
        tripId,
        title: title.trim(),
        description: description?.trim() ?? null,
        amount: parsedAmount.toString(),
        paidBy: paidBy,
        splitType: splitType,
      }).returning()

      if (!newExpense) {
        throw new Error('Failed to create expense')
      }

      // Add splits
      if (splits.length > 0) {
        await tx.insert(expenseSplits).values(
          splits.map((s: { userId: string; amount: string | number }) => ({
            expenseId: newExpense.id,
            userId: s.userId,
            amount: parseFloat(s.amount.toString()).toString(),
          }))
        )
      }

      // Fetch full expense with relations
      return await tx.query.expenses.findFirst({
        where: eq(expenses.id, newExpense.id),
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
      message: 'Expense created successfully' 
    })
  } catch (error) {
    const err = error as Error;
    console.error('Expense creation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
