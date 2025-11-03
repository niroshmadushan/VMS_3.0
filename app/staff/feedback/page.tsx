"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FeedbackManagement } from "@/components/admin/feedback-management"
import { RouteProtection } from "@/components/auth/route-protection"

export default function StaffFeedbackPage() {
  return (
    <RouteProtection requiredRole="staff">
      <DashboardLayout title="Feedback Management" subtitle="View and manage visitor feedback">
        <FeedbackManagement />
      </DashboardLayout>
    </RouteProtection>
  )
}



