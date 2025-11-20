import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { subDays, startOfWeek, format, getDay } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const ninetyDaysAgo = subDays(now, 90);

    // Get all sessions for calculations
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        startedAt: { gte: ninetyDaysAgo },
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: { startedAt: "asc" },
    });

    const recentSessions = sessions.filter(
      (s) => new Date(s.startedAt) >= thirtyDaysAgo
    );

    // Weekly average
    const weeklyAverage = sessions.length > 0 
      ? Math.round((sessions.length / 13) * 10) / 10
      : 0;

    // Consistency rate (days with workouts / 30 days)
    const workoutDays = new Set(
      recentSessions.map((s) => format(new Date(s.startedAt), "yyyy-MM-dd"))
    );
    const consistencyRate = Math.round((workoutDays.size / 30) * 100);

    // Current streak
    let currentStreak = 0;
    const sortedDates = Array.from(workoutDays).sort().reverse();
    const today = format(now, "yyyy-MM-dd");
    
    if (sortedDates.includes(today) || sortedDates.includes(format(subDays(now, 1), "yyyy-MM-dd"))) {
      let checkDate = sortedDates[0] === today ? now : subDays(now, 1);
      while (sortedDates.includes(format(checkDate, "yyyy-MM-dd"))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    // Total PRs
    const totalPRs = await prisma.personalRecord.count({
      where: { userId },
    });

    // Frequency data (last 30 days)
    const frequencyMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(now, i), "yyyy-MM-dd");
      frequencyMap.set(date, 0);
    }
    recentSessions.forEach((session) => {
      const date = format(new Date(session.startedAt), "yyyy-MM-dd");
      frequencyMap.set(date, (frequencyMap.get(date) || 0) + 1);
    });
    const frequencyData = Array.from(frequencyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Muscle group distribution
    const muscleGroupCount = new Map<string, number>();
    sessions.forEach((session) => {
      session.sets.forEach((set) => {
        if (set.exercise.muscleGroups) {
          const muscles = JSON.parse(set.exercise.muscleGroups);
          muscles.forEach((muscle: string) => {
            muscleGroupCount.set(
              muscle,
              (muscleGroupCount.get(muscle) || 0) + 1
            );
          });
        }
      });
    });
    const muscleGroupData = Array.from(muscleGroupCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Volume progression by week
    const weeklyVolume = new Map<number, number>();
    sessions.forEach((session) => {
      const weekNum = Math.floor(
        (now.getTime() - new Date(session.startedAt).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      const volume = session.sets.reduce(
        (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
        0
      );
      weeklyVolume.set(weekNum, (weeklyVolume.get(weekNum) || 0) + volume);
    });
    const volumeData = Array.from(weeklyVolume.entries())
      .map(([week, volume]) => ({ week: 13 - week, volume: Math.round(volume) }))
      .filter((d) => d.week > 0 && d.week <= 12)
      .sort((a, b) => a.week - b.week);

    // Day of week distribution
    const dayCount = new Map<string, number>();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayNames.forEach((day) => dayCount.set(day, 0));
    
    sessions.forEach((session) => {
      const dayNum = getDay(new Date(session.startedAt));
      const dayName = dayNames[dayNum];
      dayCount.set(dayName, (dayCount.get(dayName) || 0) + 1);
    });
    const dayDistribution = dayNames.map((day) => ({
      day,
      count: dayCount.get(day) || 0,
    }));

    // Top exercises
    const exerciseStats = new Map<
      string,
      { name: string; sessions: Set<string>; totalSets: number; totalVolume: number; totalWeight: number; weightCount: number }
    >();
    
    sessions.forEach((session) => {
      session.sets.forEach((set) => {
        if (!set.exercise) return;
        
        const key = set.exercise.id;
        if (!exerciseStats.has(key)) {
          exerciseStats.set(key, {
            name: set.exercise.name,
            sessions: new Set(),
            totalSets: 0,
            totalVolume: 0,
            totalWeight: 0,
            weightCount: 0,
          });
        }
        
        const stats = exerciseStats.get(key)!;
        stats.sessions.add(session.id);
        stats.totalSets++;
        if (set.weight && set.reps) {
          stats.totalVolume += set.weight * set.reps;
          stats.totalWeight += set.weight;
          stats.weightCount++;
        }
      });
    });

    const topExercises = Array.from(exerciseStats.values())
      .map((stat) => ({
        name: stat.name,
        sessions: stat.sessions.size,
        totalSets: stat.totalSets,
        totalVolume: Math.round(stat.totalVolume),
        avgWeight: stat.weightCount > 0 ? stat.totalWeight / stat.weightCount : 0,
      }))
      .sort((a, b) => b.totalSets - a.totalSets)
      .slice(0, 10);

    // Generate insights
    const insights: string[] = [];
    
    if (currentStreak >= 7) {
      insights.push(`Amazing! You're on a ${currentStreak}-day streak. Keep it going!`);
    } else if (currentStreak >= 3) {
      insights.push(`Great consistency with a ${currentStreak}-day streak!`);
    }

    if (weeklyAverage >= 4) {
      insights.push("You're crushing it with 4+ workouts per week!");
    } else if (weeklyAverage < 2) {
      insights.push("Try to aim for at least 3-4 workouts per week for optimal results.");
    }

    if (totalPRs > 0) {
      insights.push(`You've achieved ${totalPRs} personal records! Your hard work is paying off.`);
    }

    const topMuscle = muscleGroupData[0];
    if (topMuscle) {
      insights.push(`${topMuscle.name} is your most trained muscle group.`);
    }

    if (volumeData.length >= 2) {
      const recentVolume = volumeData[volumeData.length - 1].volume;
      const previousVolume = volumeData[volumeData.length - 2].volume;
      if (recentVolume > previousVolume * 1.1) {
        insights.push("Your training volume is increasing - excellent progressive overload!");
      }
    }

    if (insights.length === 0) {
      insights.push("Keep training consistently to unlock more insights!");
    }

    return NextResponse.json({
      weeklyAverage,
      consistencyRate,
      currentStreak,
      totalPRs,
      frequencyData,
      muscleGroupData,
      volumeData,
      dayDistribution,
      topExercises,
      insights,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
