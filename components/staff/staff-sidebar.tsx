"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  LayoutDashboard,
  MapPin,
  Users,
  Calendar,
  CreditCard,
  UserCheck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Settings,
  History,
  Clock,
  CalendarDays,
  FileText,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  User,
  AlertTriangle,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/staff",
    icon: LayoutDashboard,
  },
  {
    name: "Bookings",
    href: "/staff/bookings",
    icon: Calendar,
  },
  {
    name: "Timeline",
    href: "/staff/timeline",
    icon: BarChart3,
  },
  {
    name: "Availability",
    href: "/staff/availability",
    icon: Clock,
  },
  {
    name: "External Members",
    href: "/staff/external-members",
    icon: UserCheck,
  },
  {
    name: "Feedback",
    href: "/staff/feedback",
    icon: MessageSquare,
  },
  {
    name: "Settings",
    href: "/staff/settings",
    icon: Settings,
  },
  {
    name: "Doc",
    href: "/staff/documentation",
    icon: FileText,
  },
]

export function StaffSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark')
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = () => {
    setShowLogoutDialog(false)
    handleLogout()
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)

    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && <h2 className="text-lg font-semibold text-sidebar-foreground">VMS Staff</h2>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
                  collapsed && "px-2",
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Account Section */}
      <div className="p-4 border-t border-sidebar-border">
        {collapsed ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-sidebar-foreground hover:bg-sidebar-accent justify-center"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogoutClick}
              className="text-sidebar-foreground hover:bg-sidebar-accent justify-center"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
              <div className="p-2 bg-sidebar-primary rounded-full">
                <User className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || user?.full_name || 'Staff User'}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {user?.email || 'staff@example.com'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {theme === 'light' ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
                {theme === 'light' ? 'Dark' : 'Light'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogoutClick}
                className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="dark:bg-card dark:border-border">
          <DialogHeader className="dark:border-border/50">
            <DialogTitle className="flex items-center gap-2 dark:text-foreground">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="dark:text-muted-foreground">
              Are you sure you want to logout? You will need to login again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="dark:border-border/50">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="dark:border-border dark:text-foreground dark:hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLogout}
              className="dark:bg-red-600 dark:hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

