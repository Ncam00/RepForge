import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/auth";
import prisma from "@/lib/db";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportFormat = searchParams.get("format") || "json"; // json or csv
    const dataType = searchParams.get("type") || "all"; // all, workouts, weights, exercises

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

    // Handle CSV exports
    if (exportFormat === "csv") {
      let csvContent = "";
      const timestamp = format(new Date(), "yyyy-MM-dd");

      switch (dataType) {
        case "workouts": {
          // Export workout sessions as CSV
          csvContent = "Date,Name,Duration (min),Sets,Volume,Notes\n";
          for (const s of sessions) {
            const sessionVolume = s.sets.reduce((sum: number, set: any) => {
              return sum + ((set.weight || 0) * (set.reps || 0));
            }, 0);
            csvContent += `"${format(new Date(s.startedAt), "yyyy-MM-dd HH:mm")}","${s.name || 'Workout'}",${s.duration || 0},${s.sets.length},${sessionVolume},"${(s.notes || '').replace(/"/g, '""')}"\n`;
          }
          break;
        }

        case "sets": {
          // Export all sets with exercise details
          csvContent = "Date,Exercise,Set #,Weight,Reps,RPE,Rest (s),Warmup,Notes\n";
          for (const s of sessions) {
            for (const set of s.sets) {
              csvContent += `"${format(new Date(set.completedAt), "yyyy-MM-dd HH:mm")}","${set.exercise?.name || 'Unknown'}",${set.setNumber},${set.weight || 0},${set.reps || 0},${set.rpe || ''},${set.restTime || ''},${set.isWarmup},"${(set.notes || '').replace(/"/g, '""')}"\n`;
            }
          }
          break;
        }

        case "weights": {
          // Export weight entries
          csvContent = "Date,Weight,Unit,Body Fat %,Muscle Mass,Notes\n";
          for (const w of weights) {
            csvContent += `"${format(new Date(w.date), "yyyy-MM-dd")}",${w.weight},"${w.unit}",${w.bodyFat || ''},${w.muscleMass || ''},"${(w.notes || '').replace(/"/g, '""')}"\n`;
          }
          break;
        }

        case "exercises": {
          // Export custom exercises
          csvContent = "Name,Category,Muscle Groups,Equipment,Difficulty,Instructions\n";
          for (const e of exercises) {
            csvContent += `"${e.name}","${e.category || ''}","${e.muscleGroups}","${e.equipment || ''}","${e.difficulty || ''}","${(e.instructions || '').replace(/"/g, '""')}"\n`;
          }
          break;
        }

        case "prs": {
          // Export personal records
          csvContent = "Date,Exercise,Record Type,Value\n";
          for (const pr of prs) {
            csvContent += `"${format(new Date(pr.date), "yyyy-MM-dd")}","${pr.exercise?.name || 'Unknown'}","${pr.recordType}",${pr.value}\n`;
          }
          break;
        }

        default: {
          // Export everything - summary format
          csvContent = "RepForge Data Export\n\n";
          csvContent += `Export Date,${timestamp}\n`;
          csvContent += `Total Workouts,${totalWorkouts}\n`;
          csvContent += `Total Sets,${totalSets}\n`;
          csvContent += `Total Volume (lbs),${totalVolume}\n\n`;
          
          csvContent += "--- Weight History ---\n";
          csvContent += "Date,Weight,Unit\n";
          for (const w of weights.slice(0, 50)) {
            csvContent += `${format(new Date(w.date), "yyyy-MM-dd")},${w.weight},${w.unit}\n`;
          }
          
          csvContent += "\n--- Recent Workouts ---\n";
          csvContent += "Date,Name,Duration,Sets\n";
          for (const s of sessions.slice(0, 50)) {
            csvContent += `${format(new Date(s.startedAt), "yyyy-MM-dd")},${s.name || 'Workout'},${s.duration || 0},${s.sets.length}\n`;
          }
        }
      }

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="repforge-export-${dataType}-${timestamp}.csv"`
        }
      });
    }

    // JSON export
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
      exercises,
      personalRecords: prs,
    };

    // For specific data type, return filtered data
    if (dataType !== "all") {
      const filteredData: Record<string, any> = {
        exportDate: exportData.exportDate,
        user: exportData.user
      };

      switch (dataType) {
        case "workouts":
          filteredData.sessions = sessions;
          break;
        case "weights":
          filteredData.weights = weights;
          break;
        case "exercises":
          filteredData.exercises = exercises;
          break;
        case "prs":
          filteredData.personalRecords = prs;
          break;
        case "sets":
          filteredData.sets = sessions.flatMap((s: any) => s.sets);
          break;
      }

      return NextResponse.json(filteredData);
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
