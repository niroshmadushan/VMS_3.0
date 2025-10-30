"use client"

import { ReceptionSidebar } from "@/components/reception/reception-sidebar"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RefreshmentManagement } from "@/components/reception/refreshment-management"

export default function ReceptionRefreshmentsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <ReceptionSidebar />
      <div className="flex-1">
        <DashboardLayout title="Refreshment Management" subtitle="Manage and track refreshments for meetings">
          <RefreshmentManagement />
        </DashboardLayout>
      </div>
    </div>
  )
}
