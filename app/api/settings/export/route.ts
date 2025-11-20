import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user data
    const [
      user,
      settings,
      weights,
      splits,
      sessions,
      exercises,
      prs,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.userSettings.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.weight.findMany({
        where: { userId: session.user.id },
        orderBy: { date: "asc" },
      }),
      prisma.workoutSplit.findMany({
        where: { userId: session.user.id },
        include: {
          days: {
            include: {
              exercises: {
                include: {
                  exercise: true,
                },
              },
            },
          },
        },
      }),
      prisma.workoutSession.findMany({
        where: { userId: session.user.id },
        include: {
          sets: {
            include: {
              exercise: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
      }),
      prisma.exercise.findMany({
        where: { userId: session.user.id },
      }),
      prisma.personalRecord.findMany({
        where: { userId: session.user.id },
        include: {
          exercise: true,
        },
        orderBy: { date: "desc" },
      }),
    ]);

    // Calculate some stats
    const totalWorkouts = sessions.length;
    const totalSets = sessions.reduce(
      (sum: number, s: any) => sum + s.sets.length,
      0
    );
    const totalVolume = sessions.reduce(
      (sum: number, s: any) =>
        sum +
        s.sets.reduce((setSum: number, set: any) => {
          const weight = set.weight || 0;
          const reps = set.reps || 0;
          return setSum + weight * reps;
        }, 0),
      0
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        ...user,
        totalWorkouts,
        totalSets,
        totalVolume,
      },
      settings,
      weights,
      splits,
      sessions,
      exercises, // User's custom exercises
      personalRecords: prs,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
