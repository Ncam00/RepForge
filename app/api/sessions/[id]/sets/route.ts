import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { z } from "zod";
import { checkAndUpdatePRs } from "@/app/api/prs/route";
import { awardXP, XP_REWARDS } from "@/lib/xp";

const setSchema = z.object({
  exerciseId: z.string(),
  setNumber: z.number().int().min(1),
  weight: z.number().optional(),
  reps: z.number().int().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  restTime: z.number().int().min(0).optional(),
  isWarmup: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET /api/sessions/[id]/sets - Get sets for a session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = params.id;

    // Verify session belongs to user
    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!workoutSession || workoutSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const sets = await prisma.exerciseSet.findMany({
      where: { workoutSessionId: sessionId },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            muscleGroups: true,
          },
        },
      },
      orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
    });

    const formatted = sets.map((set) => ({
      ...set,
      exercise: {
        ...set.exercise,
        muscleGroups: JSON.parse(set.exercise.muscleGroups),
      },
    }));

    return NextResponse.json({ sets: formatted });
  } catch (error) {
    console.error("Failed to fetch sets:", error);
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 });
  }
}

// POST /api/sessions/[id]/sets - Add a set to session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = params.id;

    // Verify session belongs to user
    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!workoutSession || workoutSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = setSchema.parse(body);

    const exerciseSet = await prisma.exerciseSet.create({
      data: {
        workoutSessionId: sessionId,
        exerciseId: validatedData.exerciseId,
        setNumber: validatedData.setNumber,
        weight: validatedData.weight,
        reps: validatedData.reps,
        rpe: validatedData.rpe,
        restTime: validatedData.restTime,
        isWarmup: validatedData.isWarmup ?? false,
        notes: validatedData.notes,
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            muscleGroups: true,
          },
        },
      },
    });

    // Award XP for completing a set (not warmup)
    let xpResults = null;
    if (!exerciseSet.isWarmup) {
      xpResults = await awardXP(
        session.user.id,
        XP_REWARDS.SET_COMPLETE,
        `Completed set for ${exerciseSet.exercise.name}`,
        "set_complete",
        prisma
      );
    }

    // Check for PRs if not a warmup set and has weight and reps
    let prResults = null;
    if (!exerciseSet.isWarmup && exerciseSet.weight && exerciseSet.reps) {
      prResults = await checkAndUpdatePRs(
        session.user.id,
        validatedData.exerciseId,
        exerciseSet.weight,
        exerciseSet.reps
      );

      // Award PR XP if new PR was set
      if (prResults && (prResults.newOneRepMax || prResults.newVolumeRecord)) {
        const prXP = await awardXP(
          session.user.id,
          XP_REWARDS.PR_SET,
          `New PR on ${exerciseSet.exercise.name}`,
          "personal_record",
          prisma
        );
        
        xpResults = xpResults ? {
          ...xpResults,
          prBonus: XP_REWARDS.PR_SET,
          leveledUp: xpResults.leveledUp || prXP.leveledUp,
          newLevel: prXP.newLevel,
          totalXp: prXP.totalXp,
        } : prXP;
      }
    }

    return NextResponse.json({
      set: {
        ...exerciseSet,
        exercise: {
          ...exerciseSet.exercise,
          muscleGroups: JSON.parse(exerciseSet.exercise.muscleGroups),
        },
      },
      prResults,
      xpResults,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Failed to add set:", error);
    return NextResponse.json({ error: "Failed to add set" }, { status: 500 });
  }
}

// DELETE /api/sessions/[id]/sets - Delete a specific set
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const setId = searchParams.get("setId");

    if (!setId) {
      return NextResponse.json({ error: "Set ID required" }, { status: 400 });
    }

    const sessionId = params.id;

    // Verify session belongs to user
    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!workoutSession || workoutSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    await prisma.exerciseSet.delete({
      where: { id: setId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete set:", error);
    return NextResponse.json({ error: "Failed to delete set" }, { status: 500 });
  }
}
