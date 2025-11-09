"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserManagement } from "@/components/admin/user-management"
import { Toaster } from "@/components/ui/toaster"
import { RouteProtection } from "@/components/auth/route-protection"

export default function UsersPage() {
  return (
    <RouteProtection requiredRole="admin">
      <DashboardLayout
        title="User Management"
        subtitle="Comprehensive user administration with statistics and analytics"
      >
        <Toaster />
        <UserManagement />
      </DashboardLayout>
    </RouteProtection>
  )
}