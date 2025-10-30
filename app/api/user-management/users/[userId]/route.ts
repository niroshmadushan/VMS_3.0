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

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get auth data
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)

    // Transform data
    const user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      is_email_verified: authUser?.user?.email_confirmed_at ? true : false,
      login_attempts: 0,
      locked_until: null,
      last_login: authUser?.user?.last_sign_in_at || null,
      user_created_at: profile.created_at,
      user_updated_at: profile.updated_at,
      profile_id: profile.id,
      first_name: profile.full_name?.split(' ')[0] || '',
      last_name: profile.full_name?.split(' ').slice(1).join(' ') || '',
      full_name: profile.full_name,
      phone: profile.phone,
      date_of_birth: null,
      address: null,
      city: null,
      state: null,
      country: null,
      postal_code: null,
      avatar_url: null,
      bio: null,
      website: null,
      social_links: null,
      preferences: null,
      custom_fields: null,
      profile_created_at: profile.created_at,
      profile_updated_at: profile.updated_at,
      status: profile.is_active ? 'active' : 'inactive'
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('User detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const body = await request.json()
    const { email, role } = body

    // Check if user exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update profile
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (email) {
      updateData.email = email
      // Also update auth email
      await supabaseAdmin.auth.admin.updateUserById(userId, { email })
    }

    if (role) {
      updateData.role = role
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('User update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Delete from auth (this will cascade to profile)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('User delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}