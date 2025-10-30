"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookingManagement } from "@/components/admin/booking-management"
import { requireAuth } from "@/lib/auth"

export default function BookingsPage() {
  useEffect(() => {
    requireAuth(["admin"])
  }, [])

  return (
    <DashboardLayout title="Booking Management" subtitle="Manage meetings and reservations">
      <BookingManagement />
    </DashboardLayout>
  )
}
