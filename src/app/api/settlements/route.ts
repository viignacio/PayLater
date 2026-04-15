import { NextRequest, NextResponse } from 'next/server'
import { syncUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { settlements } from '@/lib/db/schema'
import { toSettlement } from '@/lib/transformers'
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

  const results = await db.query.settlements.findMany({
    where: eq(settlements.tripId, tripId),
    with: {
      payer: true,
      receiver: true,
    },
    orderBy: [desc(settlements.createdAt)],
  })

  return NextResponse.json({ settlements: results.map(toSettlement) })
}

export async function POST(request: NextRequest) {
  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tripId, paidBy, paidTo, amount, currency = 'PHP', note } = body

  if (!tripId || !paidBy || !paidTo || !amount) {
    return NextResponse.json(
      { error: 'Trip ID, paid by, paid to, and amount are required' },
      { status: 400 }
    )
  }

  const parsedAmount = parseFloat(amount)
  if (parsedAmount <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  }

  if (paidBy === paidTo) {
    return NextResponse.json({ error: 'Payer and receiver cannot be the same' }, { status: 400 })
  }

  const [newSettlement] = await db.insert(settlements).values({
    tripId,
    paidBy,
    paidTo,
    amount: parsedAmount.toString(),
    currency,
    note: note ?? null,
  }).returning()

  if (!newSettlement) {
    return NextResponse.json({ error: 'Failed to record settlement' }, { status: 500 })
  }

  const fullSettlement = await db.query.settlements.findFirst({
    where: eq(settlements.id, newSettlement.id),
    with: {
      payer: true,
      receiver: true,
    },
  })

  return NextResponse.json({ 
    settlement: toSettlement(fullSettlement), 
    message: 'Settlement recorded successfully' 
  })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const settlementId = searchParams.get('id')
  if (!settlementId) {
    return NextResponse.json({ error: 'Settlement ID is required' }, { status: 400 })
  }

  const userId = await syncUser()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.delete(settlements).where(eq(settlements.id, settlementId))

  return NextResponse.json({ message: 'Settlement deleted' })
}
