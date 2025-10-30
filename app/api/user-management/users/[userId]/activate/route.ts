import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Check if user exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Activate user in profiles
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error activating user:', error)
      return NextResponse.json({ error: 'Failed to activate user' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User activated successfully'
    })

  } catch (error) {
    console.error('User activation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}