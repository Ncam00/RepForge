"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, TrendingUp, Library, History, LogOut, Settings, BookTemplate, BarChart3, Calendar, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardNavProps {
  user: {
    name?: string | null
    email: string
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Overview", icon: Dumbbell },
    { href: "/dashboard/weight", label: "Weight", icon: TrendingUp },
    { href: "/dashboard/splits", label: "Splits", icon: Library },
    { href: "/dashboard/exercises", label: "Exercises", icon: Dumbbell },
    { href: "/dashboard/templates", label: "Templates", icon: BookTemplate },
    { href: "/dashboard/history", label: "History", icon: History },
    { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/journal", label: "Journal", icon: BookOpen },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Rep<span className="text-primary">Forge</span>
            </Link>
            <div className="flex gap-1">
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <div className="font-medium">{user.name || "User"}</div>
              <div className="text-muted-foreground">{user.email}</div>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
