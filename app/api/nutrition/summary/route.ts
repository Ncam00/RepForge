import { NextRequest, NextResponse } from "next/server"
import { getDevSession } from "@/lib/dev-auth"
import prisma from "@/lib/db"
import { startOfDay, subDays, eachDayOfInterval, format } from "date-fns"

// GET /api/nutrition/summary?days=7
export async function GET(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 90)

  const start = startOfDay(subDays(new Date(), days - 1))
  const end = new Date()

  const entries = await prisma.nutritionEntry.findMany({
    where: { userId: session.user.id, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  })

  // Group by date
  const byDate: Record<string, { calories: number; protein: number; carbs: number; fat: number; entries: number }> = {}

  const interval = eachDayOfInterval({ start, end })
  for (const d of interval) {
    byDate[format(d, "yyyy-MM-dd")] = { calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 }
  }

  for (const e of entries) {
    const key = format(e.date, "yyyy-MM-dd")
    if (byDate[key]) {
      byDate[key].calories += e.calories
      byDate[key].protein += e.protein
      byDate[key].carbs += e.carbs
      byDate[key].fat += e.fat
      byDate[key].entries++
    }
  }

  const trend = Object.entries(byDate).map(([date, v]) => ({ date, ...v }))

  // Averages (days with at least 1 entry)
  const loggedDays = trend.filter((d) => d.entries > 0)
  const avg = loggedDays.length
    ? {
        calories: Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length),
        protein: Math.round(loggedDays.reduce((s, d) => s + d.protein, 0) / loggedDays.length),
        carbs: Math.round(loggedDays.reduce((s, d) => s + d.carbs, 0) / loggedDays.length),
        fat: Math.round(loggedDays.reduce((s, d) => s + d.fat, 0) / loggedDays.length),
      }
    : null

  return NextResponse.json({ trend, averages: avg, loggedDays: loggedDays.length, totalDays: days })
}
