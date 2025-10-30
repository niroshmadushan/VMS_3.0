"use client"

import { RouteProtection } from "@/components/auth/route-protection"
import SmartAssistantPage from "@/app/smart-assistant/page"

export default function AssistantDashboard() {
  return (
    <RouteProtection requiredRole="assistant">
      <SmartAssistantPage />
    </RouteProtection>
  )
}


