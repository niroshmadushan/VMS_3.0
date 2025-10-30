import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  console.log('API route /api/send-email called with method: POST')
  try {
    const { to, name, action, changes } = await req.json()
    if (!to || !name || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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
      console.error('Email send error:', error)
      return NextResponse.json({ error: `Failed to send email: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}