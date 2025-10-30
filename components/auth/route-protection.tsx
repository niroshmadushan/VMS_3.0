'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface RouteProtectionProps {
  children: React.ReactNode
  requiredRole?: string
  fallbackPath?: string
}

export function RouteProtection({ 
  children, 
  requiredRole, 
  fallbackPath = '/' 
}: RouteProtectionProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    console.log('RouteProtection - Effect triggered:', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      requiredRole
    })

    if (isLoading) {
      console.log('RouteProtection - Still loading, waiting...')
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('RouteProtection - User not authenticated, redirecting to:', fallbackPath)
      console.log('RouteProtection - Auth state:', { isAuthenticated, user })
      router.push(fallbackPath)
      return
    }

    // Check if user has required role
    if (requiredRole && user.role !== requiredRole) {
      console.log('RouteProtection - User role mismatch. Required:', requiredRole, 'User role:', user.role)
      router.push(fallbackPath)
      return
    }

    // User is authorized
    console.log('RouteProtection - User authorized. Role:', user.role, 'Required:', requiredRole)
    setIsAuthorized(true)
  }, [isAuthenticated, user, isLoading, requiredRole, router, fallbackPath])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying access...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authorized (redirect will happen)
  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
