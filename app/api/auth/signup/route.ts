import { NextRequest, NextResponse } from 'next/server'
import { getApiHeaders, getBackendApiUrl } from '@/lib/api-config'

/**
 * POST /api/auth/signup
 * Proxy signup request to backend API
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate request body
        if (!body.email || !body.password || !body.secretCode) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email, password, and secret code are required',
                    errors: [
                        {
                            field: 'required_fields',
                            message: 'Missing required fields'
                        }
                    ]
                },
                { status: 400 }
            )
        }

        // Forward request to backend API
        // The backend expects POST /api/auth/signup
        const backendUrl = getBackendApiUrl('/auth/signup')

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify(body)
        })

        // Get response data
        const contentType = response.headers.get('content-type') || ''

        // Check if response is JSON
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
        console.error('Signup API error:', error)
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'An error occurred during signup',
                error: 'INTERNAL_ERROR'
            },
            { status: 500 }
        )
    }
}
