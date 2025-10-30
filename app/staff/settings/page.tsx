"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSettings } from "@/components/admin/admin-settings"
import { Toaster } from "@/components/ui/toaster"
import { RouteProtection } from "@/components/auth/route-protection"

export default function StaffSettingsPage() {
  return (
    <RouteProtection requiredRole="staff">
      <DashboardLayout
        title="Settings"
        subtitle="Manage your profile, security, and preferences"
      >
        <Toaster />
        <AdminSettings />
      </DashboardLayout>
    </RouteProtection>
  )
}


