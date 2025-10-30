/**
 * Logout Component - Complete logout functionality
 * Based on LOGOUT_IMPLEMENTATION_GUIDE.md
 */

import React, { useState } from 'react'
import { useLogout } from '@/lib/use-logout'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  LogOut, 
  Smartphone, 
  Trash2, 
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface LogoutComponentProps {
  children?: React.ReactNode
  variant?: 'button' | 'dropdown'
  showSessions?: boolean
}

export const LogoutComponent: React.FC<LogoutComponentProps> = ({ 
  children, 
  variant = 'button',
  showSessions = false 
}) => {
  const { logout, logoutAll, getSessions, terminateSession, loading, error } = useLogout()
  const [sessions, setSessions] = useState<any[]>([])
  const [showSessionsList, setShowSessionsList] = useState(false)

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      console.log('Logged out successfully')
    }
  }

  const handleLogoutAll = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to logout from ALL devices? ' +
      'This will end all your active sessions.'
    )
    
    if (confirmed) {
      const result = await logoutAll()
      if (result.success) {
        alert('Logged out from all devices successfully')
      }
    }
  }

  const handleViewSessions = async () => {
    const result = await getSessions()
    if (result.success) {
      setSessions(result.sessions)
      setShowSessionsList(true)
    }
  }

  const handleTerminateSession = async (sessionId: number) => {
    const confirmed = window.confirm('Are you sure you want to terminate this session?')
    
    if (confirmed) {
      const result = await terminateSession(sessionId)
      if (result.success) {
        alert('Session terminated successfully')
        // Refresh sessions list
        handleViewSessions()
      }
    }
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children || (
            <Button variant="ghost" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Logout
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleLogout} disabled={loading}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout Current Session</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleLogoutAll} disabled={loading}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Logout All Devices</span>
          </DropdownMenuItem>
          
          {showSessions && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewSessions} disabled={loading}>
                <Smartphone className="mr-2 h-4 w-4" />
                <span>View Active Sessions</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <Button 
          onClick={handleLogout}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Logout Current Session
        </Button>
        
        <Button 
          onClick={handleLogoutAll}
          disabled={loading}
          variant="outline"
          className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="mr-2 h-4 w-4" />
          )}
          Logout All Devices
        </Button>
        
        {showSessions && (
          <Button 
            onClick={handleViewSessions}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Smartphone className="mr-2 h-4 w-4" />
            )}
            View Active Sessions
          </Button>
        )}
      </div>

      {showSessionsList && sessions.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Session {session.id}</h4>
                    <p className="text-sm text-gray-600">IP: {session.ipAddress}</p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(session.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(session.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleTerminateSession(session.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
