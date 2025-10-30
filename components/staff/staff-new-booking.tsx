"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

// This wrapper will inject the current user as responsible person
export function StaffNewBookingWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}


