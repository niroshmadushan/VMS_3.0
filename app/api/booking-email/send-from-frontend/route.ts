import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get all request details
    const requestUrl = request.url
    const requestMethod = request.method
    const contentType = request.headers.get('Content-Type')
    const authHeader = request.headers.get('Authorization')
    const allHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      allHeaders[key] = key === 'authorization' ? 'Bearer ***' : value
    })

    console.log('📧 ==========================================')
    console.log('📧 ==========================================')
    console.log('📧 FULL API REQUEST - NEXT.JS API ROUTE')
    console.log('📧 ==========================================')
    console.log('📧 ==========================================')
    console.log('')
    console.log('📧 REQUEST URL:')
    console.log('📧   ', requestUrl)
    console.log('')
    console.log('📧 REQUEST METHOD:')
    console.log('📧   ', requestMethod)
    console.log('')
    console.log('📧 REQUEST HEADERS (All):')
    console.log('📧   ', JSON.stringify(allHeaders, null, 2))
    console.log('')
    console.log('📧 REQUEST HEADERS (Individual):')
    console.log('📧   Content-Type:', contentType || '❌ Missing')
    console.log('📧   Authorization:', authHeader ? '✅ Set (Bearer ***)' : '❌ Missing')
    console.log('📧   User-Agent:', request.headers.get('User-Agent') || 'N/A')
    console.log('📧   Accept:', request.headers.get('Accept') || 'N/A')
    console.log('')
    console.log('📧 REQUEST BODY (Raw JSON String):')
    const bodyString = JSON.stringify(body, null, 2)
    console.log('📧   ', bodyString)
    console.log('')
    console.log('📧 REQUEST BODY (Parsed/Object):')
    console.log('📧   ', JSON.stringify(body, null, 2))
    console.log('')
    console.log('📧 REQUEST BODY FIELDS:')
    console.log('📧   meetingName:', body.meetingName)
    console.log('📧   date:', body.date)
    console.log('📧   startTime:', body.startTime)
    console.log('📧   endTime:', body.endTime)
    console.log('📧   place:', body.place || '(not provided)')
    console.log('📧   description:', body.description || '(not provided)')
    console.log('📧   participantEmails:', body.participantEmails)
    console.log('📧   participantEmails (count):', body.participantEmails ? body.participantEmails.length : 0)
    console.log('📧   emailType:', body.emailType || 'booking_details (default)')
    console.log('📧   customMessage:', body.customMessage || '(not provided)')
    console.log('')
    console.log('📧 REQUEST BODY FIELD TYPES:')
    console.log('📧   meetingName type:', typeof body.meetingName)
    console.log('📧   date type:', typeof body.date)
    console.log('📧   startTime type:', typeof body.startTime)
    console.log('📧   endTime type:', typeof body.endTime)
    console.log('📧   participantEmails type:', typeof body.participantEmails)
    console.log('📧   participantEmails isArray:', Array.isArray(body.participantEmails))
    console.log('')
    console.log('📧 REQUEST BODY KEYS:')
    console.log('📧   ', Object.keys(body))
    console.log('')
    console.log('📧 COMPLETE REQUEST SUMMARY:')
    console.log('📧   URL:', requestUrl)
    console.log('📧   Method:', requestMethod)
    console.log('📧   Headers Count:', Object.keys(allHeaders).length)
    console.log('📧   Body Size:', bodyString.length, 'characters')
    console.log('📧   Body Keys:', Object.keys(body).length)
    console.log('')
    console.log('📧 ==========================================')
    console.log('📧 ==========================================')
    console.log('')

    // Validate required fields
    if (!body.meetingName) {
      return NextResponse.json({ 
        success: false,
        message: 'Meeting name is required'
      }, { status: 400 })
    }

    if (!body.date) {
      return NextResponse.json({ 
        success: false,
        message: 'Date is required'
      }, { status: 400 })
    }

    if (!body.startTime || !body.endTime) {
      return NextResponse.json({ 
        success: false,
        message: 'Start time and end time are required'
      }, { status: 400 })
    }

    if (!body.participantEmails || !Array.isArray(body.participantEmails) || body.participantEmails.length === 0) {
      return NextResponse.json({ 
        success: false,
        message: 'At least one participant email is required'
      }, { status: 400 })
    }

    // Extract token from Authorization header (authHeader already defined above)
    const token = authHeader?.replace('Bearer ', '') || ''
    
    // Validate that token is present
    if (!authHeader || !token) {
      console.error('❌ ==========================================')
      console.error('❌ MISSING AUTHORIZATION TOKEN')
      console.error('❌ ==========================================')
      console.error('❌ authHeader:', authHeader)
      console.error('❌ token:', token)
      console.error('❌ ==========================================')
      return NextResponse.json({ 
        success: false,
        message: 'Authentication token is required. Please log in and try again.',
        error: 'TOKEN_REQUIRED'
      }, { status: 401 })
    }

    // Prepare backend request with all required headers
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/booking-email/send-from-frontend`
    const backendMethod = 'POST'
    
    // Always include X-App-Id and X-Service-Key (backend requires these)
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
    const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'
    
    const backendHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': authHeader, // Keep the full "Bearer <token>" format
      'X-App-Id': appId, // Always include (required by backend)
      'X-Service-Key': serviceKey // Always include (required by backend)
    }
    
    const backendBody = JSON.stringify(body)
    
    console.log('📧 ==========================================')
    console.log('📧 TOKEN VALIDATION')
    console.log('📧 ==========================================')
    console.log('📧 Token Present:', !!token)
    console.log('📧 Token Length:', token.length)
    console.log('📧 Token Preview:', token.substring(0, 20) + '...')
    console.log('📧 Authorization Header:', authHeader ? 'Bearer ***' : '❌ Missing')
    console.log('📧 App-Id:', appId || '❌ Not configured')
    console.log('📧 Service-Key:', serviceKey ? '✅ Set' : '❌ Not configured')
    console.log('📧 ==========================================')

    console.log('📧 ==========================================')
    console.log('📧 ==========================================')
    console.log('📧 FULL BACKEND API REQUEST - NEXT.JS → BACKEND')
    console.log('📧 ==========================================')
    console.log('📧 ==========================================')
    console.log('')
    console.log('📧 BACKEND REQUEST URL:')
    console.log('📧   ', backendUrl)
    console.log('')
    console.log('📧 BACKEND REQUEST METHOD:')
    console.log('📧   ', backendMethod)
    console.log('')
    console.log('📧 BACKEND REQUEST HEADERS:')
    console.log('📧   Content-Type:', backendHeaders['Content-Type'])
    console.log('📧   X-App-Id:', backendHeaders['X-App-Id'])
    console.log('📧   X-Service-Key:', backendHeaders['X-Service-Key'] ? '✅ Set' : '❌ Missing')
    console.log('📧   Authorization:', backendHeaders['Authorization'] ? '✅ Set (Bearer ***)' : '❌ Missing')
    console.log('')
    console.log('📧 BACKEND REQUEST HEADERS (Full Object):')
    const headersForLog = { ...backendHeaders }
    if (headersForLog['Authorization']) {
      headersForLog['Authorization'] = 'Bearer ***'
    }
    console.log('📧   ', JSON.stringify(headersForLog, null, 2))
    console.log('')
    console.log('📧 BACKEND REQUEST HEADERS (Verification):')
    console.log('📧   All required headers present:', 
      !!backendHeaders['Content-Type'] && 
      !!backendHeaders['X-App-Id'] && 
      !!backendHeaders['X-Service-Key'] && 
      !!backendHeaders['Authorization']
    )
    console.log('')
    console.log('📧 BACKEND REQUEST BODY (JSON String):')
    console.log('📧   ', backendBody)
    console.log('')
    console.log('📧 BACKEND REQUEST BODY (Parsed/Object):')
    console.log('📧   ', JSON.stringify(body, null, 2))
    console.log('')
    console.log('📧 BACKEND REQUEST BODY FIELDS:')
    console.log('📧   meetingName:', body.meetingName)
    console.log('📧   date:', body.date)
    console.log('📧   startTime:', body.startTime)
    console.log('📧   endTime:', body.endTime)
    console.log('📧   place:', body.place || '(not provided)')
    console.log('📧   description:', body.description || '(not provided)')
    console.log('📧   participantEmails:', body.participantEmails)
    console.log('📧   participantEmails (count):', body.participantEmails ? body.participantEmails.length : 0)
    console.log('📧   emailType:', body.emailType || 'booking_details (default)')
    console.log('📧   customMessage:', body.customMessage || '(not provided)')
    console.log('')
    console.log('📧 COMPLETE BACKEND FETCH REQUEST:')
    console.log('📧   fetch("' + backendUrl + '", {')
    console.log('📧     method: "' + backendMethod + '",')
    console.log('📧     headers: ' + JSON.stringify(backendHeaders, null, 6).replace(/"Authorization":\s*"[^"]+"/, '"Authorization": "Bearer ***"').replace(/\n/g, '\n📧     '))
    console.log('📧     body: ' + backendBody.substring(0, 200) + (backendBody.length > 200 ? '...' : ''))
    console.log('📧   })')
    console.log('')
    console.log('📧 ==========================================')
    console.log('📧 ==========================================')
    console.log('')

    const requestStartTime = Date.now()
    console.log('📧 Sending backend request at:', new Date().toISOString())
    console.log('📧 Request timestamp:', requestStartTime)
    console.log('📧 Authorization header present:', !!backendHeaders['Authorization'])
    console.log('📧 Authorization header value:', backendHeaders['Authorization'] ? 'Bearer ***' : '❌ Missing')
    
    // Call backend API
    const backendResponse = await fetch(backendUrl, {
      method: backendMethod,
      headers: backendHeaders,
      body: backendBody
    })

    const requestDuration = Date.now() - requestStartTime
    console.log('📧 Backend Request Duration:', requestDuration + 'ms')
    console.log('📧 Backend Response Status:', backendResponse.status)
    console.log('📧 Backend Response OK:', backendResponse.ok)
    console.log('📧 Backend Response Status Text:', backendResponse.statusText)

    // Handle error responses before parsing JSON
    if (!backendResponse.ok) {
      let errorData
      try {
        errorData = await backendResponse.json()
      } catch (parseError) {
        const errorText = await backendResponse.text()
        console.error('❌ Backend returned non-JSON error:', errorText)
        return NextResponse.json({ 
          success: false,
          message: `Backend error: ${backendResponse.status} ${backendResponse.statusText}`,
          error: errorText
        }, { status: backendResponse.status })
      }
      
      console.error('❌ ==========================================')
      console.error('❌ BACKEND API ERROR')
      console.error('❌ ==========================================')
      console.error('❌ Status:', backendResponse.status)
      console.error('❌ Error Message:', errorData.message)
      console.error('❌ Error Details:', errorData.error)
      console.error('❌ Full Error Response:', JSON.stringify(errorData, null, 2))
      
      // If 401, provide more specific error message
      if (backendResponse.status === 401) {
        return NextResponse.json({ 
          success: false,
          message: errorData.message || 'Authentication failed. Please check your token and try again.',
          error: 'AUTHENTICATION_FAILED',
          details: 'The backend API requires a valid authentication token. Please ensure you are logged in and your session is valid.'
        }, { status: 401 })
      }
      
      return NextResponse.json({ 
        success: false,
        message: errorData.message || 'Failed to send booking emails',
        error: errorData.error 
      }, { status: backendResponse.status })
    }

    // Parse successful response
    const result = await backendResponse.json()

    console.log('📧 ==========================================')
    console.log('📧 BACKEND API RESPONSE')
    console.log('📧 ==========================================')
    console.log('📧 Response Status:', backendResponse.status)
    console.log('📧 Response OK:', backendResponse.ok)
    console.log('📧 Response Success:', result.success)
    console.log('📧 Response Message:', result.message)

    console.log('📧 ==========================================')
    console.log('📧 EMAIL SENDING RESULTS')
    console.log('📧 ==========================================')
    console.log('📧 Meeting Name:', result.data?.meetingName)
    console.log('📧 Total Participants:', result.data?.totalParticipants)
    console.log('📧 Emails Sent (Success):', result.data?.emailsSent)
    console.log('📧 Emails Failed:', result.data?.emailsFailed)
    console.log('📧 Success Rate:', result.data?.totalParticipants > 0 
      ? `${((result.data?.emailsSent / result.data?.totalParticipants) * 100).toFixed(1)}%` 
      : 'N/A')
    console.log('📧 ==========================================')
    console.log('📧 DETAILED EMAIL RESULTS:')
    console.log('📧 ==========================================')
    if (result.data?.results && Array.isArray(result.data.results)) {
      result.data.results.forEach((emailResult: any, index: number) => {
        if (emailResult.success) {
          console.log(`✅ ${index + 1}. ${emailResult.participantEmail} - ${emailResult.message}`)
        } else {
          console.error(`❌ ${index + 1}. ${emailResult.participantEmail} - ${emailResult.message}`)
        }
      })
    }
    console.log('📧 ==========================================')
    console.log('✅ BOOKING EMAILS SENT SUCCESSFULLY')
    console.log('📧 ==========================================')

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Error sending booking emails:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 })
  }
}

