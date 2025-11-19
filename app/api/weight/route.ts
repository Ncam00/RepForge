import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { z } from "zod"

const weightSchema = z.object({
  weight: z.number().positive(),
  unit: z.enum(["kg", "lbs"]),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const weights = await prisma.weight.findMany({
      where: {
        userId: session.user.id,
        ...(startDate && endDate
          ? {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
      take: 100,
    })

    return NextResponse.json({ weights })
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
    const data = weightSchema.parse(body)

    const weight = await prisma.weight.create({
      data: {
        userId: session.user.id,
        weight: data.weight,
        unit: data.unit,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
      },
    })

    return NextResponse.json({ weight }, { status: 201 })
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

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Weight ID required" },
        { status: 400 }
      )
    }

    const weight = await prisma.weight.findUnique({
      where: { id },
    })

    if (!weight || weight.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Weight not found" },
        { status: 404 }
      )
    }

    await prisma.weight.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
