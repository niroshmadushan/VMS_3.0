// Authentication helper functions for Supabase
import { createBrowserSupabaseClient } from './supabase-browser'
import { createClient } from './supabase'

export interface SignUpData {
  email: string
  password: string
  fullName?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: 'admin' | 'employee' | 'reception' | 'user'
  department?: string
  jobPosition?: string
  employeeId?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  phone: string | null
  role: string
  department: string | null
  job_position: string | null
  employee_id: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// SIGN UP FUNCTION
// =====================================================
export async function signUp(data: SignUpData) {
  const supabase = createBrowserSupabaseClient()
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          first_name: data.firstName || '',
          last_name: data.lastName || '',
          phone: data.phone || '',
          role: data.role || 'user',
          department: data.department || '',
          job_position: data.jobPosition || '',
          employee_id: data.employeeId || ''
        }
      }
    })

    if (authError) {
      throw authError
    }

    // Log the signup event
    if (authData.user) {
      await supabase.rpc('log_auth_event', {
        event_type: 'signup',
        user_id: authData.user.id,
        event_metadata: {
          email: data.email,
          role: data.role || 'user',
          department: data.department || '',
          job_position: data.jobPosition || ''
        }
      })
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
      message: 'Sign up successful! Please check your email to confirm your account.'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Sign up failed. Please try again.'
    }
  }
}

// =====================================================
// SIGN IN FUNCTION
// =====================================================
export async function signIn(data: SignInData) {
  const supabase = createBrowserSupabaseClient()
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    if (authError) {
      throw authError
    }

    // Log the login event
    if (authData.user) {
      await supabase.rpc('log_auth_event', {
        event_type: 'login',
        user_id: authData.user.id,
        event_metadata: {
          email: data.email
        }
      })
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
      message: 'Sign in successful!'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Sign in failed. Please check your credentials.'
    }
  }
}

// =====================================================
// SIGN OUT FUNCTION
// =====================================================
export async function signOut() {
  const supabase = createBrowserSupabaseClient()
  
  try {
    // Log the logout event before signing out
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.rpc('log_auth_event', {
        event_type: 'logout',
        user_id: user.id
      })
    }

    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }

    return {
      success: true,
      message: 'Signed out successfully!'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Sign out failed. Please try again.'
    }
  }
}

// =====================================================
// GET USER PROFILE
// =====================================================
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createBrowserSupabaseClient()
  
  try {
    const { data, error } = await supabase.rpc('get_user_profile')
    
    if (error) {
      throw error
    }

    return data?.[0] || null
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// =====================================================
// UPDATE USER PROFILE
// =====================================================
export async function updateUserProfile(updates: Partial<UserProfile>) {
  const supabase = createBrowserSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log the profile update event
    if (data) {
      await supabase.rpc('log_auth_event', {
        event_type: 'profile_updated',
        event_metadata: {
          updated_fields: Object.keys(updates)
        }
      })
    }

    return {
      success: true,
      profile: data,
      message: 'Profile updated successfully!'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Profile update failed. Please try again.'
    }
  }
}

// =====================================================
// PASSWORD RESET
// =====================================================
export async function resetPassword(email: string) {
  const supabase = createBrowserSupabaseClient()
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      message: 'Password reset email sent! Please check your inbox.'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Password reset failed. Please try again.'
    }
  }
}

// =====================================================
// UPDATE PASSWORD
// =====================================================
export async function updatePassword(newPassword: string) {
  const supabase = createBrowserSupabaseClient()
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      message: 'Password updated successfully!'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Password update failed. Please try again.'
    }
  }
}

// =====================================================
// CHECK IF USER IS AUTHENTICATED
// =====================================================
export async function isAuthenticated(): Promise<boolean> {
  const supabase = createBrowserSupabaseClient()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    return false
  }
}

// =====================================================
// GET CURRENT USER
// =====================================================
export async function getCurrentUser() {
  const supabase = createBrowserSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw error
    }

    return user
  } catch (error: any) {
    console.error('Error getting current user:', error)
    return null
  }
}

// =====================================================
// CHECK USER ROLE
// =====================================================
export async function hasRole(requiredRole: string): Promise<boolean> {
  try {
    const profile = await getUserProfile()
    return profile?.role === requiredRole
  } catch (error) {
    return false
  }
}

// =====================================================
// CHECK IF USER IS ADMIN
// =====================================================
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

// =====================================================
// CHECK IF USER IS EMPLOYEE
// =====================================================
export async function isEmployee(): Promise<boolean> {
  return hasRole('employee')
}

// =====================================================
// CHECK IF USER IS RECEPTION
// =====================================================
export async function isReception(): Promise<boolean> {
  return hasRole('reception')
}
