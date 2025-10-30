"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StaffBookingManagement } from "@/components/staff/staff-booking-management"
import { RouteProtection } from "@/components/auth/route-protection"

export default function StaffBookingsPage() {
  return (
    <RouteProtection requiredRole="staff">
      <DashboardLayout title="Booking Management" subtitle="View all bookings, today's bookings, and your bookings">
        <StaffBookingManagement />
      </DashboardLayout>
    </RouteProtection>
  )
}

