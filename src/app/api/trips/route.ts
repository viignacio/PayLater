import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toTrip } from '@/lib/transformers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      creator:profiles!created_by(*),
      members:trip_members(*, user:profiles(*)),
      expenses(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ trips: (data ?? []).map(toTrip) })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, description, startDate, endDate } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Trip name is required' }, { status: 400 })
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      name: name.trim(),
      description: description?.trim() ?? null,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (tripError) return NextResponse.json({ error: tripError.message }, { status: 500 })

  const { error: memberError } = await supabase
    .from('trip_members')
    .insert({ trip_id: trip.id, user_id: user.id, role: 'CREATOR' })

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  const { data: fullTrip, error: fetchError } = await supabase
    .from('trips')
    .select(`
      *,
      creator:profiles!created_by(*),
      members:trip_members(*, user:profiles(*))
    `)
    .eq('id', trip.id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  return NextResponse.json({ trip: toTrip(fullTrip), message: 'Trip created successfully' })
}
