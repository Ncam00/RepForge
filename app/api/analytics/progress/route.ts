import { NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";
import { subDays, format, startOfWeek, endOfWeek } from "date-fns";

/**
 * GET /api/analytics/progress
 *
 * Returns comprehensive user progression data:
 * - XP history and level progression
 * - Achievement timeline
 * - Workout milestones (total sessions, PRs, streaks)
 * - Body composition trend (weight + body fat over time)
 * - Weekly training volume trend (last 12 weeks)
 */
export async function GET() {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const ninetyDaysAgo = subDays(now, 90);

    // Run all queries in parallel for performance
    const [
      userProgress,
      recentXpTransactions,
      achievements,
      totalSessions,
      totalPRs,
      recentPRs,
      bodyCompositionHistory,
      weeklySessions,
    ] = await Promise.all([
      // Current XP / level state
      prisma.userProgress.findUnique({
        where: { userId },
      }),

      // XP transaction history (last 90 days)
      prisma.xpTransaction.findMany({
        where: {
          userId,
          createdAt: { gte: ninetyDaysAgo },
        },
        orderBy: { createdAt: "asc" },
      }),

      // Achievements (all time)
      prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
      }),

      // Total completed sessions (all time)
      prisma.workoutSession.count({
        where: { userId, completedAt: { not: null } },
      }),

      // Total PRs (all time)
      prisma.personalRecord.count({ where: { userId } }),

      // Recent PRs for milestone display
      prisma.personalRecord.findMany({
        where: { userId },
        include: {
          exercise: { select: { name: true } },
        },
        orderBy: { date: "desc" },
        take: 10,
      }),

      // Body composition (last 90 days)
      prisma.weight.findMany({
        where: {
          userId,
          date: { gte: ninetyDaysAgo },
        },
        orderBy: { date: "asc" },
        select: { date: true, weight: true, bodyFat: true, muscleMass: true, unit: true },
      }),

      // Per-week sessions for volume trend (last 12 weeks)
      prisma.workoutSession.findMany({
        where: {
          userId,
          startedAt: { gte: subDays(now, 84) }, // 12 weeks
          completedAt: { not: null },
        },
        include: {
          sets: {
            where: { isWarmup: false },
            select: { weight: true, reps: true },
          },
        },
        orderBy: { startedAt: "asc" },
      }),
    ]);

    // ── XP progression: cumulative XP per day ──────────────────────────────
    const xpByDay = new Map<string, number>();
    let runningXp = 0;

    // Seed with XP before window if user has existing progress
    const xpBeforeWindow = userProgress
      ? Math.max(0, userProgress.xp - recentXpTransactions.reduce((s, t) => s + t.amount, 0))
      : 0;

    // Build daily cumulative map
    for (let i = 89; i >= 0; i--) {
      const dateKey = format(subDays(now, i), "yyyy-MM-dd");
      xpByDay.set(dateKey, 0);
    }

    recentXpTransactions.forEach((tx) => {
      const key = format(new Date(tx.createdAt), "yyyy-MM-dd");
      xpByDay.set(key, (xpByDay.get(key) || 0) + tx.amount);
    });

    runningXp = xpBeforeWindow;
    const xpHistory = Array.from(xpByDay.entries()).map(([date, gained]) => {
      runningXp += gained;
      return { date, xp: runningXp, gained };
    });

    // ── Weekly training volume ─────────────────────────────────────────────
    const weeklyVolumeMap = new Map<string, { sets: number; volume: number; sessions: number }>();

    weeklySessions.forEach((s) => {
      const weekKey = format(startOfWeek(new Date(s.startedAt)), "yyyy-MM-dd");
      const existing = weeklyVolumeMap.get(weekKey) || { sets: 0, volume: 0, sessions: 0 };
      const sessionVolume = s.sets.reduce(
        (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
        0
      );
      weeklyVolumeMap.set(weekKey, {
        sessions: existing.sessions + 1,
        sets: existing.sets + s.sets.length,
        volume: existing.volume + sessionVolume,
      });
    });

    const weeklyVolumeTrend = Array.from(weeklyVolumeMap.entries())
      .map(([weekStart, data]) => ({
        weekStart,
        weekEnd: format(endOfWeek(new Date(weekStart)), "yyyy-MM-dd"),
        ...data,
        volume: Math.round(data.volume),
      }))
      .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    // ── XP breakdown by source ─────────────────────────────────────────────
    const xpBySource = recentXpTransactions.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.source] = (acc[tx.source] || 0) + tx.amount;
      return acc;
    }, {});

    // ── Level thresholds (100 XP per level) ───────────────────────────────
    const XP_PER_LEVEL = 100;
    const currentLevel = userProgress?.level || 1;
    const currentXp = userProgress?.xp || 0;
    const xpInCurrentLevel = currentXp % XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel;
    const levelProgress = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100);

    // ── Milestones ──────────────────────────────────────────────────────────
    const sessionMilestones = [1, 10, 25, 50, 100, 250, 500];
    const nextSessionMilestone = sessionMilestones.find((m) => m > totalSessions) || null;

    const prMilestones = [1, 5, 10, 25, 50, 100];
    const nextPrMilestone = prMilestones.find((m) => m > totalPRs) || null;

    const milestones = {
      totalSessions,
      nextSessionMilestone,
      progressToNextSessionMilestone: nextSessionMilestone
        ? Math.round((totalSessions / nextSessionMilestone) * 100)
        : 100,
      totalPRs,
      nextPrMilestone,
      progressToNextPrMilestone: nextPrMilestone
        ? Math.round((totalPRs / nextPrMilestone) * 100)
        : 100,
      currentStreak: userProgress?.currentStreak || 0,
      longestStreak: userProgress?.longestStreak || 0,
    };

    return NextResponse.json({
      // Level & XP
      level: {
        current: currentLevel,
        xp: currentXp,
        xpInCurrentLevel,
        xpToNextLevel,
        levelProgress,
        totalXpEarned: userProgress?.totalXpEarned || 0,
      },
      // XP sources breakdown
      xpBySource,
      // XP trend over last 90 days
      xpHistory,
      // Achievements
      achievements: achievements.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        icon: a.icon,
        unlockedAt: a.unlockedAt,
      })),
      // Workout milestones
      milestones,
      // Recent PRs
      recentPRs: recentPRs.map((pr) => ({
        id: pr.id,
        exerciseName: pr.exercise.name,
        recordType: pr.recordType,
        value: pr.value,
        date: pr.date,
      })),
      // Body composition trend
      bodyComposition: bodyCompositionHistory.map((w) => ({
        date: format(new Date(w.date), "yyyy-MM-dd"),
        weight: w.weight,
        bodyFat: w.bodyFat,
        muscleMass: w.muscleMass,
        unit: w.unit,
      })),
      // Weekly volume trend (last 12 weeks)
      weeklyVolumeTrend,
    });
  } catch (error) {
    console.error("Error fetching progress analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress analytics" },
      { status: 500 }
    );
  }
}
