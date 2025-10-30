"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PassHistoryManagement } from "@/components/admin/pass-history-management"

export default function PassHistoryPage() {
  return (
    <DashboardLayout title="Pass History" subtitle="View complete visitor pass usage history">
      <PassHistoryManagement />
    </DashboardLayout>
  )
}
