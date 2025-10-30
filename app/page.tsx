"use client"

import { LoginForm } from "@/components/auth/login-form"
import { Building2, Shield, Users, Clock, UserCheck, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and Features */}
        <div className="hidden lg:block space-y-8 animate-slide-up">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">SMART VISITOR</h1>
                <p className="text-lg text-primary font-medium">Premium Management System</p>
              </div>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Experience the future of visitor management with our intelligent, secure, and user-friendly platform.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced security protocols with role-based access control
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Multi-Role Support</h3>
                <p className="text-sm text-muted-foreground">
                  Tailored interfaces for admins, reception, and employees
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Real-time Tracking</h3>
                <p className="text-sm text-muted-foreground">Live visitor status updates and comprehensive reporting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 animate-scale-in">
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">SMART VISITOR</h1>
            </div>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          <div className="hidden lg:block text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
