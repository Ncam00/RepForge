import { getDevSession } from "@/lib/dev-auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { z } from "zod"

const weightSchema = z.object({
  weight: z.number().positive(),
  unit: z.enum(["kg", "lbs"]),
  bodyFat: z.number().min(0).max(100).optional(),
  muscleMass: z.number().positive().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await getDevSession()
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
    const session = await getDevSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = weightSchema.parse(body)

    // Normalize to start of day for comparison (using UTC)
    const entryDate = data.date ? new Date(data.date) : new Date()
    const startOfDay = new Date(Date.UTC(
      entryDate.getUTCFullYear(),
      entryDate.getUTCMonth(),
      entryDate.getUTCDate(),
      0, 0, 0, 0
    ))
    const endOfDay = new Date(Date.UTC(
      entryDate.getUTCFullYear(),
      entryDate.getUTCMonth(),
      entryDate.getUTCDate(),
      23, 59, 59, 999
    ))

    // Check if entry exists for this date
    const existingEntry = await prisma.weight.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    let weight
    if (existingEntry) {
      // Update existing entry
      weight = await prisma.weight.update({
        where: { id: existingEntry.id },
        data: {
          weight: data.weight,
          unit: data.unit,
          bodyFat: data.bodyFat,
          muscleMass: data.muscleMass,
          notes: data.notes,
          photoUrl: data.photoUrl,
        },
      })
    } else {
      // Create new entry with normalized date (midnight UTC)
      weight = await prisma.weight.create({
        data: {
          userId: session.user.id,
          weight: data.weight,
          unit: data.unit,
          bodyFat: data.bodyFat,
          muscleMass: data.muscleMass,
          date: startOfDay,
          notes: data.notes,
          photoUrl: data.photoUrl,
        },
      })
    }

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
    const session = await getDevSession()
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
