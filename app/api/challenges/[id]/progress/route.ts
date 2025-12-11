import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { awardXP } from "@/lib/xp";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challengeId = params.id;
    const body = await request.json();
    const { progress } = body;

    if (typeof progress !== "number" || progress < 0) {
      return NextResponse.json(
        { error: "Invalid progress value" },
        { status: 400 }
      );
    }

    // Get challenge and participation
    const [challenge, participation] = await Promise.all([
      prisma.challenge.findUnique({
        where: { id: challengeId },
      }),
      prisma.challengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId: session.user.id,
          },
        },
      }),
    ]);

    if (!challenge || !participation) {
      return NextResponse.json(
        { error: "Challenge or participation not found" },
        { status: 404 }
      );
    }

    // Update progress
    const updatedParticipation = await prisma.challengeParticipant.update({
      where: {
        challengeId_userId: {
          challengeId,
          userId: session.user.id,
        },
      },
      data: {
        progress,
        status:
          progress >= challenge.target
            ? "completed"
            : participation.status === "failed"
            ? "failed"
            : "in_progress",
        completedAt:
          progress >= challenge.target && !participation.completedAt
            ? new Date()
            : participation.completedAt,
      },
    });

    // Award XP if just completed
    if (
      progress >= challenge.target &&
      participation.status !== "completed"
    ) {
      await awardXP({
        userId: session.user.id,
        amount: challenge.xpReward,
        reason: `Completed challenge: ${challenge.title}`,
        source: "challenge_complete",
      });
    }

    return NextResponse.json({ participation: updatedParticipation });
  } catch (error) {
    console.error("Challenge progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
