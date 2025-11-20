import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // Format: "yyyy-MM"

    if (!monthParam) {
      return NextResponse.json({ error: "Month parameter required" }, { status: 400 });
    }

    const [year, month] = monthParam.split("-").map(Number);
    const targetDate = new Date(year, month - 1, 1);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Fetch all workouts for the month
    const workouts = await prisma.workoutSession.findMany({
      where: {
        userId: session.user.id,
        startedAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        sets: {
          select: {
            id: true,
            weight: true,
            reps: true,
          },
        },
      },
      orderBy: {
        startedAt: "asc",
      },
    });

    // Calculate month stats
    const totalWorkouts = workouts.length;
    const completedWorkouts = workouts.filter((w) => w.completedAt).length;
    const completionRate =
      totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

    const totalVolume = workouts.reduce(
      (sum, workout) =>
        sum +
        workout.sets.reduce(
          (setSum, set) => setSum + (set.weight || 0) * (set.reps || 0),
          0
        ),
      0
    );

    const activeDays = new Set(
      workouts.map((w) => w.startedAt.toISOString().split("T")[0])
    ).size;

    return NextResponse.json({
      workouts,
      monthStats: {
        totalWorkouts,
        completedWorkouts,
        completionRate,
        totalVolume: Math.round(totalVolume),
        activeDays,
      },
    });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}
