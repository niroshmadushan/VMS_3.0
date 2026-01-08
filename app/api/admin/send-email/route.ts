import { NextResponse } from 'next/server'

// Lazy load Resend only when needed to avoid build-time errors
async function getResend() {
  const { Resend } = await import('resend')
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

export async function POST(req: Request) {
  try {
    const { to, name, action, changes } = await req.json()
    if (!to || !name || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'Email service is not configured. Please set RESEND_API_KEY environment variable.' 
      }, { status: 500 })
    }

    const resend = await getResend()

    const subject = {
      welcome: 'Welcome to the Platform',
      profile_updated: 'Your Profile Has Been Updated',
      status_changed: 'Your Account Status Has Changed',
      password_reset: 'Password Reset Request',
      manual_notification: 'Notification from Admin',
    }[action] || 'Notification'

    const body = {
      welcome: `Hello ${name}, your account has been created.`,
      profile_updated: `Hello ${name}, your profile has been updated: ${changes.join(', ')}.`,
      status_changed: `Hello ${name}, your account status has changed: ${changes.join(', ')}.`,
      password_reset: `Hello ${name}, click the link to reset your password.`,
      manual_notification: `Hello ${name}, this is a notification from the admin.`,
    }[action] || `Hello ${name}, you have a new notification.`

    const { error } = await resend.emails.send({
      from: 'no-reply@yourdomain.com',
      to,
      subject,
      text: body,
    })

    if (error) {
      return NextResponse.json({ error: `Failed to send email: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An error occurred while sending email' 
    }, { status: 500 })
  }
}