import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const exerciseSchema = z.object({
  exerciseId: z.string(),
  order: z.number().int().min(0).optional(),
  targetSets: z.number().int().min(1).max(20).optional(),
  targetReps: z.string().optional(),
  restTime: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

// GET /api/splits/[id]/exercises - Get exercises for a split day
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const splitDayId = params.id;

    // Verify the split day belongs to the user
    const splitDay = await prisma.splitDay.findUnique({
      where: { id: splitDayId },
      include: {
        workoutSplit: true,
      },
    });

    if (!splitDay || splitDay.workoutSplit.userId !== user.id) {
      return NextResponse.json({ error: "Split day not found" }, { status: 404 });
    }

    const exercises = await prisma.splitDayExercise.findMany({
      where: { splitDayId },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            muscleGroups: true,
            equipment: true,
            difficulty: true,
            videoUrl: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Failed to fetch split day exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

// POST /api/splits/[id]/exercises - Add exercise to split day
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const splitDayId = params.id;

    // Verify the split day belongs to the user
    const splitDay = await prisma.splitDay.findUnique({
      where: { id: splitDayId },
      include: {
        workoutSplit: true,
      },
    });

    if (!splitDay || splitDay.workoutSplit.userId !== user.id) {
      return NextResponse.json({ error: "Split day not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = exerciseSchema.parse(body);

    // Get the current max order
    const maxOrder = await prisma.splitDayExercise.findFirst({
      where: { splitDayId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const exercise = await prisma.splitDayExercise.create({
      data: {
        splitDayId,
        exerciseId: validatedData.exerciseId,
        order: validatedData.order ?? (maxOrder?.order ?? 0) + 1,
        targetSets: validatedData.targetSets,
        targetReps: validatedData.targetReps,
        restTime: validatedData.restTime,
        notes: validatedData.notes,
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            muscleGroups: true,
            equipment: true,
            difficulty: true,
            videoUrl: true,
          },
        },
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Failed to add exercise to split day:", error);
    return NextResponse.json(
      { error: "Failed to add exercise" },
      { status: 500 }
    );
  }
}

// DELETE /api/splits/[id]/exercises - Remove exercise from split day
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exerciseId");

    if (!exerciseId) {
      return NextResponse.json(
        { error: "Exercise ID required" },
        { status: 400 }
      );
    }

    const splitDayId = params.id;

    // Verify the split day belongs to the user
    const splitDay = await prisma.splitDay.findUnique({
      where: { id: splitDayId },
      include: {
        workoutSplit: true,
      },
    });

    if (!splitDay || splitDay.workoutSplit.userId !== user.id) {
      return NextResponse.json({ error: "Split day not found" }, { status: 404 });
    }

    await prisma.splitDayExercise.deleteMany({
      where: {
        splitDayId,
        exerciseId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove exercise from split day:", error);
    return NextResponse.json(
      { error: "Failed to remove exercise" },
      { status: 500 }
    );
  }
}
