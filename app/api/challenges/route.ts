import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

// GET all active challenges
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { isPublic: true },
          { creatorId: session.user.id },
        ],
        status: "active",
      },
      orderBy: { createdAt: "desc" },
      include: {
        participants: {
          select: {
            userId: true,
            status: true,
            progress: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    const challengesWithDetails = await Promise.all(
      challenges.map(async (challenge) => {
        const creator = await prisma.user.findUnique({
          where: { id: challenge.creatorId },
          select: { name: true },
        });

        const userParticipation = challenge.participants.find(
          (p) => p.userId === session.user.id
        );

        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          category: challenge.category,
          target: challenge.target,
          xpReward: challenge.xpReward,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          creatorName: creator?.name || "Unknown",
          isCreator: challenge.creatorId === session.user.id,
          participantCount: challenge._count.participants,
          maxParticipants: challenge.maxParticipants,
          isJoined: !!userParticipation,
          userProgress: userParticipation?.progress || 0,
          userStatus: userParticipation?.status || null,
        };
      })
    );

    return NextResponse.json({ challenges: challengesWithDetails });
  } catch (error) {
    console.error("Challenges fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}

// POST - Create new challenge
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      category,
      target,
      xpReward,
      isPublic,
      maxParticipants,
      endDate,
    } = body;

    if (!title || !category || !target) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.create({
      data: {
        creatorId: session.user.id,
        title,
        description: description || "",
        type: type || "custom",
        category,
        target,
        xpReward: xpReward || target * 10,
        isPublic: isPublic ?? false,
        maxParticipants: maxParticipants || null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    // Automatically join creator to the challenge
    await prisma.challengeParticipant.create({
      data: {
        challengeId: challenge.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error("Challenge creation error:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}
