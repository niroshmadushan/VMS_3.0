"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-auto justify-center gap-2 px-3 py-2 h-auto">
        <div className="flex h-4 w-4 items-center justify-center">
          <Sun className="h-4 w-4" />
        </div>
        <span className="text-xs text-sidebar-foreground">Theme</span>
      </Button>
    )
  }

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-auto justify-center gap-2 px-3 py-2 h-auto hover:bg-sidebar-accent transition-all duration-200"
    >
      <div className="flex h-4 w-4 items-center justify-center">
        <Sun className={`h-4 w-4 transition-all duration-300 ${isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"}`} />
        <Moon
          className={`absolute h-4 w-4 transition-all duration-300 ${isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
        />
      </div>
      <span className="text-xs text-sidebar-foreground">{isDark ? "Dark" : "Light"}</span>
    </Button>
  )
}
