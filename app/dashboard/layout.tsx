import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/nav"
import { FloatingRestTimer } from "@/components/ui/rest-timer"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Temporarily disable auth for development
  const user = session?.user || {
    name: "Dev User",
    email: "dev@example.com",
    id: "dev-user-id"
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
      <FloatingRestTimer />
    </div>
  )
}
