import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  order: z.number().int().min(0).optional(),
  targetSets: z.number().int().min(1).max(20).optional(),
  targetReps: z.string().optional(),
  restTime: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

// PATCH /api/splits/exercises/[id] - Update exercise in split day
export async function PATCH(
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

    const splitDayExerciseId = params.id;

    // Verify the split day exercise belongs to the user
    const splitDayExercise = await prisma.splitDayExercise.findUnique({
      where: { id: splitDayExerciseId },
      include: {
        splitDay: {
          include: {
            workoutSplit: true,
          },
        },
      },
    });

    if (
      !splitDayExercise ||
      splitDayExercise.splitDay.workoutSplit.userId !== user.id
    ) {
      return NextResponse.json(
        { error: "Split day exercise not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const updated = await prisma.splitDayExercise.update({
      where: { id: splitDayExerciseId },
      data: validatedData,
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

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Failed to update split day exercise:", error);
    return NextResponse.json(
      { error: "Failed to update exercise" },
      { status: 500 }
    );
  }
}

// DELETE /api/splits/exercises/[id] - Delete specific split day exercise
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

    const splitDayExerciseId = params.id;

    // Verify the split day exercise belongs to the user
    const splitDayExercise = await prisma.splitDayExercise.findUnique({
      where: { id: splitDayExerciseId },
      include: {
        splitDay: {
          include: {
            workoutSplit: true,
          },
        },
      },
    });

    if (
      !splitDayExercise ||
      splitDayExercise.splitDay.workoutSplit.userId !== user.id
    ) {
      return NextResponse.json(
        { error: "Split day exercise not found" },
        { status: 404 }
      );
    }

    await prisma.splitDayExercise.delete({
      where: { id: splitDayExerciseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete split day exercise:", error);
    return NextResponse.json(
      { error: "Failed to delete exercise" },
      { status: 500 }
    );
  }
}
