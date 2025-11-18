import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/api-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params

    console.log('📧 Getting participants for booking:', bookingId)

    // Call your backend API to get booking participants
    const backendUrl = getBackendApiUrl(`booking-email/${bookingId}/participants`)
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': process.env.NEXT_PUBLIC_APP_ID || 'default_app_id',
        'X-Service-Key': process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key',
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    const result = await backendResponse.json()

    if (!backendResponse.ok) {
      console.error('❌ Backend API error:', result)
      return NextResponse.json({ 
        success: false,
        message: result.message || 'Failed to get booking participants',
        error: result.error 
      }, { status: backendResponse.status })
    }

    console.log('✅ Participants retrieved successfully:', result.data?.participants?.length || 0)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Error getting booking participants:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 })
  }
}

