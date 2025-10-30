/**
 * React Hook for Logout Functionality
 * Based on LOGOUT_IMPLEMENTATION_GUIDE.md
 */

import { useState, useCallback } from 'react'
import { logoutManager } from './logout-manager'

export const useLogout = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await logoutManager.logoutCurrentSession()
      
      if (!result.success) {
        setError(result.message)
      }
      
      return result
    } catch (err: any) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logoutAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await logoutManager.logoutAllDevices()
      
      if (!result.success) {
        setError(result.message)
      }
      
      return result
    } catch (err: any) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getSessions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await logoutManager.getUserSessions()
      
      if (!result.success) {
        setError(result.message)
      }
      
      return result
    } catch (err: any) {
      setError(err.message)
      return { success: false, message: err.message, sessions: [], totalSessions: 0 }
    } finally {
      setLoading(false)
    }
  }, [])

  const terminateSession = useCallback(async (sessionId: number) => {
    setLoading(true)
    setError(null)

    try {
      const result = await logoutManager.terminateSession(sessionId)
      
      if (!result.success) {
        setError(result.message)
      }
      
      return result
    } catch (err: any) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    logout,
    logoutAll,
    getSessions,
    terminateSession,
    loading,
    error
  }
}
