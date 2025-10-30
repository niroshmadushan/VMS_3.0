"use client"

import { ReceptionSidebar } from "@/components/reception/reception-sidebar"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AvailabilityChecker } from "@/components/shared/availability-checker"

export default function ReceptionAvailabilityPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <ReceptionSidebar />
      <div className="flex-1">
        <DashboardLayout title="Availability Checker" subtitle="Help visitors find available meeting times and rooms">
          <AvailabilityChecker role="reception" />
        </DashboardLayout>
      </div>
    </div>
  )
}
