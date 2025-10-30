"use client"
import { User } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"

export function UserProfileMenu() {
  const user = getCurrentUser()

  return (
    <div className="w-full flex items-center gap-3 px-2 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground animate-pulse-slow">
        <User className="h-4 w-4" />
      </div>
      <div className="flex flex-1 flex-col text-sm min-w-0 text-left">
        <span className="font-medium text-sidebar-foreground truncate">{user?.name}</span>
        <span className="text-xs text-sidebar-foreground/70 capitalize truncate">{user?.role}</span>
      </div>
    </div>
  )
}
