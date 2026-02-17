import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";

// GET /api/exercises/history - Get recent exercise history for quick selection
export async function GET(request: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exerciseId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // If exerciseId provided, get last performance for that exercise
    if (exerciseId) {
      // First get completed sessions for this user
      const completedSessionIds = await prisma.workoutSession.findMany({
        where: {
          userId: session.user.id,
          completedAt: { not: null },
        },
        select: { id: true, startedAt: true },
        orderBy: { startedAt: "desc" },
      });

      const sessionIdList = completedSessionIds.map(s => s.id);

      const lastSets = await prisma.exerciseSet.findMany({
        where: {
          exerciseId,
          workoutSessionId: { in: sessionIdList },
          isWarmup: false,
        },
        orderBy: { completedAt: "desc" },
        take: 10,
      });

      // Group by session to get last workout's sets
      const sessionMap = new Map(completedSessionIds.map(s => [s.id, s.startedAt]));
      const sessionGroups: Record<string, typeof lastSets> = {};
      
      for (const set of lastSets) {
        const sessionDate = sessionMap.get(set.workoutSessionId);
        if (sessionDate) {
          const dateStr = sessionDate.toISOString().split("T")[0];
          if (!sessionGroups[dateStr]) {
            sessionGroups[dateStr] = [];
          }
          sessionGroups[dateStr].push(set);
        }
      }

      // Get just the most recent session's sets
      const dates = Object.keys(sessionGroups).sort().reverse();
      const lastSessionSets = dates.length > 0 ? sessionGroups[dates[0]] : [];

      // Calculate best set
      const bestSet = lastSets.length > 0
        ? lastSets.reduce((best, set) => {
            const volume = (set.weight || 0) * (set.reps || 0);
            const bestVolume = (best.weight || 0) * (best.reps || 0);
            return volume > bestVolume ? set : best;
          })
        : null;

      return NextResponse.json({
        lastSession: {
          date: dates[0] || null,
          sets: lastSessionSets
            .sort((a, b) => a.setNumber - b.setNumber)
            .map(s => ({
              setNumber: s.setNumber,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe,
            })),
        },
        bestSet: bestSet ? {
          weight: bestSet.weight,
          reps: bestSet.reps,
          date: bestSet.completedAt,
        } : null,
        totalSessions: dates.length,
      });
    }

    // Get recently used exercises (for quick-add)
    const recentSets = await prisma.exerciseSet.findMany({
      where: {
        session: {
          userId: session.user.id,
        },
      },
      orderBy: { completedAt: "desc" },
      take: 100,
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

    // Dedupe and count exercises
    const exerciseMap = new Map<string, { 
      id: string; 
      name: string; 
      muscleGroups: string[];
      lastUsed: Date;
      useCount: number;
    }>();

    for (const set of recentSets) {
      const existing = exerciseMap.get(set.exerciseId);
      if (existing) {
        existing.useCount++;
      } else {
        exerciseMap.set(set.exerciseId, {
          id: set.exercise.id,
          name: set.exercise.name,
          muscleGroups: JSON.parse(set.exercise.muscleGroups),
          lastUsed: set.completedAt,
          useCount: 1,
        });
      }
    }

    // Sort by recency and take top N
    const recentExercises = Array.from(exerciseMap.values())
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, limit);

    return NextResponse.json({ recentExercises });
  } catch (error) {
    console.error("Failed to fetch exercise history:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise history" },
      { status: 500 }
    );
  }
}
