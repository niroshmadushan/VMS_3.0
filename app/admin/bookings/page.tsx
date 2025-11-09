"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookingManagement } from "@/components/admin/booking-management"
import { RouteProtection } from "@/components/auth/route-protection"

export default function BookingsPage() {
  return (
    <RouteProtection requiredRole="admin">
      <DashboardLayout title="Booking Management" subtitle="Manage meetings and reservations">
        <BookingManagement />
      </DashboardLayout>
    </RouteProtection>
  )
}
