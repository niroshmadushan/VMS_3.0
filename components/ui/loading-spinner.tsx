"use client"

import { cn } from "@/lib/utils"
import { Building2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showLogo?: boolean
}

export function LoadingSpinner({ size = "md", className, showLogo = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  if (showLogo) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground animate-pulse">
            <Building2 className="h-8 w-8" />
          </div>
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent opacity-75 animate-spin"
            style={{ animationDuration: "3s" }}
          />
          <div className="absolute inset-1 rounded-lg bg-background" />
          <div className="absolute inset-0 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-8 w-8" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground animate-pulse">SMART VISITOR</p>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("animate-spin", sizeClasses[size], className)}>
      <div className="h-full w-full rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
