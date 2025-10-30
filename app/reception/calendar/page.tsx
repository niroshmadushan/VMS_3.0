"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SharedCalendar } from "@/components/shared/shared-calendar"

export default function ReceptionCalendarPage() {
  return (
    <DashboardLayout title="Calendar" subtitle="View bookings and visitor schedules">
      <SharedCalendar role="reception" />
    </DashboardLayout>
  )
}
