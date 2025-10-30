// Custom Backend Authentication Helper
// Replaces all Supabase authentication functionality

export interface SignUpData {
  email: string
  firstName: string
  lastName: string
  password: string
  role?: 'admin' | 'staff' | 'reception' | 'assistant' | 'user'
}

export interface SignInData {
  email: string
  password: string
}

export interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  isEmailVerified: boolean
  createdAt: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
const SERVICE_KEY = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'

// Helper function to make API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<AuthResponse> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    
    console.log('🌐 API Request:', url)
    console.log('🔑 App-Id:', APP_ID)
    console.log('🔑 Service-Key:', SERVICE_KEY ? '✅ Set' : '❌ Missing')
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': APP_ID,
        'X-Service-Key': SERVICE_KEY,
        ...options.headers,
      },
    })

    const data = await response.json()
    console.log('API Response status:', response.status, 'data:', data)
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Request failed',
        error: data.message
      }
    }

    return data
  } catch (error: any) {
    return {
      success: false,
      message: 'Network error occurred',
      error: error.message
    }
  }
}

// Helper function for authenticated requests
const authenticatedRequest = async (endpoint: string, options: RequestInit = {}): Promise<AuthResponse> => {
  const token = getStoredToken()
  if (!token) {
    return {
      success: false,
      message: 'No authentication token found',
      error: 'TOKEN_NOT_FOUND'
    }
  }

  return apiRequest(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
}

// Token management
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('authToken')
}

export const setStoredToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('authToken', token)
}

export const removeStoredToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('authToken')
}

// =====================================================
// AUTHENTICATION FUNCTIONS
// =====================================================

// Sign up new user
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  const response = await apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role: data.role || 'user'
    })
  })

  return response
}

// Sign in user (step 1 - sends OTP OR completes direct login)
export async function signIn(data: SignInData): Promise<AuthResponse> {
  console.log('SignIn request to /api/auth/login with:', { email: data.email })
  
  const response = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password
    })
  })

  console.log('SignIn API response:', response)
  
  // If direct login (no OTP required), store tokens and user data
  if (response.success && !response.data?.otpRequired) {
    if (response.data?.session?.token) {
      console.log('Direct login success - storing authentication data')
      setStoredToken(response.data.session.token)
      if (response.data.session.refreshToken) {
        localStorage.setItem('refreshToken', response.data.session.refreshToken)
      }
      if (response.data.user) {
        localStorage.setItem('userData', JSON.stringify(response.data.user))
      }
    }
  }
  
  return response
}

// Verify OTP (step 2 - completes login)
export async function verifyOTP(email: string, otpCode: string): Promise<AuthResponse> {
  const response = await apiRequest('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      email,
      otpCode
    })
  })

  if (response.success && response.data?.session?.token) {
    // Store tokens according to the documentation format
    setStoredToken(response.data.session.token)
    if (response.data.session.refreshToken) {
      localStorage.setItem('refreshToken', response.data.session.refreshToken)
    }
    if (response.data.user) {
      localStorage.setItem('userData', JSON.stringify(response.data.user))
    }
  }

  return response
}

// Sign out user
export async function signOut(): Promise<AuthResponse> {
  try {
    const response = await authenticatedRequest('/api/auth/logout', {
      method: 'POST'
    })
    
    // Clear stored tokens regardless of API response
    clearStoredAuth()
    
    return response
  } catch (error) {
    // Clear stored tokens even if logout API fails
    clearStoredAuth()
    
    return {
      success: false,
      message: 'Logout completed locally',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Clear all stored authentication data
export function clearStoredAuth(): void {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userData')
  console.log('Cleared all stored authentication data')
}

// Check if token is expired (basic JWT expiration check)
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true // Assume expired if we can't parse it
  }
}

// Sign out from all devices
export async function signOutAll(): Promise<AuthResponse> {
  const response = await authenticatedRequest('/api/auth/logout-all', {
    method: 'POST'
  })

  if (response.success) {
    removeStoredToken()
  }

  return response
}

// =====================================================
// EMAIL VERIFICATION
// =====================================================

// Verify email with token
export async function verifyEmail(token: string): Promise<AuthResponse> {
  const response = await apiRequest('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token })
  })

  return response
}

// =====================================================
// PASSWORD RESET
// =====================================================

// Request password reset
export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  const response = await apiRequest('/api/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify({ email })
  })

  return response
}

// Verify password reset OTP
export async function verifyPasswordResetOTP(email: string, otpCode: string): Promise<AuthResponse> {
  const response = await apiRequest('/api/auth/password-reset/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otpCode })
  })

  return response
}

// Confirm password reset
export async function confirmPasswordReset(email: string, otpCode: string, newPassword: string): Promise<AuthResponse> {
  const response = await apiRequest('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, otpCode, newPassword })
  })

  return response
}

// Change password (authenticated)
export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
  const response = await authenticatedRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  })

  return response
}

// =====================================================
// TOKEN MANAGEMENT
// =====================================================

// Validate token
export async function validateToken(): Promise<AuthResponse> {
  const token = getStoredToken()
  if (!token) {
    return {
      success: false,
      message: 'No token found',
      error: 'TOKEN_NOT_FOUND'
    }
  }

  // Use authenticatedRequest to include Authorization header
  const response = await authenticatedRequest('/api/auth/validate-token', {
    method: 'POST'
  })

  return response
}

// Refresh token
export async function refreshToken(): Promise<AuthResponse> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    return {
      success: false,
      message: 'No refresh token found',
      error: 'REFRESH_TOKEN_NOT_FOUND'
    }
  }

  const response = await apiRequest('/api/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  })

  if (response.success && response.data?.token) {
    setStoredToken(response.data.token)
  }

  return response
}

// =====================================================
// USER PROFILE MANAGEMENT
// =====================================================

// Get current user profile
export async function getCurrentUser(): Promise<UserProfile | null> {
  console.log('getCurrentUser - Starting...')
  
  // First try to get user from stored data
  const storedUserData = localStorage.getItem('userData')
  const token = getStoredToken()
  
  console.log('getCurrentUser - Stored data check:', {
    hasStoredUserData: !!storedUserData,
    hasToken: !!token
  })
  
  if (storedUserData && token) {
    try {
      const user = JSON.parse(storedUserData)
      console.log('getCurrentUser - Found stored user data:', {
        userId: user.id,
        email: user.email,
        role: user.role
      })
      
      // Check if token is expired locally first
      if (isTokenExpired(token)) {
        console.log('getCurrentUser - Token is expired, clearing auth data')
        clearStoredAuth()
        return null
      }
      
      console.log('getCurrentUser - Token is valid, returning user')
      // Return user immediately without validation for better UX
      // Validation can happen in background if needed
      return user
    } catch (error) {
      console.error('getCurrentUser - Error parsing stored user data:', error)
    }
  }

  // Fallback to token validation only if no stored data
  if (!storedUserData && token) {
    console.log('getCurrentUser - No stored user data, attempting token validation')
    try {
      const response = await validateToken()
      
      if (response.success && response.data) {
        console.log('getCurrentUser - Token validation successful, storing user data')
        // Store user data for future use
        localStorage.setItem('userData', JSON.stringify(response.data))
        return response.data
      }
    } catch (error) {
      console.error('getCurrentUser - Token validation failed:', error)
    }
  }
  
  console.log('getCurrentUser - No valid authentication found, returning null')
  return null
}

// Get user sessions
export async function getUserSessions(): Promise<AuthResponse> {
  const response = await authenticatedRequest('/api/auth/sessions', {
    method: 'GET'
  })

  return response
}

// Terminate specific session
export async function terminateSession(sessionId: string): Promise<AuthResponse> {
  const response = await authenticatedRequest(`/api/auth/sessions/${sessionId}`, {
    method: 'DELETE'
  })

  return response
}

// =====================================================
// ADMIN FUNCTIONS
// =====================================================

// Get all users (admin only)
export async function getAllUsers(): Promise<AuthResponse> {
  const response = await authenticatedRequest('/api/admin/users', {
    method: 'GET'
  })

  return response
}

// Get user by ID (admin only)
export async function getUserById(userId: number): Promise<AuthResponse> {
  const response = await authenticatedRequest(`/api/admin/users/${userId}`, {
    method: 'GET'
  })

  return response
}

// Update user role (admin only)
export async function updateUserRole(userId: number, role: string): Promise<AuthResponse> {
  const response = await authenticatedRequest(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  })

  return response
}

// Toggle user lock (admin only)
export async function toggleUserLock(userId: number): Promise<AuthResponse> {
  const response = await authenticatedRequest(`/api/admin/users/${userId}/lock`, {
    method: 'PUT'
  })

  return response
}

// Delete user (admin only)
export async function deleteUser(userId: number): Promise<AuthResponse> {
  const response = await authenticatedRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  })

  return response
}

// Get system statistics (admin only)
export async function getSystemStats(): Promise<AuthResponse> {
  const response = await authenticatedRequest('/api/admin/stats', {
    method: 'GET'
  })

  return response
}

// Get login analytics (admin only)
export async function getLoginAnalytics(): Promise<AuthResponse> {
  const response = await authenticatedRequest('/api/admin/analytics/logins', {
    method: 'GET'
  })

  return response
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = getStoredToken()
  if (!token) return false

  const response = await validateToken()
  return response.success
}

// Check if user has specific role
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === requiredRole
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

// Check if user is staff
export async function isStaff(): Promise<boolean> {
  return hasRole('staff')
}

// Check if user is reception
export async function isReception(): Promise<boolean> {
  return hasRole('reception')
}

// Check if user is assistant
export async function isAssistant(): Promise<boolean> {
  return hasRole('assistant')
}

// Health check
export async function healthCheck(): Promise<AuthResponse> {
  const response = await apiRequest('/health', {
    method: 'GET'
  })

  return response
}

// =====================================================
// AUTHENTICATION STATE MANAGEMENT
// =====================================================

export interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export class AuthManager {
  private static instance: AuthManager
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }
  private listeners: ((state: AuthState) => void)[] = []

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getState(): AuthState {
    return { ...this.state }
  }

  async initialize(): Promise<void> {
    this.setState({ isLoading: true })
    
    try {
      const user = await getCurrentUser()
      this.setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message
      })
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    this.setState({ isLoading: true, error: null })
    
    try {
      const response = await signIn({ email, password })
      
      // If direct login (no OTP required), update auth state
      if (response.success && !response.data?.otpRequired) {
        const user = response.data?.user
        console.log('AuthManager - Direct login success, updating state with user:', user)
        this.setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      } else {
        this.setState({ isLoading: false })
      }
      
      return response
    } catch (error: any) {
      this.setState({ isLoading: false, error: error.message })
      return {
        success: false,
        message: error.message,
        error: error.message
      }
    }
  }

  async verifyOTP(email: string, otpCode: string): Promise<AuthResponse> {
    this.setState({ isLoading: true, error: null })
    
    try {
      const response = await verifyOTP(email, otpCode)
      
      if (response.success) {
        // Use user data directly from the response according to documentation format
        const user = response.data?.user
        console.log('AuthManager - OTP verified, user data:', user)
        
        this.setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      } else {
        this.setState({ isLoading: false, error: response.message })
      }
      
      return response
    } catch (error: any) {
      this.setState({ isLoading: false, error: error.message })
      return {
        success: false,
        message: error.message,
        error: error.message
      }
    }
  }

  async signOut(): Promise<void> {
    this.setState({ isLoading: true })
    
    try {
      await signOut()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('SignOut error:', error)
    }
    
    // Clear all auth data
    clearStoredAuth()
    
    this.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
  }

  private setState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }
}
