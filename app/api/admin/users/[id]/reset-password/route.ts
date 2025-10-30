import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  console.log('API route /api/admin/users/[id]/reset-password called with method: POST')
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/')[4] // Extract ID from /api/admin/users/[id]/reset-password

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin.from('profiles').select('email').eq('id', id).single()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: { redirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/login' }
    })

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json({ error: `Password reset failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Password reset email sent' }, { status: 200 })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}