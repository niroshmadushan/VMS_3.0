import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FeedbackManagement } from "@/components/admin/feedback-management"

export default function AdminFeedbackPage() {
  return (
    <DashboardLayout title="Feedback Management" subtitle="View and manage visitor feedback">
      <FeedbackManagement />
    </DashboardLayout>
  )
}
