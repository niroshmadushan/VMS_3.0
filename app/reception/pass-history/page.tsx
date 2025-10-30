"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionSidebar } from "@/components/reception/reception-sidebar"
import { PassHistoryManagement } from "@/components/admin/pass-history-management"

export default function ReceptionPassHistoryPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <ReceptionSidebar />
      <div className="flex-1">
        <DashboardLayout title="Pass History" subtitle="View visitor pass usage and returns">
          <PassHistoryManagement />
        </DashboardLayout>
      </div>
    </div>
  )
}
