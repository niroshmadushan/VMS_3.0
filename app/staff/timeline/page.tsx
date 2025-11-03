"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TimelineView } from "@/components/admin/timeline-view"
import { RouteProtection } from "@/components/auth/route-protection"

export default function StaffTimelinePage() {
  return (
    <RouteProtection requiredRole="staff">
      <DashboardLayout title="Timeline View" subtitle="Real-time view of today's bookings">
        <TimelineView />
      </DashboardLayout>
    </RouteProtection>
  )
}



