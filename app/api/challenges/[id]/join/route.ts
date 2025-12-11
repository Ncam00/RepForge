import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { awardXP } from "@/lib/xp";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challengeId = params.id;

    // Check if challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.status !== "active") {
      return NextResponse.json(
        { error: "Challenge is not active" },
        { status: 400 }
      );
    }

    // Check if already joined
    const existingParticipation = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: session.user.id,
        },
      },
    });

    if (existingParticipation) {
      return NextResponse.json(
        { error: "Already joined this challenge" },
        { status: 400 }
      );
    }

    // Check max participants
    if (
      challenge.maxParticipants &&
      challenge._count.participants >= challenge.maxParticipants
    ) {
      return NextResponse.json(
        { error: "Challenge is full" },
        { status: 400 }
      );
    }

    // Join challenge
    const participant = await prisma.challengeParticipant.create({
      data: {
        challengeId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    console.error("Challenge join error:", error);
    return NextResponse.json(
      { error: "Failed to join challenge" },
      { status: 500 }
    );
  }
}
