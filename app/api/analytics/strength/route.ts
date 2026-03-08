import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";
import { subDays, format, startOfWeek } from "date-fns";

/**
 * GET /api/analytics/strength
 *
 * Query params:
 *   exerciseId  - (optional) filter to a specific exercise
 *   period      - "90d" | "180d" | "1y" | "all" (default: "90d")
 *
 * Returns:
 * - Per-exercise strength trends (estimated 1RM over time)
 * - Best sets per exercise
 * - Volume per muscle group over time
 * - Most improved exercises (% change in estimated 1RM)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exerciseId");
    const period = searchParams.get("period") || "90d";

    const now = new Date();
    let since: Date;
    switch (period) {
      case "180d": since = subDays(now, 180); break;
      case "1y":   since = subDays(now, 365); break;
      case "all":  since = new Date(0); break;
      default:     since = subDays(now, 90);  break;
    }

    // Fetch all non-warmup sets in the period
    const sets = await prisma.exerciseSet.findMany({
      where: {
        session: {
          userId,
          startedAt: { gte: since },
          completedAt: { not: null },
        },
        isWarmup: false,
        ...(exerciseId ? { exerciseId } : {}),
      },
      include: {
        exercise: {
          select: { id: true, name: true, muscleGroups: true },
        },
        session: {
          select: { startedAt: true },
        },
      },
      orderBy: { session: { startedAt: "asc" } },
    });

    // ── Estimated 1-Rep Max helper (Epley formula) ──────────────────────────
    const estimate1RM = (weight: number, reps: number): number => {
      if (reps === 1) return weight;
      if (reps > 30) return weight; // not meaningful
      return Math.round(weight * (1 + reps / 30));
    };

    // ── Group sets by exercise ──────────────────────────────────────────────
    type ExerciseAccumulator = {
      name: string;
      muscleGroups: string[];
      byDate: Map<string, { maxWeight: number; max1RM: number; totalVolume: number; sets: number }>;
      allTime: { max1RM: number; maxWeight: number; maxReps: number };
    };

    const byExercise = new Map<string, ExerciseAccumulator>();

    sets.forEach((set) => {
      if (!set.weight || !set.reps) return;

      const exerciseKey = set.exercise.id;
      const dateKey = format(new Date(set.session.startedAt), "yyyy-MM-dd");
      const muscles = set.exercise.muscleGroups
        ? JSON.parse(set.exercise.muscleGroups) as string[]
        : [];
      const est1RM = estimate1RM(set.weight, set.reps);
      const volume = set.weight * set.reps;

      if (!byExercise.has(exerciseKey)) {
        byExercise.set(exerciseKey, {
          name: set.exercise.name,
          muscleGroups: muscles,
          byDate: new Map(),
          allTime: { max1RM: 0, maxWeight: 0, maxReps: 0 },
        });
      }

      const ex = byExercise.get(exerciseKey)!;

      // Update date bucket
      const existing = ex.byDate.get(dateKey) || { maxWeight: 0, max1RM: 0, totalVolume: 0, sets: 0 };
      ex.byDate.set(dateKey, {
        maxWeight: Math.max(existing.maxWeight, set.weight),
        max1RM: Math.max(existing.max1RM, est1RM),
        totalVolume: existing.totalVolume + volume,
        sets: existing.sets + 1,
      });

      // Update all-time bests
      ex.allTime.max1RM = Math.max(ex.allTime.max1RM, est1RM);
      ex.allTime.maxWeight = Math.max(ex.allTime.maxWeight, set.weight);
      ex.allTime.maxReps = Math.max(ex.allTime.maxReps, set.reps);
    });

    // ── Build strength trends per exercise ─────────────────────────────────
    const exerciseTrends = Array.from(byExercise.entries()).map(([id, ex]) => {
      const trend = Array.from(ex.byDate.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate improvement: compare first vs last 1RM data point
      let improvement1RMPercent: number | null = null;
      if (trend.length >= 2) {
        const first = trend[0].max1RM;
        const last = trend[trend.length - 1].max1RM;
        if (first > 0) {
          improvement1RMPercent = Math.round(((last - first) / first) * 100);
        }
      }

      return {
        id,
        name: ex.name,
        muscleGroups: ex.muscleGroups,
        trend,
        allTimeBest: ex.allTime,
        improvement1RMPercent,
        dataPoints: trend.length,
      };
    });

    // Sort: if specific exercise requested, just return it. Otherwise, sort by frequency.
    if (exerciseId) {
      const single = exerciseTrends.find((e) => e.id === exerciseId);
      if (!single) {
        return NextResponse.json({ error: "Exercise not found or no data in period" }, { status: 404 });
      }
      return NextResponse.json({ exercise: single });
    }

    // Sort by most data points (most frequently tracked)
    exerciseTrends.sort((a, b) => b.dataPoints - a.dataPoints);

    // ── Most improved (minimum 5 data points, improved) ────────────────────
    const mostImproved = exerciseTrends
      .filter((e) => e.dataPoints >= 5 && (e.improvement1RMPercent ?? 0) > 0)
      .sort((a, b) => (b.improvement1RMPercent ?? 0) - (a.improvement1RMPercent ?? 0))
      .slice(0, 5);

    // ── Weekly volume per muscle group ─────────────────────────────────────
    const muscleVolumeByWeek = new Map<string, Map<string, number>>();
    // muscle -> week -> volume

    sets.forEach((set) => {
      if (!set.weight || !set.reps) return;
      const weekKey = format(startOfWeek(new Date(set.session.startedAt)), "yyyy-MM-dd");
      const muscles = set.exercise.muscleGroups
        ? JSON.parse(set.exercise.muscleGroups) as string[]
        : [];
      const volume = set.weight * set.reps;

      muscles.forEach((muscle) => {
        if (!muscleVolumeByWeek.has(muscle)) {
          muscleVolumeByWeek.set(muscle, new Map());
        }
        const weekMap = muscleVolumeByWeek.get(muscle)!;
        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + volume);
      });
    });

    // Convert to array sorted by week
    const muscleVolumeTrend = Array.from(muscleVolumeByWeek.entries()).map(([muscle, weekMap]) => ({
      muscle,
      data: Array.from(weekMap.entries())
        .map(([week, volume]) => ({ week, volume: Math.round(volume) }))
        .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime()),
    }));

    // Summarise total volume per muscle for ranking
    const muscleVolumeTotal = muscleVolumeTrend
      .map(({ muscle, data }) => ({
        muscle,
        totalVolume: data.reduce((s, d) => s + d.volume, 0),
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);

    return NextResponse.json({
      period,
      // Top 15 exercises by frequency
      topExercises: exerciseTrends.slice(0, 15).map((e) => ({
        id: e.id,
        name: e.name,
        muscleGroups: e.muscleGroups,
        allTimeBest: e.allTimeBest,
        improvement1RMPercent: e.improvement1RMPercent,
        dataPoints: e.dataPoints,
      })),
      // Detailed trends for top 10 (for chart rendering)
      exerciseTrends: exerciseTrends.slice(0, 10),
      // Most improved
      mostImproved,
      // Per-muscle volume breakdown
      muscleVolumeTotal,
      muscleVolumeTrend,
    });
  } catch (error) {
    console.error("Error fetching strength analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch strength analytics" },
      { status: 500 }
    );
  }
}
