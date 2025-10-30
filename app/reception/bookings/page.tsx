"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionSidebar } from "@/components/reception/reception-sidebar"
import { ReceptionBookings } from "@/components/reception/reception-bookings"
import { requireAuth } from "@/lib/auth"

export default function ReceptionBookingsPage() {
  useEffect(() => {
    requireAuth(["reception"])
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <ReceptionSidebar />
      <div className="flex-1">
        <DashboardLayout title="Booking Management" subtitle="Create and manage meeting bookings">
          <ReceptionBookings />
        </DashboardLayout>
      </div>
    </div>
  )
}
