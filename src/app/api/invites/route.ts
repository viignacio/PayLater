import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toTripInvite } from '@/lib/transformers'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tripId, email, role = 'MEMBER' } = body

  if (!tripId || !email) {
    return NextResponse.json({ error: 'Trip ID and email are required' }, { status: 400 })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('trip_invites')
    .insert({
      trip_id: tripId,
      invited_by: user.id,
      email: email.toLowerCase().trim(),
      role,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email has already been invited to this trip' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/invite?token=${token}`

  return NextResponse.json({
    invite: toTripInvite(data),
    inviteUrl,
    message: 'Invite created. Share this link with the invitee.',
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get('tripId')
  if (!tripId) return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('trip_invites')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invites: (data ?? []).map(toTripInvite) })
}
