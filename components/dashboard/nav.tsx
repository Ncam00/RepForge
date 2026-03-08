"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Settings, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import LevelBadge from "@/components/LevelBadge"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface DashboardNavProps {
  user: {
    name?: string | null
    email: string
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/weight", label: "Weight" },
    { href: "/dashboard/photos", label: "Photos" },
    { href: "/dashboard/splits", label: "Training" },
    { href: "/dashboard/templates", label: "Templates" },
    { href: "/dashboard/history", label: "History" },
    { href: "/dashboard/prs", label: "PRs" },
    { href: "/dashboard/calendar", label: "Calendar" },
    { href: "/dashboard/journal", label: "Journal" },
    { href: "/dashboard/analytics", label: "Analytics" },
    { href: "/dashboard/nutrition", label: "Nutrition" },
    { href: "/dashboard/social", label: "Social" },
    { href: "/dashboard/settings", label: "Settings" },
  ]

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-12 items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/dashboard" className="text-base font-bold shrink-0">
              Rep<span className="text-primary">Forge</span>
            </Link>
            <div className="flex gap-0.5">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LevelBadge />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <div className="text-xs hidden xl:block">
              <div className="font-medium leading-none">{user.name || "User"}</div>
              <div className="text-muted-foreground mt-0.5">{user.email}</div>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="icon" className="h-8 w-8" type="submit">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
