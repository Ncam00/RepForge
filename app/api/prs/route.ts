import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const prSchema = z.object({
  exerciseId: z.string(),
  recordType: z.enum(["one_rep_max", "max_volume", "max_reps"]),
  value: z.number(),
  notes: z.string().optional(),
});

// GET /api/prs - Get all personal records
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get("exerciseId");

    const prs = await prisma.personalRecord.findMany({
      where: {
        userId: session.user.id,
        ...(exerciseId ? { exerciseId } : {}),
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
      orderBy: { date: "desc" },
    });

    const formatted = prs.map((pr) => ({
      ...pr,
      exercise: {
        ...pr.exercise,
        muscleGroups: JSON.parse(pr.exercise.muscleGroups),
      },
    }));

    return NextResponse.json({ prs: formatted });
  } catch (error) {
    console.error("Failed to fetch PRs:", error);
    return NextResponse.json(
      { error: "Failed to fetch PRs" },
      { status: 500 }
    );
  }
}

// POST /api/prs - Create or update a PR
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = prSchema.parse(body);

    // Check if PR already exists for this exercise and type
    const existingPR = await prisma.personalRecord.findFirst({
      where: {
        userId: session.user.id,
        exerciseId: validatedData.exerciseId,
        recordType: validatedData.recordType,
      },
    });

    let pr;
    if (existingPR) {
      // Only update if new value is better
      if (validatedData.value > existingPR.value) {
        pr = await prisma.personalRecord.update({
          where: { id: existingPR.id },
          data: {
            value: validatedData.value,
            date: new Date(),
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
      } else {
        return NextResponse.json(
          { message: "Not a new record", isNewPR: false },
          { status: 200 }
        );
      }
    } else {
      // Create new PR
      pr = await prisma.personalRecord.create({
        data: {
          userId: session.user.id,
          exerciseId: validatedData.exerciseId,
          recordType: validatedData.recordType,
          value: validatedData.value,
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
    }

    return NextResponse.json({
      pr: {
        ...pr,
        exercise: {
          ...pr.exercise,
          muscleGroups: JSON.parse(pr.exercise.muscleGroups),
        },
      },
      isNewPR: true,
    }, { status: existingPR ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Failed to create/update PR:", error);
    return NextResponse.json(
      { error: "Failed to create/update PR" },
      { status: 500 }
    );
  }
}

// Helper function to calculate 1RM using Epley formula
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// Helper function to check and update PRs after completing a set
export async function checkAndUpdatePRs(
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number
) {
  const results = {
    oneRepMax: false,
    maxVolume: false,
    maxReps: false,
  };

  try {
    // Calculate 1RM
    const estimated1RM = calculate1RM(weight, reps);

    // Check 1RM PR
    const existing1RM = await prisma.personalRecord.findFirst({
      where: {
        userId,
        exerciseId,
        recordType: "one_rep_max",
      },
    });

    if (!existing1RM || estimated1RM > existing1RM.value) {
      await prisma.personalRecord.upsert({
        where: {
          id: existing1RM?.id || "new",
        },
        create: {
          userId,
          exerciseId,
          recordType: "one_rep_max",
          value: estimated1RM,
        },
        update: {
          value: estimated1RM,
          date: new Date(),
        },
      });
      results.oneRepMax = true;
    }

    // Check max volume PR (weight * reps)
    const volume = weight * reps;
    const existingVolume = await prisma.personalRecord.findFirst({
      where: {
        userId,
        exerciseId,
        recordType: "max_volume",
      },
    });

    if (!existingVolume || volume > existingVolume.value) {
      await prisma.personalRecord.upsert({
        where: {
          id: existingVolume?.id || "new",
        },
        create: {
          userId,
          exerciseId,
          recordType: "max_volume",
          value: volume,
        },
        update: {
          value: volume,
          date: new Date(),
        },
      });
      results.maxVolume = true;
    }

    // Check max reps PR (for the same weight)
    const existingReps = await prisma.personalRecord.findFirst({
      where: {
        userId,
        exerciseId,
        recordType: "max_reps",
      },
    });

    if (!existingReps || reps > existingReps.value) {
      await prisma.personalRecord.upsert({
        where: {
          id: existingReps?.id || "new",
        },
        create: {
          userId,
          exerciseId,
          recordType: "max_reps",
          value: reps,
        },
        update: {
          value: reps,
          date: new Date(),
        },
      });
      results.maxReps = true;
    }

    return results;
  } catch (error) {
    console.error("Failed to check/update PRs:", error);
    return results;
  }
}
