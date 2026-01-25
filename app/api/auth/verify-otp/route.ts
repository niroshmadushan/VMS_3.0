import { NextRequest, NextResponse } from 'next/server'
import { getApiHeaders, getBackendApiUrl } from '@/lib/api-config'

/**
 * POST /api/auth/verify-otp
 * Step 2: Verify OTP code to complete login
 * Returns JWT tokens and user data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    if (!body.email || !body.otpCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and OTP code are required',
          errors: [
            {
              field: !body.email ? 'email' : 'otpCode',
              message: !body.email ? 'Email is required' : 'OTP code is required'
            }
          ]
        },
        { status: 400 }
      )
    }

    // Validate OTP code format (6 digits)
    const otpCode = body.otpCode.toString().trim().replace(/\D/g, '')
    if (otpCode.length !== 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'OTP code must be 6 digits',
          errors: [
            {
              field: 'otpCode',
              message: 'Invalid OTP code format'
            }
          ]
        },
        { status: 400 }
      )
    }

    // Forward request to backend API
    const backendUrl = getBackendApiUrl('/auth/verify-otp')
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({
        email: body.email.trim().toLowerCase(),
        otpCode: otpCode
      })
    })

    // Get response data
    const contentType = response.headers.get('content-type') || ''
    
    // Check if response is JSON, not an MD file or HTML
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      
      // If it's an MD file or HTML, return a proper error
      if (text.includes('#') || text.includes('<!DOCTYPE') || text.includes('<html')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Backend API is not responding correctly. Please check if the backend server is running at the configured URL.',
            error: 'INVALID_RESPONSE_TYPE'
          },
          { status: 502 }
        )
      }
      
      // Try to parse as JSON anyway
      try {
        const data = JSON.parse(text)
        return NextResponse.json(data, { status: response.status })
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid response from backend API',
            error: 'INVALID_RESPONSE'
          },
          { status: 502 }
        )
      }
    }

    const data = await response.json()

    // Return the response with proper status
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Verify OTP API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred during OTP verification',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

