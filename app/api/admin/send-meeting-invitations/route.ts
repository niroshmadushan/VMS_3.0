import { NextResponse } from 'next/server'
import { getBackendApiUrl, SITE_URL } from '@/lib/api-config'

export async function POST(req: Request) {
  console.log('API route /api/admin/send-meeting-invitations called with method: POST')
  
  try {
    const { booking, recipients } = await req.json()
    
    if (!booking || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: booking and recipients array' 
      }, { status: 400 })
    }

    // Validate booking data
    if (!booking.title || !booking.date || !booking.startTime || !booking.endTime || !booking.place) {
      return NextResponse.json({ 
        error: 'Missing required booking fields: title, date, startTime, endTime, place' 
      }, { status: 400 })
    }

    console.log('📧 Sending meeting invitations to:', recipients.length, 'recipients')
    console.log('📅 Meeting details:', {
      title: booking.title,
      date: booking.date,
      time: `${booking.startTime} - ${booking.endTime}`,
      place: booking.place,
      refId: booking.refId
    })

    // Format date for display
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    // Format time for display
    const formatTime = (timeString: string) => {
      return timeString.substring(0, 5) // Remove seconds if present
    }

    const meetingDate = formatDate(booking.date)
    const startTime = formatTime(booking.startTime)
    const endTime = formatTime(booking.endTime)

    // Create email subject
    const subject = `Meeting Invitation: ${booking.title}`

    // Create email body (HTML)
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .meeting-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .ref-id { background: #e3f2fd; padding: 10px; border-radius: 5px; text-align: center; margin: 20px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #1976d2; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Meeting Invitation</h1>
          <p>You have been invited to a meeting</p>
        </div>
        
        <div class="content">
          <div class="meeting-details">
            <h2 style="margin-top: 0; color: #333;">${booking.title}</h2>
            
            ${booking.description ? `<p style="color: #666; font-style: italic;">${booking.description}</p>` : ''}
            
            <div class="detail-row">
              <span class="label">📅 Date:</span>
              <span class="value">${meetingDate}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">🕐 Time:</span>
              <span class="value">${startTime} - ${endTime}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">📍 Location:</span>
              <span class="value">${booking.place}</span>
            </div>
            
            ${booking.responsiblePerson ? `
            <div class="detail-row">
              <span class="label">👤 Organizer:</span>
              <span class="value">${booking.responsiblePerson}</span>
            </div>
            ` : ''}
            
            ${booking.refId ? `
            <div class="ref-id">
              Meeting ID: ${booking.refId}
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Please mark your attendance using the Smart Assistant:</p>
            <a href="${SITE_URL}/smart-assistant" class="button">
              📱 Mark Attendance
            </a>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you have any questions, please contact the meeting organizer.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Create plain text version
    const textBody = `
Meeting Invitation: ${booking.title}

${booking.description ? `${booking.description}\n\n` : ''}Meeting Details:
- Date: ${meetingDate}
- Time: ${startTime} - ${endTime}
- Location: ${booking.place}
${booking.responsiblePerson ? `- Organizer: ${booking.responsiblePerson}` : ''}
${booking.refId ? `- Meeting ID: ${booking.refId}` : ''}

To mark your attendance, visit: ${SITE_URL}/smart-assistant

This is an automated message. Please do not reply to this email.
If you have any questions, please contact the meeting organizer.
    `

    // Send emails to all recipients using your backend API
    const emailPromises = recipients.map(async (email: string, index: number) => {
      console.log(`📧 ==========================================`)
      console.log(`📧 SENDING EMAIL ${index + 1}/${recipients.length}`)
      console.log(`📧 ==========================================`)
      console.log(`📧 Recipient Email: ${email}`)
      console.log(`📧 Email Subject: ${subject}`)
      const backendUrl = getBackendApiUrl('send-email')
      console.log(`📧 Backend API URL: ${backendUrl}`)
      console.log(`📧 App-Id: ${process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'}`)
      console.log(`📧 Service-Key: ${process.env.NEXT_PUBLIC_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`)
      
      try {
        const requestStartTime = Date.now()
        
        // Call your backend API to send the email (same as login OTP emails)
        const backendResponse = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Id': process.env.NEXT_PUBLIC_APP_ID || 'default_app_id',
            'X-Service-Key': process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key',
          },
          body: JSON.stringify({
            to: email,
            name: email.split('@')[0], // Use email prefix as name
            action: 'manual_notification',
            subject: subject,
            html: htmlBody,
            text: textBody
          })
        })

        const requestDuration = Date.now() - requestStartTime
        console.log(`📧 Response Status: ${backendResponse.status}`)
        console.log(`📧 Response OK: ${backendResponse.ok}`)
        console.log(`📧 Request Duration: ${requestDuration}ms`)

        const result = await backendResponse.json()
        console.log(`📧 Backend Response:`, JSON.stringify(result, null, 2))

        if (!backendResponse.ok) {
          console.error(`❌ ==========================================`)
          console.error(`❌ EMAIL SEND FAILED FOR: ${email}`)
          console.error(`❌ ==========================================`)
          console.error(`❌ Status: ${backendResponse.status}`)
          console.error(`❌ Error:`, result.error)
          console.error(`❌ Full Response:`, result)
          return { email, success: false, error: result.error || 'Failed to send email' }
        }

        console.log(`✅ ==========================================`)
        console.log(`✅ EMAIL SENT SUCCESSFULLY TO: ${email}`)
        console.log(`✅ ==========================================`)
        return { email, success: true }
      } catch (error: any) {
        console.error(`❌ ==========================================`)
        console.error(`❌ EMAIL SEND EXCEPTION FOR: ${email}`)
        console.error(`❌ ==========================================`)
        console.error(`❌ Error Type:`, error.constructor.name)
        console.error(`❌ Error Message:`, error.message)
        console.error(`❌ Error Stack:`, error.stack)
        console.error(`❌ Full Error:`, error)
        return { email, success: false, error: error.message }
      }
    })

    // Wait for all emails to be sent
    console.log(`📧 ==========================================`)
    console.log(`📧 WAITING FOR ALL EMAILS TO BE SENT`)
    console.log(`📧 ==========================================`)
    console.log(`📧 Total Recipients: ${recipients.length}`)
    
    const results = await Promise.all(emailPromises)
    
    // Count successful and failed sends
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)
    
    console.log(`📧 ==========================================`)
    console.log(`📧 EMAIL SENDING SUMMARY`)
    console.log(`📧 ==========================================`)
    console.log(`📧 Total Recipients: ${recipients.length}`)
    console.log(`📧 Successful: ${successful} ✅`)
    console.log(`📧 Failed: ${failed.length} ❌`)
    console.log(`📧 Success Rate: ${((successful / recipients.length) * 100).toFixed(1)}%`)

    if (failed.length > 0) {
      console.error(`❌ ==========================================`)
      console.error(`❌ FAILED EMAILS DETAILS`)
      console.error(`❌ ==========================================`)
      failed.forEach((f, index) => {
        console.error(`❌ ${index + 1}. ${f.email}: ${f.error}`)
      })
    }
    
    if (successful > 0) {
      console.log(`✅ ==========================================`)
      console.log(`✅ SUCCESSFUL EMAILS`)
      console.log(`✅ ==========================================`)
      results.filter(r => r.success).forEach((r, index) => {
        console.log(`✅ ${index + 1}. ${r.email}`)
      })
    }

    return NextResponse.json({ 
      message: `Meeting invitations sent successfully`,
      data: {
        total: recipients.length,
        successful: successful,
        failed: failed.length,
        failedEmails: failed.map(f => ({ email: f.email, error: f.error }))
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error sending meeting invitations:', error)
    return NextResponse.json({ 
      error: `Failed to send meeting invitations: ${error.message}` 
    }, { status: 500 })
  }
}
