"use client"

import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
  animated?: boolean
}

export function BrandLogo({ size = "md", showText = true, className, animated = false }: BrandLogoProps) {
  const sizeConfig = {
    sm: { icon: "h-4 w-4", container: "h-6 w-6", text: "text-sm" },
    md: { icon: "h-6 w-6", container: "h-10 w-10", text: "text-lg" },
    lg: { icon: "h-8 w-8", container: "h-12 w-12", text: "text-xl" },
    xl: { icon: "h-10 w-10", container: "h-16 w-16", text: "text-2xl" },
  }

  const config = sizeConfig[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg",
          config.container,
          animated && "animate-pulse-slow hover-glow",
        )}
      >
        <Building2 className={cn(config.icon, animated && "animate-bounce-gentle")} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold text-foreground", config.text)}>SMART VISITOR</span>
          {size !== "sm" && <span className="text-xs text-primary font-medium">Management System</span>}
        </div>
      )}
    </div>
  )
}
