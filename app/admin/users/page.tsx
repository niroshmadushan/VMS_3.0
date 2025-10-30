"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserManagement } from "@/components/admin/user-management"
import { Toaster } from "@/components/ui/toaster"
import { requireAuth } from "@/lib/auth"

export default function UsersPage() {
  useEffect(() => {
    requireAuth(["admin"])
  }, [])

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Comprehensive user administration with statistics and analytics"
    >
      <Toaster />
      <UserManagement />
    </DashboardLayout>
  )
}