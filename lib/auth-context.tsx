'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthManager, AuthState, UserProfile } from './custom-auth'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<any>
  verifyOTP: (email: string, otpCode: string) => Promise<any>
  signOut: () => Promise<void>
  signUp: (data: any) => Promise<any>
  requestPasswordReset: (email: string) => Promise<any>
  verifyPasswordResetOTP: (email: string, otpCode: string) => Promise<any>
  confirmPasswordReset: (email: string, otpCode: string, newPassword: string) => Promise<any>
  changePassword: (currentPassword: string, newPassword: string) => Promise<any>
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isEmployee: () => boolean
  isReception: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  })

  const authManager = AuthManager.getInstance()

  useEffect(() => {
    console.log('AuthProvider - Initializing...')
    
    // Subscribe to auth state changes with logging
    const unsubscribe = authManager.subscribe((state) => {
      console.log('AuthProvider - State changed:', {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        userRole: state.user?.role,
        isLoading: state.isLoading,
        error: state.error
      })
      setAuthState(state)
    })
    
    // Initialize auth state
    authManager.initialize()

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    return authManager.signIn(email, password)
  }

  const verifyOTP = async (email: string, otpCode: string) => {
    return authManager.verifyOTP(email, otpCode)
  }

  const signOut = async () => {
    return authManager.signOut()
  }

  const signUp = async (data: any) => {
    // Import signUp function dynamically to avoid circular imports
    const { signUp: signUpFunction } = await import('./custom-auth')
    return signUpFunction(data)
  }

  const requestPasswordReset = async (email: string) => {
    const { requestPasswordReset: requestPasswordResetFunction } = await import('./custom-auth')
    return requestPasswordResetFunction(email)
  }

  const verifyPasswordResetOTP = async (email: string, otpCode: string) => {
    const { verifyPasswordResetOTP: verifyPasswordResetOTPFunction } = await import('./custom-auth')
    return verifyPasswordResetOTPFunction(email, otpCode)
  }

  const confirmPasswordReset = async (email: string, otpCode: string, newPassword: string) => {
    const { confirmPasswordReset: confirmPasswordResetFunction } = await import('./custom-auth')
    return confirmPasswordResetFunction(email, otpCode, newPassword)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const { changePassword: changePasswordFunction } = await import('./custom-auth')
    return changePasswordFunction(currentPassword, newPassword)
  }

  const hasRole = (role: string): boolean => {
    return authState.user?.role === role
  }

  const isAdmin = (): boolean => {
    return hasRole('admin')
  }

  const isEmployee = (): boolean => {
    return hasRole('employee')
  }

  const isReception = (): boolean => {
    return hasRole('reception')
  }

  const value: AuthContextType = {
    ...authState,
    signIn,
    verifyOTP,
    signOut,
    signUp,
    requestPasswordReset,
    verifyPasswordResetOTP,
    confirmPasswordReset,
    changePassword,
    hasRole,
    isAdmin,
    isEmployee,
    isReception
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading])

  return { isAuthenticated, isLoading }
}

// Hook for role-based access
export function useRequireRole(requiredRole: string) {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== requiredRole) {
      // Redirect to unauthorized page or dashboard
      window.location.href = '/unauthorized'
    }
  }, [user, isAuthenticated, isLoading, requiredRole])

  return { 
    hasRole: user?.role === requiredRole, 
    isAuthenticated, 
    isLoading 
  }
}
