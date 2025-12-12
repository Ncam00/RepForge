import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { subDays, startOfDay, eachDayOfInterval } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    // Get all completed workouts in the time period
    const workouts = await prisma.workoutSession.findMany({
      where: {
        userId: session.user.id,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        sets: {
          where: {
            isWarmup: false,
          },
        },
      },
      orderBy: {
        completedAt: "asc",
      },
    });

    // Group by date and calculate volume
    const volumeByDate = workouts.reduce((acc, workout) => {
      const date = startOfDay(workout.completedAt!).toISOString();
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalVolume: 0,
          workoutCount: 0,
        };
      }

      const volume = workout.sets.reduce((sum, set) => {
        return sum + (set.weight || 0) * (set.reps || 0);
      }, 0);

      acc[date].totalVolume += volume;
      acc[date].workoutCount += 1;

      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(volumeByDate);

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error("Error fetching volume data:", error);
    return NextResponse.json(
      { error: "Failed to fetch volume data" },
      { status: 500 }
    );
  }
}
