"use client"

import { AvailabilityChecker } from "@/components/admin/availability-checker"
import { AppLayout } from "@/components/layout/app-layout"

export default function AvailabilityPage() {
  return (
    <AppLayout title="Availability Checker" subtitle="Check place availability before booking">
      <AvailabilityChecker />
    </AppLayout>
  )
}
