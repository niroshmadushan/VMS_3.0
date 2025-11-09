import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const body = await request.json()

    console.log('📧 ==========================================')
    console.log('📧 NEXT.JS API ROUTE - SEND DETAILS')
    console.log('📧 ==========================================')
    console.log('📧 Booking ID:', bookingId)
    console.log('📧 Request body:', JSON.stringify(body, null, 2))
    console.log('📧 Participant IDs (optional):', body.participantIds)
    console.log('📧 Participant IDs count:', body.participantIds ? body.participantIds.length : 0)
    console.log('📧 Email Type (required):', body.emailType)
    console.log('📧 Custom Message (optional):', body.customMessage || '(none)')
    
    // Validate required fields
    if (!body.emailType) {
      console.error('❌ ==========================================')
      console.error('❌ MISSING REQUIRED FIELD: emailType')
      console.error('❌ ==========================================')
      return NextResponse.json({ 
        success: false,
        message: 'emailType is required',
        error: 'emailType is missing'
      }, { status: 400 })
    }
    
    // participantIds is optional - if not provided or empty, backend will send to all participants
    if (body.participantIds && !Array.isArray(body.participantIds)) {
      console.error('❌ ==========================================')
      console.error('❌ INVALID participantIds FORMAT')
      console.error('❌ ==========================================')
      console.error('❌ participantIds must be an array, got:', typeof body.participantIds)
      return NextResponse.json({ 
        success: false,
        message: 'participantIds must be an array',
        error: 'Invalid participantIds format'
      }, { status: 400 })
    }

    // Prepare request body for backend - match exact format
    const backendRequestBody: {
      participantIds?: string[]
      emailType: string
      customMessage?: string
    } = {
      emailType: body.emailType // Required
    }
    
    // participantIds is optional - only include if provided and not empty
    if (body.participantIds && Array.isArray(body.participantIds) && body.participantIds.length > 0) {
      backendRequestBody.participantIds = body.participantIds
    }
    
    // customMessage is optional - only include if provided
    if (body.customMessage && body.customMessage.trim() !== '') {
      backendRequestBody.customMessage = body.customMessage.trim()
    }
    
    console.log('📧 ==========================================')
    console.log('📧 FORWARDING TO BACKEND API')
    console.log('📧 ==========================================')
    console.log('📧 Backend URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/booking-email/${bookingId}/send-details`)
    console.log('📧 Backend Request Body:', JSON.stringify(backendRequestBody, null, 2))
    console.log('📧 Backend Headers:', {
      'Content-Type': 'application/json',
      'X-App-Id': process.env.NEXT_PUBLIC_APP_ID || 'default_app_id',
      'X-Service-Key': process.env.NEXT_PUBLIC_SERVICE_KEY ? '✅ Set' : '❌ Missing',
      'Authorization': request.headers.get('Authorization') ? '✅ Set' : '❌ Missing'
    })
    
    // Call your backend API to send booking details
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/booking-email/${bookingId}/send-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': process.env.NEXT_PUBLIC_APP_ID || 'default_app_id',
        'X-Service-Key': process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(backendRequestBody)
    })

    const result = await backendResponse.json()

    if (!backendResponse.ok) {
      console.error('❌ Backend API error:', result)
      return NextResponse.json({ 
        success: false,
        message: result.message || 'Failed to send booking details',
        error: result.error 
      }, { status: backendResponse.status })
    }

    console.log('✅ Booking details sent successfully:', result.data?.emailsSent || 0, 'emails')

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Error sending booking details:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 })
  }
}

