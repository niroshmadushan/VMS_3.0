import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: Request) {
  console.log('API route /api/admin/users/[id]/status called with method: PATCH')
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/')[4] // Extract ID from /api/admin/users/[id]/status

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('is_active')
      .eq('id', id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newIsActive = !user.is_active

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: newIsActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Status update error:', error)
      return NextResponse.json({ error: `Status update failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ is_active: newIsActive }, { status: 200 })
  } catch (error) {
    console.error('Error toggling status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}