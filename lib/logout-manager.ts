/**
 * Logout Manager - Complete logout functionality implementation
 * Based on LOGOUT_IMPLEMENTATION_GUIDE.md
 */

import { API_BASE_URL } from './api-config'

export class LogoutManager {
  private baseURL: string

  constructor(baseURL: string = `${API_BASE_URL}/api`) {
    this.baseURL = baseURL
  }

  // Get stored authentication token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  // Make authenticated request
  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.')
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    if (response.status === 401) {
      throw new Error('Authentication failed. Please login again.')
    }

    return response
  }

  // 1. SINGLE SESSION LOGOUT
  async logoutCurrentSession(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚪 Logging out current session...')
      
      const response = await this.makeAuthenticatedRequest('/auth/logout', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Logout successful')
        
        // Clear local storage
        this.clearLocalStorage()
        
        // Redirect to login page
        this.redirectToLogin()
        
        return {
          success: true,
          message: 'Logged out successfully'
        }
      } else {
        throw new Error(data.message || 'Logout failed')
      }

    } catch (error: any) {
      console.error('❌ Logout error:', error.message)
      
      // Even if logout request fails, clear local storage
      this.clearLocalStorage()
      this.redirectToLogin()
      
      return {
        success: false,
        message: error.message
      }
    }
  }

  // 2. LOGOUT FROM ALL DEVICES
  async logoutAllDevices(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚪 Logging out from all devices...')
      
      const response = await this.makeAuthenticatedRequest('/auth/logout-all', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Logout from all devices successful')
        
        // Clear local storage
        this.clearLocalStorage()
        
        // Show success message
        alert('You have been logged out from all devices successfully.')
        
        // Redirect to login page
        this.redirectToLogin()
        
        return {
          success: true,
          message: 'Logged out from all devices successfully'
        }
      } else {
        throw new Error(data.message || 'Logout from all devices failed')
      }

    } catch (error: any) {
      console.error('❌ Logout all devices error:', error.message)
      
      // Clear local storage even if request fails
      this.clearLocalStorage()
      this.redirectToLogin()
      
      return {
        success: false,
        message: error.message
      }
    }
  }

  // 3. GET USER SESSIONS
  async getUserSessions(): Promise<{ success: boolean; sessions: any[]; totalSessions: number; message?: string }> {
    try {
      console.log('📱 Fetching user sessions...')
      
      const response = await this.makeAuthenticatedRequest('/auth/sessions')

      const data = await response.json()

      if (data.success) {
        console.log('✅ Sessions fetched successfully')
        return {
          success: true,
          sessions: data.data.sessions,
          totalSessions: data.data.totalSessions
        }
      } else {
        throw new Error(data.message || 'Failed to fetch sessions')
      }

    } catch (error: any) {
      console.error('❌ Get sessions error:', error.message)
      return {
        success: false,
        message: error.message,
        sessions: [],
        totalSessions: 0
      }
    }
  }

  // 4. TERMINATE SPECIFIC SESSION
  async terminateSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Terminating session: ${sessionId}`)
      
      const response = await this.makeAuthenticatedRequest(`/auth/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Session terminated successfully')
        return {
          success: true,
          message: 'Session terminated successfully'
        }
      } else {
        throw new Error(data.message || 'Failed to terminate session')
      }

    } catch (error: any) {
      console.error('❌ Terminate session error:', error.message)
      return {
        success: false,
        message: error.message
      }
    }
  }

  // HELPER METHODS
  clearLocalStorage(): void {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userData')
    console.log('🧹 Local storage cleared')
  }

  redirectToLogin(): void {
    console.log('🔄 Redirecting to login page...')
    window.location.href = '/'
  }

  // UTILITY: Check if user is logged in
  isLoggedIn(): boolean {
    const token = this.getAuthToken()
    return !!token
  }

  // UTILITY: Get current user data
  getCurrentUser(): any {
    const userData = localStorage.getItem('userData')
    return userData ? JSON.parse(userData) : null
  }
}

// Export singleton instance
export const logoutManager = new LogoutManager()
