"use client"

import { LoginForm } from "@/components/auth/login-form"
import { Building2 } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md mx-auto animate-scale-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">SMART VISITOR</h1>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
          <p className="text-muted-foreground">Sign in to access your dashboard</p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}











