import type React from "react"
export default function TabletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">{children}</div>
}
