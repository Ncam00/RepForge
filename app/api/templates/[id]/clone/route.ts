import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Get the template to clone
    const template = await prisma.workoutTemplate.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Check access
    if (template.userId !== session.user.id && !template.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create a copy
    const cloned = await prisma.workoutTemplate.create({
      data: {
        userId: session.user.id,
        name: `${template.name} (Copy)`,
        description: template.description,
        isPublic: false, // Clones are private by default
        category: template.category,
        difficulty: template.difficulty,
        duration: template.duration,
        exercises: {
          create: template.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            sets: ex.sets,
            reps: ex.reps,
            restTime: ex.restTime,
            notes: ex.notes,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return NextResponse.json({ template: cloned }, { status: 201 });
  } catch (error) {
    console.error("Error cloning template:", error);
    return NextResponse.json(
      { error: "Failed to clone template" },
      { status: 500 }
    );
  }
}
