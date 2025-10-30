import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const body = await request.json()

    console.log('📧 Sending reminder for booking:', bookingId)
    console.log('📧 Reminder type:', body.reminderType)

    // Call your backend API to send reminder
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/booking-email/${bookingId}/send-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': process.env.NEXT_PUBLIC_APP_ID || 'default_app_id',
        'X-Service-Key': process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body)
    })

    const result = await backendResponse.json()

    if (!backendResponse.ok) {
      console.error('❌ Backend API error:', result)
      return NextResponse.json({ 
        success: false,
        message: result.message || 'Failed to send reminder',
        error: result.error 
      }, { status: backendResponse.status })
    }

    console.log('✅ Reminder sent successfully:', result.data?.emailsSent || 0, 'emails')

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Error sending reminder:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 })
  }
}
