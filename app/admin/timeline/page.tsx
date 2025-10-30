"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { TimelineView } from "@/components/admin/timeline-view"

export default function TimelinePage() {
  return (
    <AppLayout title="Timeline View" subtitle="Real-time view of today's bookings">
      <TimelineView />
    </AppLayout>
  )
}


