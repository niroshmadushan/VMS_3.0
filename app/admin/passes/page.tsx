import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VisitorPassManagement } from "@/components/admin/visitor-pass-management"

export default function AdminPassesPage() {
  return (
    <DashboardLayout title="Today's Visitors & Pass Management" subtitle="View today's visitors and manage visitor pass assignments">
      <VisitorPassManagement />
    </DashboardLayout>
  )
}
