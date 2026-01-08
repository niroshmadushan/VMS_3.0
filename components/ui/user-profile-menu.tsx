"use client"
import { User } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"

export function UserProfileMenu() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email || 'User'

  return (
    <div className="w-full flex items-center gap-3 px-2 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground animate-pulse-slow">
        <User className="h-4 w-4" />
      </div>
      <div className="flex flex-1 flex-col text-sm min-w-0 text-left">
        <span className="font-medium text-sidebar-foreground truncate">{displayName}</span>
        {user?.email && (
          <span className="text-xs text-sidebar-foreground/70 truncate">
            {user.email} • {user?.role || 'user'}
          </span>
        )}
      </div>
    </div>
  )
}
