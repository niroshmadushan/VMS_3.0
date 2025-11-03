"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminOverview } from "@/components/staff/admin-overview"
import { RouteProtection } from "@/components/auth/route-protection"

export default function StaffDashboard() {
  return (
    <RouteProtection requiredRole="staff">
      <DashboardLayout title="Staff Dashboard" subtitle="SMART VISITOR Management System - Full Admin Access">
        <AdminOverview />
      </DashboardLayout>
    </RouteProtection>
  )
}



