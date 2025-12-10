import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { getXpProgress, getLevelBadge } from "@/lib/xp";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user progress
    let progress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      progress = await prisma.userProgress.create({
        data: {
          userId: session.user.id,
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalXpEarned: 0,
        },
      });
    }

    // Calculate progress details
    const xpDetails = getXpProgress(progress.xp);
    const badge = getLevelBadge(xpDetails.currentLevel);

    // Get recent XP transactions
    const recentXp = await prisma.xpTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      ...progress,
      ...xpDetails,
      badge,
      recentTransactions: recentXp,
    });
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// Award XP to user
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, reason, source } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid XP amount" }, { status: 400 });
    }

    // Get or create user progress
    let progress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      progress = await prisma.userProgress.create({
        data: {
          userId: session.user.id,
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalXpEarned: 0,
        },
      });
    }

    const oldLevel = progress.level;
    const newXp = progress.xp + amount;
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
    const leveledUp = newLevel > oldLevel;

    // Update progress
    const updatedProgress = await prisma.userProgress.update({
      where: { userId: session.user.id },
      data: {
        xp: newXp,
        level: newLevel,
        totalXpEarned: { increment: amount },
      },
    });

    // Record XP transaction
    await prisma.xpTransaction.create({
      data: {
        userId: session.user.id,
        amount,
        reason: reason || "XP earned",
        source: source || "manual",
      },
    });

    const xpDetails = getXpProgress(updatedProgress.xp);
    const badge = getLevelBadge(xpDetails.currentLevel);

    return NextResponse.json({
      ...updatedProgress,
      ...xpDetails,
      badge,
      leveledUp,
      oldLevel,
      newLevel,
    });
  } catch (error) {
    console.error("XP award error:", error);
    return NextResponse.json({ error: "Failed to award XP" }, { status: 500 });
  }
}
