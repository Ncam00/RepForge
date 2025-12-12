import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { subDays, eachDayOfInterval, format, startOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "90");

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
      select: {
        completedAt: true,
      },
    });

    // Create a map of all dates in the range
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    
    const workoutsByDate = workouts.reduce((acc, workout) => {
      const date = format(startOfDay(workout.completedAt!), "yyyy-MM-dd");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const heatmapData = allDates.map((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      return {
        date: dateKey,
        count: workoutsByDate[dateKey] || 0,
      };
    });

    return NextResponse.json({ data: heatmapData });
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return NextResponse.json(
      { error: "Failed to fetch heatmap data" },
      { status: 500 }
    );
  }
}
