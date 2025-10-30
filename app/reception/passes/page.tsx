"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionSidebar } from "@/components/reception/reception-sidebar"
import { PassManagement } from "@/components/reception/pass-management"
import { requireAuth } from "@/lib/auth"

export default function PassesPage() {
  useEffect(() => {
    requireAuth(["reception"])
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <ReceptionSidebar />
      <div className="flex-1">
        <DashboardLayout title="Pass Management" subtitle="Assign and track visitor passes">
          <PassManagement />
        </DashboardLayout>
      </div>
    </div>
  )
}
