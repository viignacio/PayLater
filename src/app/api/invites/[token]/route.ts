import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Use service client to look up invite token (bypasses RLS)
  const serviceSupabase = await createServiceClient()
  const { data: invite, error: inviteError } = await serviceSupabase
    .from('trip_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'PENDING')
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    await serviceSupabase
      .from('trip_invites')
      .update({ status: 'EXPIRED' })
      .eq('id', invite.id)
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  // Require the user to be authenticated before accepting
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Return invite info so the login page can redirect back after auth
    return NextResponse.json(
      {
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        tripId: invite.trip_id,
        email: invite.email,
      },
      { status: 401 }
    )
  }

  // Add user to trip
  const { error: memberError } = await serviceSupabase
    .from('trip_members')
    .insert({ trip_id: invite.trip_id, user_id: user.id, role: invite.role })

  if (memberError && memberError.code !== '23505') {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Mark invite as accepted
  await serviceSupabase
    .from('trip_invites')
    .update({ status: 'ACCEPTED' })
    .eq('id', invite.id)

  return NextResponse.json({ tripId: invite.trip_id, message: 'Invite accepted' })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const serviceSupabase = await createServiceClient()

  const { data: invite, error } = await serviceSupabase
    .from('trip_invites')
    .select(`*, trip:trips(id, name)`)
    .eq('token', token)
    .eq('status', 'PENDING')
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  return NextResponse.json({
    tripId: (invite.trip as any).id,
    tripName: (invite.trip as any).name,
    email: invite.email,
    expiresAt: invite.expires_at,
  })
}
