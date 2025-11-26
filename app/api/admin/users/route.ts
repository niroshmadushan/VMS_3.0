import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with anon key for signUp
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Admin client for profile verification and cleanup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(req: Request) {
  console.log('API route /api/admin/users called with method: POST at', new Date().toISOString())
  try {
    const { fullName, email, phone, role, is_active } = await req.json()

    // Validate inputs
    if (!fullName || !email || !phone || !role || is_active === undefined) {
      console.error('Missing required fields:', { fullName, email, phone, role, is_active })
      return NextResponse.json({ error: 'Missing required fields: fullName, email, phone, role, and is_active are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email)
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!['admin', 'reception', 'employee'].includes(role)) {
      console.error('Invalid role:', role)
      return NextResponse.json({ error: 'Invalid role: must be admin, reception, or employee' }, { status: 400 })
    }

    const phoneRegex = /^\+\d{10,15}$/
    if (!phoneRegex.test(phone)) {
      console.error('Invalid phone format:', phone)
      return NextResponse.json({ error: 'Invalid phone number: must be in E.164 format (e.g., +1234567890)' }, { status: 400 })
    }

    // Check for existing email using RPC
    console.log('Checking email existence with RPC:', email)
    const { data: emailExists, error: rpcError } = await supabaseAdmin.rpc('check_email_exists', { p_email: email })
    if (rpcError) {
      console.error('Error checking email existence:', rpcError.message, rpcError)
      return NextResponse.json({ error: `Failed to check email existence: ${rpcError.message}` }, { status: 500 })
    }
    if (emailExists) {
      console.error('Email already exists in auth.users:', email)
      return NextResponse.json({ error: `Email already exists: ${email}` }, { status: 400 })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + '@1Aa'

    // Create user with signUp
    console.log('Creating user with signUp:', { email, phone, role, is_active })
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      phone,
      password: tempPassword,
      options: {
        data: { 
          full_name: fullName, 
          role, 
          is_active,
          original_email: email, // Store original email to preserve format (e.g., dots in Gmail)
        },
        emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/login',
      },
    })

    if (signUpError) {
      console.error('Supabase signUp error:', signUpError.message, signUpError)
      return NextResponse.json({ error: `User creation failed: ${signUpError.message}` }, { status: 500 })
    }

    if (!authData.user) {
      console.error('No user returned from signUp')
      return NextResponse.json({ error: 'User creation failed: No user data returned' }, { status: 500 })
    }

    // Verify profile was created by trigger
    console.log('Verifying profile for user:', authData.user.id)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, is_active')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile verification error:', profileError?.message || 'Profile not found', profileError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: `Profile creation failed: ${profileError?.message || 'Profile not found'}` }, { status: 500 })
    }

    console.log('User created successfully:', authData.user.id)
    return NextResponse.json({ message: 'User created successfully' }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error creating user:', error)
    return NextResponse.json({ error: `User creation failed: ${error.message || 'Unknown error'}` }, { status: 500 })
  }
}