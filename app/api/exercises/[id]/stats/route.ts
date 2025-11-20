import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { subDays } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: exerciseId } = await params;

    // Get all sets for this exercise
    const sets = await prisma.exerciseSet.findMany({
      where: {
        exerciseId,
        session: {
          userId: session.user.id,
        },
        isWarmup: false,
        weight: { not: null },
        reps: { not: null },
      },
      include: {
        session: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Get personal records
    const personalRecords = await prisma.personalRecord.findMany({
      where: {
        userId: session.user.id,
        exerciseId,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate stats
    const totalSessions = new Set(sets.map((s) => s.workoutSessionId)).size;
    const totalSets = sets.length;
    const totalVolume = sets.reduce(
      (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
      0
    );

    // Calculate estimated 1RM (using Epley formula from most recent heavy set)
    const recentHeavySets = sets
      .filter((s) => (s.weight || 0) > 0 && (s.reps || 0) > 0 && (s.reps || 0) <= 12)
      .slice(0, 5);
    const estimated1RM = recentHeavySets.length
      ? Math.max(
          ...recentHeavySets.map((s) => {
            const weight = s.weight || 0;
            const reps = s.reps || 0;
            return reps === 1 ? weight : weight * (1 + reps / 30);
          })
        )
      : null;

    // Volume progression by session
    const sessionVolumes = new Map<string, { date: Date; volume: number }>();
    sets.forEach((set) => {
      const sessionId = set.workoutSessionId;
      const volume = (set.weight || 0) * (set.reps || 0);
      if (sessionVolumes.has(sessionId)) {
        const existing = sessionVolumes.get(sessionId)!;
        existing.volume += volume;
      } else {
        sessionVolumes.set(sessionId, {
          date: set.session.startedAt,
          volume,
        });
      }
    });

    const volumeHistory = Array.from(sessionVolumes.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-20) // Last 20 sessions
      .map((v) => ({
        date: v.date.toISOString(),
        volume: Math.round(v.volume),
      }));

    // Max weight progression by session
    const sessionMaxWeights = new Map<string, { date: Date; weight: number }>();
    sets.forEach((set) => {
      const sessionId = set.workoutSessionId;
      const weight = set.weight || 0;
      if (sessionMaxWeights.has(sessionId)) {
        const existing = sessionMaxWeights.get(sessionId)!;
        existing.weight = Math.max(existing.weight, weight);
      } else {
        sessionMaxWeights.set(sessionId, {
          date: set.session.startedAt,
          weight,
        });
      }
    });

    const maxWeightHistory = Array.from(sessionMaxWeights.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-20) // Last 20 sessions
      .map((v) => ({
        date: v.date.toISOString(),
        weight: v.weight,
      }));

    // Best sets in last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    const bestSets = sets
      .filter((s) => new Date(s.completedAt) >= thirtyDaysAgo)
      .sort((a, b) => {
        const volumeA = (a.weight || 0) * (a.reps || 0);
        const volumeB = (b.weight || 0) * (b.reps || 0);
        return volumeB - volumeA;
      })
      .slice(0, 10);

    // Recent sessions
    const recentSessionIds = Array.from(
      new Set(sets.slice(0, 50).map((s) => s.workoutSessionId))
    ).slice(0, 5);

    const recentSessions = await Promise.all(
      recentSessionIds.map(async (sessionId) => {
        const sessionSets = sets.filter((s) => s.workoutSessionId === sessionId);
        const session = sessionSets[0]?.session;
        return {
          sessionId,
          sessionName: session?.name || "Workout",
          date: session?.startedAt.toISOString(),
          sets: sessionSets.map((s) => ({
            weight: s.weight,
            reps: s.reps,
          })),
          totalVolume: sessionSets.reduce(
            (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
            0
          ),
        };
      })
    );

    return NextResponse.json({
      totalSessions,
      totalSets,
      totalVolume: Math.round(totalVolume),
      estimated1RM: estimated1RM ? Math.round(estimated1RM) : null,
      volumeHistory,
      maxWeightHistory,
      personalRecords,
      bestSets,
      recentSessions,
    });
  } catch (error) {
    console.error("Error fetching exercise stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise stats" },
      { status: 500 }
    );
  }
}
