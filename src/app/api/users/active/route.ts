import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { isNull, desc } from 'drizzle-orm'
import { toProfile } from '@/lib/transformers'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const activeProfiles = await db.query.profiles.findMany({
      where: isNull(profiles.deletedAt),
      orderBy: [desc(profiles.createdAt)],
    })

    return NextResponse.json({ users: activeProfiles.map(toProfile) })
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching active users:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
