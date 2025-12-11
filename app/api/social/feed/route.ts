import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get users that the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Get workout shares from followed users and own shares
    // Respect privacy settings
    const shares = await prisma.workoutShare.findMany({
      where: {
        OR: [
          { userId: { in: followingIds }, isPublic: true },
          { userId: session.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        userId: true,
        sessionId: true,
        caption: true,
        likes: true,
        createdAt: true,
      },
    });

    // Get session and user data for each share
    const sharesWithData = await Promise.all(
      shares.map(async (share) => {
        const [workoutSession, user, liked, commentCount] = await Promise.all([
          prisma.workoutSession.findUnique({
            where: { id: share.sessionId },
            include: {
              sets: {
                select: {
                  weight: true,
                  reps: true,
                },
              },
            },
          }),
          prisma.user.findUnique({
            where: { id: share.userId },
            select: { id: true, name: true },
          }),
          prisma.like.findUnique({
            where: {
              userId_shareId: {
                userId: session.user.id,
                shareId: share.id,
              },
            },
          }),
          prisma.comment.count({
            where: { shareId: share.id },
          }),
        ]);

        if (!workoutSession || !user) return null;

        const totalVolume = workoutSession.sets.reduce(
          (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
          0
        );

        return {
          id: share.id,
          caption: share.caption,
          createdAt: share.createdAt,
          likes: share.likes,
          comments: commentCount,
          isLiked: !!liked,
          userName: user.name,
          userId: user.id,
          sessionName: workoutSession.name,
          duration: workoutSession.duration,
          totalSets: workoutSession.sets.length,
          totalVolume,
        };
      })
    );

    return NextResponse.json({
      shares: sharesWithData.filter((s) => s !== null),
    });
  } catch (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
