"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { logoutManager } from "@/lib/logout-manager"
import { useEffect, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { RoleBasedNavigation } from "./role-based-navigation"
import { BrandLogo } from "@/components/ui/brand-logo"
import { PageTransition } from "@/components/ui/page-transition"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { UserProfileMenu } from "@/components/ui/user-profile-menu"

interface AppLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('AppLayout - User data:', user)
    console.log('AppLayout - Is authenticated:', isAuthenticated)
    console.log('AppLayout - Is loading:', isLoading)
    console.log('AppLayout - Current path:', pathname)
  }, [user, isAuthenticated, isLoading, pathname])

  // Handle logout with proper cleanup using LogoutManager
  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...')
      
      // Use LogoutManager for complete logout process
      const result = await logoutManager.logoutCurrentSession()
      
      if (result.success) {
        console.log('✅ Logout successful')
      } else {
        console.error('❌ Logout failed:', result.message)
        // Even if logout fails, LogoutManager handles cleanup and redirect
      }
      
    } catch (error) {
      console.error('❌ Logout error:', error)
      
      // Fallback: clear storage and redirect manually
      logoutManager.clearLocalStorage()
      logoutManager.redirectToLogin()
    }
  }

  // Get user role safely
  const getUserRole = (): string | undefined => {
    return user?.role
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar variant="inset">
          <SidebarHeader className="border-b border-sidebar-border bg-gradient-to-r from-sidebar via-sidebar to-sidebar/95">
            <div className="px-2 py-3">
              <BrandLogo size="md" animated />
              <div className="mt-2 text-xs text-sidebar-foreground/70 capitalize">
                {isClient && user?.role ? `${user.role} Portal` : "SMART VISITOR Portal"}
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                {isClient && !isLoading && user && user.role && <RoleBasedNavigation userRole={user.role} currentPath={pathname} />}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border bg-gradient-to-r from-sidebar/50 to-sidebar">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center justify-between px-2 py-2">
                  <span className="text-xs text-sidebar-foreground/70 font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </SidebarMenuItem>
              {isClient && !isLoading && user && (
                <SidebarMenuItem>
                  <UserProfileMenu />
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-12 items-center gap-4 px-6">
              <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent" />
              <div className="flex flex-1 items-center justify-between min-w-0">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
                  {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
                </div>

                <div className="flex items-center gap-2 text-sm md:hidden">
                  <User className="h-4 w-4" />
                  <span className="font-medium truncate max-w-24">
                    {isClient && !isLoading ? (user?.firstName || user?.email || "User") : "Loading..."}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
            <div className="p-2">
              {error && (
                <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded mb-4">
                  {error}
                </div>
              )}
              {isLoading ? (
                <div className="text-center text-muted-foreground">Loading user data...</div>
              ) : (
                <PageTransition>
                  <div>{children}</div>
                </PageTransition>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}