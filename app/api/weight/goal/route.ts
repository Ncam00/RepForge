import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { z } from "zod"

const goalSchema = z.object({
  targetWeight: z.number().positive(),
  unit: z.enum(["kg", "lbs"]),
  targetDate: z.string().datetime().optional(),
  startWeight: z.number().positive(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const goal = await prisma.weightGoal.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ goal })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = goalSchema.parse(body)

    const goal = await prisma.weightGoal.upsert({
      where: { userId: session.user.id },
      update: {
        targetWeight: data.targetWeight,
        unit: data.unit,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        startWeight: data.startWeight,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        targetWeight: data.targetWeight,
        unit: data.unit,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        startWeight: data.startWeight,
        isActive: true,
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.weightGoal.delete({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
