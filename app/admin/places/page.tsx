"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PlaceManagement } from "@/components/admin/place-management"
import { getCurrentUser, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Toaster } from 'react-hot-toast'
export default function PlacesPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser()
      if (!user || user.role !== "admin") {
        router.push("/")
      }
      
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await logout()
    // Note: The logout function already redirects to "/" via window.location.href
  }


  return (
    <DashboardLayout 
      title="Place Management" 
      subtitle="Manage meeting rooms and spaces"
      actions={
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      }
    >
      <Toaster />
      <PlaceManagement />
    </DashboardLayout>
  )
}