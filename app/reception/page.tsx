"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionOverview } from "@/components/reception/reception-overview"
import { RouteProtection } from "@/components/auth/route-protection"

export default function ReceptionDashboard() {
  return (
    <RouteProtection requiredRole="reception">
      <DashboardLayout title="Reception Dashboard" subtitle="Visitor Management & Check-in">
        <ReceptionOverview />
      </DashboardLayout>
    </RouteProtection>
  )
}
