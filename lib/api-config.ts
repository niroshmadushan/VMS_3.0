/**
 * Centralized API Configuration
 * All backend API URLs are managed from here
 */

// Backend API Base URL
// Use localhost:3000 for development, production API for production
const isDevelopment = process.env.NODE_ENV === 'development'
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:3000'
  : (process.env.NEXT_PUBLIC_API_URL || 'https://peopleapi.cbiz365.com')

// App ID and Service Key for API authentication
// These must match your backend configuration
export const APP_ID = isDevelopment
  ? 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123'
  : (process.env.NEXT_PUBLIC_APP_ID || 'default_app_id')

export const SERVICE_KEY = isDevelopment
  ? 'dfsdsda345Bdchvbjhbh456'
  : (process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key')

// Site URL (for email links, etc.)
// Use API base URL as fallback if SITE_URL not set
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || API_BASE_URL

// Helper function to normalize base URL (remove trailing slash)
const normalizeBaseUrl = (url: string): string => {
  return url.replace(/\/+$/, '')
}

// Helper function to get full API endpoint URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // Ensure endpoint starts with /api if not already
  const apiEndpoint = cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`
  const baseUrl = normalizeBaseUrl(API_BASE_URL)
  return `${baseUrl}${apiEndpoint}`
}

// Helper function to get API headers for requests
export const getApiHeaders = (additionalHeaders?: Record<string, string>) => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'x-app-id': APP_ID,
    'x-service-key': SERVICE_KEY,
    'Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:6001' : SITE_URL,
  }

  return additionalHeaders ? { ...baseHeaders, ...additionalHeaders } : baseHeaders
}

// Login API functions
export const loginAPI = {
  async login(credentials: { email: string; password: string }) {
    const response = await fetch(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(credentials)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Login failed')
    }

    return response.json()
  },

  async verifyOtp(data: { email: string; otpCode: string }) {
    const response = await fetch(getApiUrl('/auth/verify-otp'), {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'OTP verification failed')
    }

    return response.json()
  },

  async verifyEmail(token: string) {
    const response = await fetch(getApiUrl('/auth/verify-email'), {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ token })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error('Email verification failed')
    }

    return response.json()
  },

  async resendVerification(email: string) {
    const response = await fetch(getApiUrl('/auth/resend-verification'), {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to resend verification')
    }

    return response.json()
  }
}

// Helper function to get backend API URL (for Next.js API routes that forward to backend)
export const getBackendApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // Ensure endpoint starts with /api if not already
  const apiEndpoint = cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`
  const baseUrl = normalizeBaseUrl(API_BASE_URL)
  return `${baseUrl}${apiEndpoint}`
}

