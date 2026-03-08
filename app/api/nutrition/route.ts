import { NextRequest, NextResponse } from "next/server"
import { getDevSession } from "@/lib/dev-auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { startOfDay, endOfDay } from "date-fns"

const entrySchema = z.object({
  date: z.string().datetime().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodName: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  servingSize: z.number().positive(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
})

// GET /api/nutrition?date=2026-02-27
export async function GET(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get("date")

  const date = dateParam ? new Date(dateParam) : new Date()
  const start = startOfDay(date)
  const end = endOfDay(date)

  const entries = await prisma.nutritionEntry.findMany({
    where: { userId, date: { gte: start, lte: end } },
    orderBy: [{ mealType: "asc" }, { createdAt: "asc" }],
  })

  // Aggregate totals
  const totals = entries.reduce(
    (acc: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number }, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      fiber: acc.fiber + (e.fiber ?? 0),
      sugar: acc.sugar + (e.sugar ?? 0),
      sodium: acc.sodium + (e.sodium ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  )

  return NextResponse.json({ entries, totals })
}

// POST /api/nutrition
export async function POST(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json()
  const parsed = entrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { date, ...data } = parsed.data

  const entry = await prisma.nutritionEntry.create({
    data: {
      ...data,
      userId,
      date: date ? new Date(date) : startOfDay(new Date()),
    },
  })

  return NextResponse.json({ entry }, { status: 201 })
}

// DELETE /api/nutrition?id=cuid
export async function DELETE(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const entry = await prisma.nutritionEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.nutritionEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
