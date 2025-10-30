"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AvailabilityChecker } from "@/components/admin/availability-checker"
import { RouteProtection } from "@/components/auth/route-protection"

export default function StaffAvailabilityPage() {
  return (
    <RouteProtection requiredRole="staff">
      <DashboardLayout title="Room Availability" subtitle="Check availability and book meeting rooms">
        <AvailabilityChecker />
      </DashboardLayout>
    </RouteProtection>
  )
}


