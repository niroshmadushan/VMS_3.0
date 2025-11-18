/**
 * Centralized API Configuration
 * All backend API URLs are managed from here
 */

// Backend API Base URL
// Change this value or set NEXT_PUBLIC_API_URL environment variable to update all API calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.12.230:3000'

// App ID and Service Key for API authentication
export const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
export const SERVICE_KEY = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'

// Site URL (for email links, etc.)
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

// Helper function to get full API endpoint URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // Ensure endpoint starts with /api if not already
  const apiEndpoint = cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`
  return `${API_BASE_URL}${apiEndpoint}`
}

// Helper function to get backend API URL (for Next.js API routes that forward to backend)
export const getBackendApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // Ensure endpoint starts with /api if not already
  const apiEndpoint = cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`
  return `${API_BASE_URL}${apiEndpoint}`
}

