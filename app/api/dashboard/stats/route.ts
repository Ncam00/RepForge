import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const last30Days = subDays(now, 30);

    // Get latest weight
    const latestWeight = await prisma.weight.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    });

    // Get weight from 30 days ago for comparison
    const oldWeight = await prisma.weight.findFirst({
      where: {
        userId,
        date: { lte: last30Days },
      },
      orderBy: { date: "desc" },
    });

    // Get workout sessions this week
    const sessionsThisWeek = await prisma.workoutSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        completedAt: { not: null },
      },
    });

    // Get total workouts this month
    const sessionsThisMonth = await prisma.workoutSession.count({
      where: {
        userId,
        startedAt: {
          gte: monthStart,
        },
        completedAt: { not: null },
      },
    });

    // Calculate total volume this week
    const setsThisWeek = await prisma.exerciseSet.findMany({
      where: {
        session: {
          userId,
          startedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        isWarmup: false,
      },
      select: {
        weight: true,
        reps: true,
      },
    });

    const totalVolume = setsThisWeek.reduce((sum, set) => {
      if (set.weight && set.reps) {
        return sum + set.weight * set.reps;
      }
      return sum;
    }, 0);

    // Get active split
    const activeSplit = await prisma.workoutSplit.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        days: true,
      },
    });

    // Get total PRs
    const totalPRs = await prisma.personalRecord.count({
      where: { userId },
    });

    // Get recent PRs
    const recentPRs = await prisma.personalRecord.findMany({
      where: { userId },
      include: {
        exercise: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 5,
    });

    // Get recent sessions
    const recentSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      include: {
        sets: {
          include: {
            exercise: {
              select: {
                name: true,
                muscleGroups: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 5,
    });

    // Calculate streak
    let streak = 0;
    const allSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });

    if (allSessions.length > 0) {
      const dates = allSessions.map((s) => s.startedAt.toDateString());
      const uniqueDates = [...new Set(dates)];
      
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const dateStr of uniqueDates) {
        const sessionDate = new Date(dateStr);
        const diffDays = Math.floor(
          (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diffDays === streak || diffDays === streak + 1) {
          streak = diffDays + 1;
        } else {
          break;
        }
      }
    }

    // Get weight progress data for chart
    const weightHistory = await prisma.weight.findMany({
      where: {
        userId,
        date: { gte: last30Days },
      },
      orderBy: { date: "asc" },
      take: 30,
    });

    return NextResponse.json({
      stats: {
        currentWeight: latestWeight?.weight || null,
        weightUnit: latestWeight?.unit || "kg",
        weightChange: oldWeight && latestWeight
          ? latestWeight.weight - oldWeight.weight
          : null,
        workoutsThisWeek: sessionsThisWeek.length,
        workoutsThisMonth: sessionsThisMonth,
        totalVolume: Math.round(totalVolume),
        activeSplit: activeSplit
          ? {
              name: activeSplit.name,
              daysCount: activeSplit.days.length,
            }
          : null,
        totalPRs,
        streak,
      },
      recentPRs: recentPRs.map((pr) => ({
        id: pr.id,
        exerciseName: pr.exercise.name,
        recordType: pr.recordType,
        value: pr.value,
        date: pr.date,
      })),
      recentSessions: recentSessions.map((session) => ({
        id: session.id,
        name: session.name,
        startedAt: session.startedAt,
        duration: session.duration,
        totalSets: session.sets.length,
        exercises: [...new Set(session.sets.map((s) => s.exercise.name))],
      })),
      weightHistory: weightHistory.map((w) => ({
        date: w.date,
        weight: w.weight,
        bodyFat: w.bodyFat,
        muscleMass: w.muscleMass,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
