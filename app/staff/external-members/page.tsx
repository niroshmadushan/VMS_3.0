"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StaffExternalMembersView } from "@/components/staff/external-members-view"
import { RouteProtection } from "@/components/auth/route-protection"

export default function StaffExternalMembersPage() {
  return (
    <RouteProtection requiredRole="staff">
      <DashboardLayout title="External Members" subtitle="View members and add new visitors (View Only)">
        <StaffExternalMembersView />
      </DashboardLayout>
    </RouteProtection>
  )
}

