import { NextRequest, NextResponse } from "next/server"
import { getDevSession } from "@/lib/dev-auth"
import prisma from "@/lib/db"
import { z } from "zod"

const goalSchema = z.object({
  calories: z.number().positive(),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
})

// GET /api/nutrition/goals
export async function GET() {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const goal = await prisma.nutritionGoal.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json({ goal })
}

// POST /api/nutrition/goals  (upsert)
export async function POST(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = goalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const goal = await prisma.nutritionGoal.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data },
  })

  return NextResponse.json({ goal })
}
