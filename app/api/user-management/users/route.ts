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

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials',
        details: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          serviceKey: supabaseServiceKey ? 'Set' : 'Missing'
        }
      }, { status: 500 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    console.log('User Management API - GET /users', { page, limit, search, role, status })

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query for profiles
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role)
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get paginated results
    const { data: profiles, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get auth data for each user to include last_login (in batches to avoid timeout)
    const usersWithAuth = []
    const batchSize = 5
    
    for (let i = 0; i < (profiles || []).length; i += batchSize) {
      const batch = (profiles || []).slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (profile) => {
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id)
            
            return {
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
          } catch (error) {
            console.error(`Error fetching auth for user ${profile.id}:`, error)
            // Return user data without auth info if there's an error
            return {
              id: profile.id,
              email: profile.email,
              role: profile.role,
              is_email_verified: false,
              login_attempts: 0,
              locked_until: null,
              last_login: null,
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
          }
        })
      )
      usersWithAuth.push(...batchResults)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithAuth,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        }
      }
    })

  } catch (error) {
    console.error('User management API error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}