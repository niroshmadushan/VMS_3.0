"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminOverview } from "@/components/admin/admin-overview"
import { RouteProtection } from "@/components/auth/route-protection"

export default function AdminDashboard() {
  return (
    <RouteProtection requiredRole="admin">
      <DashboardLayout title="Admin Dashboard" subtitle="SMART VISITOR Management System">
        <AdminOverview />
      </DashboardLayout>
    </RouteProtection>
  )
}
