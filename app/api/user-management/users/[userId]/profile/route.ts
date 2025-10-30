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

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const body = await request.json()
    const {
      first_name,
      last_name,
      phone
    } = body

    // Check if user exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update profile
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Combine first_name and last_name into full_name
    if (first_name !== undefined || last_name !== undefined) {
      const currentFullName = existingProfile.full_name || ''
      const currentParts = currentFullName.split(' ')
      const newFirstName = first_name !== undefined ? first_name : currentParts[0] || ''
      const newLastName = last_name !== undefined ? last_name : currentParts.slice(1).join(' ') || ''
      updateData.full_name = `${newFirstName} ${newLastName}`.trim()
    }

    if (phone !== undefined) {
      updateData.phone = phone
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}