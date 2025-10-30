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
    // Get overview statistics
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: inactiveUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentRegistrations } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get limited profiles for recent active logins calculation (to avoid timeout)
    const { data: allProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(100) // Limit to avoid timeout

    // Get auth data to check recent logins
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    let recentActiveLogins = 0
    if (allProfiles) {
      // Process in batches to avoid overwhelming the API
      const batchSize = 10
      for (let i = 0; i < allProfiles.length; i += batchSize) {
        const batch = allProfiles.slice(i, i + batchSize)
        const results = await Promise.all(
          batch.map(async (profile) => {
            try {
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id)
              if (authUser?.user?.last_sign_in_at) {
                const lastLogin = new Date(authUser.user.last_sign_in_at)
                if (lastLogin >= sevenDaysAgo) {
                  return 1
                }
              }
              return 0
            } catch (error) {
              console.error(`Error fetching auth for user ${profile.id}:`, error)
              return 0
            }
          })
        )
        recentActiveLogins += results.reduce((sum, val) => sum + val, 0)
      }
    }

    // Role distribution
    const { data: roleData } = await supabaseAdmin
      .from('profiles')
      .select('role')
    
    const roleDistribution = roleData?.reduce((acc: any, profile: any) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1
      return acc
    }, {}) || {}

    const roleDistributionArray = Object.entries(roleDistribution).map(([role, count]) => ({
      role,
      count
    }))

    // Recent users (10 most recently registered)
    const { data: recentUsers } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Most active users (10 users with most recent logins)
    const profilesWithLogins = []
    if (allProfiles) {
      // Process in smaller batches
      const checkProfiles = allProfiles.slice(0, 30) // Check only 30 for performance
      const batchSize = 5
      
      for (let i = 0; i < checkProfiles.length; i += batchSize) {
        const batch = checkProfiles.slice(i, i + batchSize)
        const results = await Promise.all(
          batch.map(async (profile) => {
            try {
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id)
              const { data: profileData } = await supabaseAdmin
                .from('profiles')
                .select('id, email, role, full_name')
                .eq('id', profile.id)
                .single()
              
              if (authUser?.user?.last_sign_in_at && profileData) {
                return {
                  ...profileData,
                  last_login: authUser.user.last_sign_in_at
                }
              }
              return null
            } catch (error) {
              console.error(`Error fetching data for user ${profile.id}:`, error)
              return null
            }
          })
        )
        profilesWithLogins.push(...results.filter(r => r !== null))
      }
    }

    const mostActiveUsers = profilesWithLogins
      .sort((a, b) => new Date(b.last_login).getTime() - new Date(a.last_login).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          inactiveUsers: inactiveUsers || 0,
          recentRegistrations: recentRegistrations || 0,
          recentActiveLogins: recentActiveLogins || 0
        },
        roleDistribution: roleDistributionArray,
        recentUsers: recentUsers?.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.full_name?.split(' ')[0] || '',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          created_at: user.created_at
        })) || [],
        mostActiveUsers: mostActiveUsers.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.full_name?.split(' ')[0] || '',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          last_login: user.last_login
        }))
      }
    })

  } catch (error) {
    console.error('User statistics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}