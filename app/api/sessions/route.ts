import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const sessionSchema = z.object({
  name: z.string().optional(),
  splitDayId: z.string().optional(),
  mood: z.string().optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
});

const completeSessionSchema = z.object({
  notes: z.string().optional(),
  mood: z.string().optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
});

// GET /api/sessions - Get all workout sessions
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");

    const sessions = await prisma.workoutSession.findMany({
      where: { userId: session.user.id },
      include: {
        sets: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                muscleGroups: true,
              },
            },
          },
          orderBy: { completedAt: "asc" },
        },
      },
      orderBy: { startedAt: "desc" },
      take: limit ? parseInt(limit) : undefined,
    });

    const formatted = sessions.map((s) => ({
      ...s,
      sets: s.sets.map((set) => ({
        ...set,
        exercise: {
          ...set.exercise,
          muscleGroups: JSON.parse(set.exercise.muscleGroups),
        },
      })),
    }));

    return NextResponse.json({ sessions: formatted });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new workout session
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = sessionSchema.parse(body);

    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        mood: validatedData.mood,
        energyLevel: validatedData.energyLevel,
      },
    });

    return NextResponse.json({ session: workoutSession }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions - Update workout session (usually to complete it)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = completeSessionSchema.parse(body);

    // Calculate duration if completing
    const duration = existing.completedAt
      ? undefined
      : Math.floor(
          (new Date().getTime() - existing.startedAt.getTime()) / 1000 / 60
        );

    const updated = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        completedAt: existing.completedAt ? undefined : new Date(),
        duration,
        notes: validatedData.notes,
        mood: validatedData.mood ?? existing.mood,
        energyLevel: validatedData.energyLevel ?? existing.energyLevel,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Failed to update session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions - Delete workout session
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    await prisma.workoutSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
