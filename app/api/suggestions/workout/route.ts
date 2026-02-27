import { NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";
import { subDays, format, getDay, startOfDay } from "date-fns";

/**
 * GET /api/suggestions/workout
 *
 * Analyzes the user's training history, active split, and muscle recovery
 * state to suggest what to train today.
 *
 * Response:
 *  - suggestedFocus   : primary muscle groups to train
 *  - suggestedSplit   : name of the split day to follow (if any)
 *  - recoveryStatus   : per-muscle-group recovery state
 *  - shouldRest       : true if all major muscles are recently trained
 *  - reason           : human-readable explanation
 *  - suggestedExercises: up to 6 exercises matching the target muscles
 */
export async function GET() {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    const [activeSplit, recentSessions, exercises] = await Promise.all([
      // Active split to know the plan
      prisma.workoutSplit.findFirst({
        where: { userId, isActive: true },
        include: {
          days: {
            include: {
              exercises: {
                include: {
                  exercise: { select: { id: true, name: true, muscleGroups: true } },
                },
              },
            },
          },
        },
      }),

      // Sessions from the last 7 days including muscle groups trained
      prisma.workoutSession.findMany({
        where: {
          userId,
          startedAt: { gte: sevenDaysAgo },
          completedAt: { not: null },
        },
        include: {
          sets: {
            include: {
              exercise: { select: { muscleGroups: true } },
            },
          },
        },
        orderBy: { startedAt: "desc" },
      }),

      // All user exercises for suggestions
      prisma.exercise.findMany({
        where: {
          OR: [{ userId }, { userId: null }],
        },
        select: { id: true, name: true, muscleGroups: true, difficulty: true },
        take: 200,
      }),
    ]);

    // ── Map of muscle group → days since last trained ──────────────────────
    const muscleLastTrained = new Map<string, Date>();

    recentSessions.forEach((s) => {
      const date = new Date(s.startedAt);
      s.sets.forEach((set) => {
        if (!set.exercise.muscleGroups) return;
        let muscles: string[];
        try {
          muscles = JSON.parse(set.exercise.muscleGroups);
        } catch {
          return;
        }
        muscles.forEach((muscle) => {
          const existing = muscleLastTrained.get(muscle);
          if (!existing || date > existing) {
            muscleLastTrained.set(muscle, date);
          }
        });
      });
    });

    // Recovery windows (hours until muscle group is recovered enough to retrain)
    const RECOVERY_HOURS: Record<string, number> = {
      "Chest":       48,
      "Back":        48,
      "Shoulders":   48,
      "Biceps":      36,
      "Triceps":     36,
      "Quadriceps":  72,
      "Hamstrings":  72,
      "Glutes":      72,
      "Calves":      36,
      "Core":        24,
      "Forearms":    24,
    };
    const DEFAULT_RECOVERY_HOURS = 48;

    // Calculate recovery status per muscle
    const recoveryStatus: Record<string, { lastTrained: string | null; hoursAgo: number | null; recovered: boolean }> = {};

    const allMuscles = Object.keys(RECOVERY_HOURS);
    const nowTime = now.getTime();

    allMuscles.forEach((muscle) => {
      const lastDate = muscleLastTrained.get(muscle) || null;
      if (!lastDate) {
        recoveryStatus[muscle] = { lastTrained: null, hoursAgo: null, recovered: true };
      } else {
        const hoursAgo = Math.round((nowTime - lastDate.getTime()) / (1000 * 60 * 60));
        const recoveryThreshold = RECOVERY_HOURS[muscle] ?? DEFAULT_RECOVERY_HOURS;
        recoveryStatus[muscle] = {
          lastTrained: format(lastDate, "yyyy-MM-dd"),
          hoursAgo,
          recovered: hoursAgo >= recoveryThreshold,
        };
      }
    });

    // ── Determine target from active split ─────────────────────────────────
    let suggestedSplitDay: string | null = null;
    let splitMuscleTargets: string[] = [];

    if (activeSplit) {
      const todayDow = getDay(now); // 0 = Sunday ... 6 = Saturday
      // Map day index to split day if split has ordered days
      const splitDays = activeSplit.days;
      if (splitDays.length > 0) {
        // Find how many sessions were done this week
        const sessionsThisWeek = recentSessions.filter(
          (s) => new Date(s.startedAt) >= startOfDay(subDays(now, todayDow))
        ).length;
        const nextDayIndex = sessionsThisWeek % splitDays.length;
        const splitDay = splitDays[nextDayIndex];

        if (splitDay) {
          suggestedSplitDay = splitDay.name;
          splitDay.exercises.forEach((sde) => {
            if (sde.exercise?.muscleGroups) {
              try {
                const muscles = JSON.parse(sde.exercise.muscleGroups) as string[];
                splitMuscleTargets.push(...muscles);
              } catch {
                // ignore
              }
            }
          });
          // Also pull from day name keywords
          const dayNameWords = splitDay.name.toLowerCase();
          if (dayNameWords.includes("chest")) splitMuscleTargets.push("Chest", "Triceps");
          if (dayNameWords.includes("back") || dayNameWords.includes("pull")) splitMuscleTargets.push("Back", "Biceps");
          if (dayNameWords.includes("leg")) splitMuscleTargets.push("Quadriceps", "Hamstrings", "Glutes", "Calves");
          if (dayNameWords.includes("shoulder")) splitMuscleTargets.push("Shoulders", "Triceps");
          if (dayNameWords.includes("arm")) splitMuscleTargets.push("Biceps", "Triceps", "Forearms");
          if (dayNameWords.includes("push")) splitMuscleTargets.push("Chest", "Shoulders", "Triceps");
          // deduplicate
          splitMuscleTargets = [...new Set(splitMuscleTargets)];
        }
      }
    }

    // ── Fallback: suggest the most recovered muscle groups ─────────────────
    let suggestedFocus: string[];
    let reason: string;

    const recoveredMuscles = allMuscles.filter((m) => recoveryStatus[m].recovered);
    const neverTrainedMuscles = allMuscles.filter((m) => !recoveryStatus[m].lastTrained);
    const shouldRest = recoveredMuscles.length === 0;

    if (splitMuscleTargets.length > 0) {
      suggestedFocus = splitMuscleTargets;
      const allRecovered = splitMuscleTargets.every((m) => !recoveryStatus[m] || recoveryStatus[m].recovered);
      reason = allRecovered
        ? `Follow your "${suggestedSplitDay}" split day — all target muscles are recovered.`
        : `Follow your "${suggestedSplitDay}" split day. Note: some muscles may not be fully recovered yet.`;
    } else if (neverTrainedMuscles.length > 0) {
      suggestedFocus = neverTrainedMuscles.slice(0, 3);
      reason = `Focus on muscles you haven't trained recently: ${suggestedFocus.join(", ")}.`;
    } else if (recoveredMuscles.length > 0) {
      // Suggest the muscles that are most recovered (trained longest ago)
      const sortedByLastTrained = recoveredMuscles.sort((a, b) => {
        const aHours = recoveryStatus[a].hoursAgo ?? 999;
        const bHours = recoveryStatus[b].hoursAgo ?? 999;
        return bHours - aHours; // most hours = most recovered first
      });
      suggestedFocus = sortedByLastTrained.slice(0, 3);
      reason = `These muscles have had the most recovery time: ${suggestedFocus.join(", ")}.`;
    } else {
      suggestedFocus = [];
      reason = "All major muscle groups have been trained recently. Consider a rest day or light cardio.";
    }

    // ── Find suggested exercises matching focus muscles ────────────────────
    const focusSet = new Set(suggestedFocus.map((m) => m.toLowerCase()));

    const scored = exercises
      .filter((ex) => {
        if (!ex.muscleGroups) return false;
        try {
          const muscles = JSON.parse(ex.muscleGroups) as string[];
          return muscles.some((m) => focusSet.has(m.toLowerCase()));
        } catch {
          return false;
        }
      })
      .map((ex) => {
        let muscles: string[];
        try { muscles = JSON.parse(ex.muscleGroups!); } catch { muscles = []; }
        const matchCount = muscles.filter((m) => focusSet.has(m.toLowerCase())).length;
        return { ...ex, muscleGroups: muscles, matchCount };
      })
      .sort((a, b) => b.matchCount - a.matchCount);

    const suggestedExercises = scored.slice(0, 6).map(({ id, name, muscleGroups, difficulty }) => ({
      id, name, muscleGroups, difficulty,
    }));

    return NextResponse.json({
      suggestedFocus,
      suggestedSplitDay,
      shouldRest,
      reason,
      recoveryStatus,
      suggestedExercises,
      trainedToday: recentSessions.some(
        (s) => format(new Date(s.startedAt), "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
      ),
    });
  } catch (error) {
    console.error("Error generating workout suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate workout suggestion" },
      { status: 500 }
    );
  }
}
