import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toTripMember } from '@/lib/transformers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('trip_members')
    .insert({ trip_id: id, user_id: userId, role: 'MEMBER' })
    .select('*, user:profiles(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'User is already a member of this trip' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'User added to trip successfully', member: toTripMember(data) })
}
