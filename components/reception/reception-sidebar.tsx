"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  UserCheck,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Clock,
  Coffee,
  CalendarDays,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/reception",
    icon: LayoutDashboard,
  },
  {
    name: "Visitor Check-in",
    href: "/reception/visitors",
    icon: UserCheck,
  },
  {
    name: "Pass Management",
    href: "/reception/passes",
    icon: CreditCard,
  },
  {
    name: "Pass History",
    href: "/reception/pass-history",
    icon: History,
  },
  {
    name: "Bookings",
    href: "/reception/bookings",
    icon: Calendar,
  },
  {
    name: "Calendar View",
    href: "/reception/calendar",
    icon: CalendarDays,
  },
  {
    name: "Availability",
    href: "/reception/availability",
    icon: Clock,
  },
  {
    name: "Refreshments",
    href: "/reception/refreshments",
    icon: Coffee,
  },
]

export function ReceptionSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && <h2 className="text-lg font-semibold text-sidebar-foreground">VMS Reception</h2>}
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
    </div>
  )
}
