import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toProfile } from '@/lib/transformers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const users = (data ?? []).map(row => ({
    ...toProfile(row),
    name: row.deleted_at ? `${row.name} (Deleted User)` : row.name,
  }))

  return NextResponse.json({ users })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, name, avatar, qrCode } = body

  const targetId = id || user.id

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(name && { name: name.trim() }),
      ...(avatar !== undefined && { avatar }),
      ...(qrCode !== undefined && { qr_code: qrCode }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ user: toProfile(data), message: 'Profile updated successfully' })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  if (userId !== user.id) return NextResponse.json({ error: 'Can only delete your own account' }, { status: 403 })

  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'User deleted successfully' })
}
