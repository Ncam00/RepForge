import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

// PATCH /api/exercises/[id]/favorite - Toggle favorite status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exerciseId = params.id;

    // Check if exercise exists and belongs to user or is public
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    if (exercise.userId !== session.user.id && !exercise.isPublic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Toggle favorite status
    const updated = await prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        isFavorite: !exercise.isFavorite,
      },
    });

    return NextResponse.json({
      exercise: {
        ...updated,
        muscleGroups: JSON.parse(updated.muscleGroups),
        variations: updated.variations ? JSON.parse(updated.variations) : null,
      },
    });
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
