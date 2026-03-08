"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, TrendingUp, Library, History, LogOut, Settings, BookTemplate, BarChart3, Calendar, BookOpen, Users, Camera, Trophy, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import LevelBadge from "@/components/LevelBadge"
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
    { href: "/dashboard/photos", label: "Photos", icon: Camera },
    { href: "/dashboard/splits", label: "Training", icon: Library },
    { href: "/dashboard/templates", label: "Templates", icon: BookTemplate },
    { href: "/dashboard/history", label: "History", icon: History },
    { href: "/dashboard/prs", label: "PRs", icon: Trophy },
    { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/journal", label: "Journal", icon: BookOpen },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/nutrition", label: "Nutrition", icon: Utensils },
    { href: "/dashboard/social", label: "Social", icon: Users },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-12 items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/dashboard" className="text-base font-bold shrink-0">
              Rep<span className="text-primary">Forge</span>
            </Link>
            <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0",
                      pathname === link.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LevelBadge />
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
