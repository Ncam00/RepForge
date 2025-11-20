import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Define available achievements
const ALL_ACHIEVEMENTS = [
  { type: "first_workout", title: "First Step", description: "Complete your first workout", icon: "🎯" },
  { type: "10_workouts", title: "Getting Started", description: "Complete 10 workouts", icon: "💪" },
  { type: "50_workouts", title: "Dedicated", description: "Complete 50 workouts", icon: "🔥" },
  { type: "100_workouts", title: "Century Club", description: "Complete 100 workouts", icon: "💯" },
  { type: "streak_7", title: "Week Warrior", description: "7 day workout streak", icon: "⚡" },
  { type: "streak_30", title: "Monthly Master", description: "30 day workout streak", icon: "👑" },
  { type: "pr_set", title: "Record Breaker", description: "Set a personal record", icon: "🏆" },
  { type: "total_volume_100k", title: "Heavy Lifter", description: "Lift 100,000 lbs total volume", icon: "🏋️" },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's unlocked achievements
    const unlocked = await prisma.achievement.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: "desc" },
    });

    const unlockedTypes = new Set(unlocked.map((a) => a.type));
    const locked = ALL_ACHIEVEMENTS.filter((a) => !unlockedTypes.has(a.type));

    return NextResponse.json({ unlocked, locked });
  } catch (error) {
    console.error("Achievements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}
