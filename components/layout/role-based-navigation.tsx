"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  MapPin,
  Users,
  Calendar,
  CreditCard,
  UserCheck,
  MessageSquare,
  Settings,
  History,
  Clock,
  CalendarDays,
  UserPlus,
  Coffee,
  BarChart3,
  FileText,
} from "lucide-react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

const navigationConfig = {
  admin: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: Calendar },
    { name: "Create New Booking", href: "/admin/bookings/new", icon: UserPlus },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Place Management", href: "/admin/places", icon: MapPin },
    { name: "Visitor Passes", href: "/admin/passes", icon: CreditCard },
    { name: "External Members", href: "/admin/external-members", icon: UserCheck },
    { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
    { name: "Pass History", href: "/admin/pass-history", icon: History },
    { name: "Pass Types", href: "/admin/pass-types", icon: FileText },
    { name: "Availability", href: "/admin/availability", icon: Clock },
    { name: "Calendar", href: "/admin/calendar", icon: CalendarDays },
    { name: "Timeline", href: "/admin/timeline", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ],
  staff: [
    { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
    { name: "Bookings", href: "/staff/bookings", icon: Calendar },
    { name: "Create New Booking", href: "/staff/bookings/new", icon: UserPlus },
    { name: "Timeline", href: "/staff/timeline", icon: BarChart3 },
    { name: "Availability", href: "/staff/availability", icon: Clock },
    { name: "External Members", href: "/staff/external-members", icon: UserCheck },
    { name: "Feedback", href: "/staff/feedback", icon: MessageSquare },
    { name: "Settings", href: "/staff/settings", icon: Settings },
  ],
  assistant: [
    { name: "Mark Attendance", href: "/assistant", icon: UserCheck },
  ],
  reception: [
    { name: "Dashboard", href: "/reception", icon: LayoutDashboard },
    { name: "Visitor Check-in", href: "/reception/visitors", icon: UserCheck },
    { name: "Pass Management", href: "/reception/passes", icon: CreditCard },
    { name: "Pass History", href: "/reception/pass-history", icon: History },
    { name: "Bookings", href: "/reception/bookings", icon: Calendar },
    { name: "Calendar", href: "/reception/calendar", icon: CalendarDays },
    { name: "Availability", href: "/reception/availability", icon: Clock },
    { name: "Refreshments", href: "/reception/refreshments", icon: Coffee },
  ],
}

interface RoleBasedNavigationProps {
  userRole?: string
  currentPath: string
}

export function RoleBasedNavigation({ userRole, currentPath }: RoleBasedNavigationProps) {
  console.log('RoleBasedNavigation - userRole:', userRole, 'currentPath:', currentPath)
  console.log('Available roles in config:', Object.keys(navigationConfig))
  
  const navigation = userRole ? (navigationConfig[userRole as keyof typeof navigationConfig] || []) : []
  
  console.log('Available navigation items:', navigation.length)
  console.log('Navigation items for role:', userRole, navigation.map(item => item.name))

  if (navigation.length === 0) {
    console.warn('No navigation items found for role:', userRole)
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="p-2 text-sm text-muted-foreground">
            No navigation available for role: {userRole || 'unknown'}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {navigation.map((item) => {
        const isActive = currentPath === item.href
        return (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.name}
              className="transition-all duration-200 hover:scale-[1.02] hover-lift group"
            >
              <Link href={item.href} className="flex items-center gap-3 w-full">
                <item.icon className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
