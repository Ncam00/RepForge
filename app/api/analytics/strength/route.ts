import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exerciseId");
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = subDays(new Date(), days);

    // Get all sets for the exercise in the time period
    const sets = await prisma.exerciseSet.findMany({
      where: {
        exerciseId,
        session: {
          userId: session.user.id,
          completedAt: {
            gte: startDate,
          },
        },
        isWarmup: false,
      },
      include: {
        session: {
          select: {
            completedAt: true,
          },
        },
      },
      orderBy: {
        completedAt: "asc",
      },
    });

    //Group by date and calculate metrics
    const dataByDate = sets.reduce((acc, set) => {
      const date = startOfDay(set.session.completedAt!).toISOString();
      
      if (!acc[date]) {
        acc[date] = {
          date,
          maxWeight: 0,
          totalVolume: 0,
          totalReps: 0,
          setCount: 0,
        };
      }

      const weight = set.weight || 0;
      const reps = set.reps || 0;
      
      acc[date].maxWeight = Math.max(acc[date].maxWeight, weight);
      acc[date].totalVolume += weight * reps;
      acc[date].totalReps += reps;
      acc[date].setCount += 1;

      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(dataByDate);

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error("Error fetching strength data:", error);
    return NextResponse.json(
      { error: "Failed to fetch strength data" },
      { status: 500 }
    );
  }
}
