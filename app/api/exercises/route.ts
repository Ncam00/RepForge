import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { z } from "zod"

const exerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  videoUrl: z.string().url().optional(),
  muscleGroups: z.array(z.string()),
  equipment: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  instructions: z.string().optional(),
  tips: z.string().optional(),
  isPublic: z.boolean().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const muscleGroup = searchParams.get("muscleGroup")
    const difficulty = searchParams.get("difficulty")
    const search = searchParams.get("search")

    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isPublic: true },
        ],
        ...(muscleGroup ? {
          muscleGroups: {
            contains: muscleGroup,
          },
        } : {}),
        ...(difficulty ? {
          difficulty,
        } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: { name: "asc" },
    })

    const formattedExercises = exercises.map((ex) => ({
      ...ex,
      muscleGroups: JSON.parse(ex.muscleGroups),
    }))

    return NextResponse.json({ exercises: formattedExercises })
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
    const data = exerciseSchema.parse(body)

    const exercise = await prisma.exercise.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description,
        videoUrl: data.videoUrl,
        muscleGroups: JSON.stringify(data.muscleGroups),
        equipment: data.equipment,
        difficulty: data.difficulty,
        instructions: data.instructions,
        tips: data.tips,
        isPublic: data.isPublic ?? false,
      },
    })

    return NextResponse.json({
      exercise: {
        ...exercise,
        muscleGroups: JSON.parse(exercise.muscleGroups),
      },
    }, { status: 201 })
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
        { error: "Exercise ID required" },
        { status: 400 }
      )
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    })

    if (!exercise || exercise.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = exerciseSchema.partial().parse(body)

    const updatedExercise = await prisma.exercise.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        videoUrl: data.videoUrl,
        muscleGroups: data.muscleGroups ? JSON.stringify(data.muscleGroups) : undefined,
        equipment: data.equipment,
        difficulty: data.difficulty,
        instructions: data.instructions,
        tips: data.tips,
        isPublic: data.isPublic,
      },
    })

    return NextResponse.json({
      exercise: {
        ...updatedExercise,
        muscleGroups: JSON.parse(updatedExercise.muscleGroups),
      },
    })
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
        { error: "Exercise ID required" },
        { status: 400 }
      )
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    })

    if (!exercise || exercise.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    await prisma.exercise.delete({
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
