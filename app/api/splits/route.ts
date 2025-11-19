import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { z } from "zod"

const splitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  days: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    name: z.string().min(1),
    description: z.string().optional(),
    order: z.number().optional(),
  })).optional(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const splits = await prisma.workoutSplit.findMany({
      where: { userId: session.user.id },
      include: {
        days: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ splits })
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
    const data = splitSchema.parse(body)

    // If this split is set to active, deactivate others
    if (data.isActive) {
      await prisma.workoutSplit.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
      })
    }

    const split = await prisma.workoutSplit.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? false,
        days: data.days ? {
          create: data.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            description: day.description,
            order: day.order ?? 0,
          })),
        } : undefined,
      },
      include: {
        days: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({ split }, { status: 201 })
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

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Split ID required" },
        { status: 400 }
      )
    }

    const split = await prisma.workoutSplit.findUnique({
      where: { id },
    })

    if (!split || split.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Split not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = splitSchema.partial().parse(body)

    // If setting this split to active, deactivate others
    if (data.isActive) {
      await prisma.workoutSplit.updateMany({
        where: { userId: session.user.id, isActive: true, id: { not: id } },
        data: { isActive: false },
      })
    }

    const updatedSplit = await prisma.workoutSplit.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
      include: {
        days: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({ split: updatedSplit })
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
        { error: "Split ID required" },
        { status: 400 }
      )
    }

    const split = await prisma.workoutSplit.findUnique({
      where: { id },
    })

    if (!split || split.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Split not found" },
        { status: 404 }
      )
    }

    await prisma.workoutSplit.delete({
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
