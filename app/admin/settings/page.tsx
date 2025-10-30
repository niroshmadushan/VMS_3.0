"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSettings } from "@/components/admin/admin-settings"
import { Toaster } from "@/components/ui/toaster"
import { requireAuth } from "@/lib/auth"

export default function AdminSettingsPage() {
  useEffect(() => {
    requireAuth(["admin"])
  }, [])

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your profile, security, and preferences"
    >
      <Toaster />
      <AdminSettings />
    </DashboardLayout>
  )
}
