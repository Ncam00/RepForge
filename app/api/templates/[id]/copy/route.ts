import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";
import { rateLimit, WRITE_RATE_LIMIT } from "@/lib/rate-limit";

/**
 * POST /api/templates/[id]/copy
 *
 * Copies a public template (or your own) into your collection.
 * The copy is always created as private (isPublic: false).
 *
 * Returns the newly created template.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit copies: 60/minute per user
    const rl = rateLimit(`template-copy:${session.user.id}`, WRITE_RATE_LIMIT);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const { id } = await params;

    // Fetch source template with its exercises
    const source = await prisma.workoutTemplate.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Only the owner or public templates can be copied
    if (source.userId !== session.user.id && !source.isPublic) {
      return NextResponse.json({ error: "Template is not public" }, { status: 403 });
    }

    // Prevent copying your own template to avoid duplicates silently
    // (still allowed — user may want a modified copy)

    // Build a unique name to avoid confusion
    const sourceName = source.name;
    const copyName = source.userId === session.user.id
      ? `${sourceName} (Copy)`
      : sourceName;

    const copy = await prisma.workoutTemplate.create({
      data: {
        userId: session.user.id,
        name: copyName,
        description: source.description,
        category: source.category,
        difficulty: source.difficulty,
        duration: source.duration,
        isPublic: false, // copies start as private
        exercises: {
          create: source.exercises.map((ex) => ({
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
            exercise: { select: { id: true, name: true, muscleGroups: true } },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(
      { template: copy, message: `Template "${copy.name}" added to your collection` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error copying template:", error);
    return NextResponse.json({ error: "Failed to copy template" }, { status: 500 });
  }
}
