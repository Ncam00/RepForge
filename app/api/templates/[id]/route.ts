import { NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";

// GET - Fetch a single template
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only allow owner or public templates
    if (template.userId !== session.user.id && !template.isPublic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT - Update a template
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, category, difficulty, duration, isPublic, exercises } = body;

    // Verify ownership
    const existingTemplate = await prisma.workoutTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate || existingTemplate.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update template and exercises in a transaction
    const template = await prisma.$transaction(async (tx) => {
      // Delete existing exercises
      await tx.templateExercise.deleteMany({
        where: { templateId: id },
      });

      // Update template
      const updated = await tx.workoutTemplate.update({
        where: { id },
        data: {
          name,
          description,
          category,
          difficulty,
          duration,
          isPublic,
          exercises: exercises ? {
            create: exercises.map((ex: any, index: number) => ({
              exerciseId: ex.exerciseId,
              order: ex.order ?? index,
              sets: ex.sets,
              reps: ex.reps,
              restTime: ex.restTime,
              notes: ex.notes,
            })),
          } : undefined,
        },
        include: {
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: { order: "asc" },
          },
        },
      });

      return updated;
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const template = await prisma.workoutTemplate.findUnique({
      where: { id },
    });

    if (!template || template.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.workoutTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
