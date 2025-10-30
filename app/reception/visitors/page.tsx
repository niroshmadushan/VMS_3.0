"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionSidebar } from "@/components/reception/reception-sidebar"
import { VisitorCheckIn } from "@/components/reception/visitor-check-in"
import { requireAuth } from "@/lib/auth"

export default function VisitorsPage() {
  useEffect(() => {
    requireAuth(["reception"])
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <ReceptionSidebar />
      <div className="flex-1">
        <DashboardLayout title="Visitor Check-in" subtitle="Manage visitor arrivals and confirmations">
          <VisitorCheckIn />
        </DashboardLayout>
      </div>
    </div>
  )
}
