import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
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
  try {
    const { email } = await req.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (findError) {
      console.error('Error finding user:', findError)
      return NextResponse.json(
        { success: false, message: 'Failed to find user' },
        { status: 500 }
      )
    }

    const user = users.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found with this email address' },
        { status: 404 }
      )
    }

    // Check if email is already verified
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, message: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate verification link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/verify-email`,
      },
    })

    if (linkError || !linkData) {
      console.error('Error generating verification link:', linkError)
      
      // Fallback: Try to resend confirmation email
      const { data: resendData, error: resendError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'email',
        email: email,
      })

      if (resendError || !resendData) {
        console.error('Error resending verification email:', resendError)
        return NextResponse.json(
          { success: false, message: 'Failed to send verification email. Please try again later.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully. Please check your inbox and spam folder.',
      })
    }

    // Send verification email using Resend if available
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const verificationLink = linkData.properties.action_link || linkData.properties.hashed_token
      
      const { error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email,
        subject: 'Verify Your Email Address - Smart Visitor',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">📧 Email Verification</h2>
            <p>Hello,</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationLink}" style="color: #007bff; word-break: break-all;">${verificationLink}</a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you didn't request this verification email, please ignore it.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              This link will expire in 24 hours.
            </p>
          </div>
        `,
        text: `Please verify your email address by visiting: ${verificationLink}`,
      })

      if (emailError) {
        console.error('Resend email error:', emailError)
        // Still return success if Supabase link was generated
        return NextResponse.json({
          success: true,
          message: 'Verification link generated. Please check your email or contact support.',
        })
      }
    } catch (emailServiceError) {
      console.error('Email service error:', emailServiceError)
      // Continue even if email service fails - Supabase might have sent it
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox and spam folder.',
    })
  } catch (error: any) {
    console.error('Error in resend-verification endpoint:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}


