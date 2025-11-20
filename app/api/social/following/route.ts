import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                sessions: true,
              },
            },
          },
        },
      },
    });

    const followingWithStats = await Promise.all(
      following.map(async (f: any) => {
        const followerCount = await prisma.follow.count({
          where: { followingId: f.followingId },
        });

        return {
          id: f.followingId,
          name: f.following.name,
          workoutCount: f.following._count.sessions,
          followers: followerCount,
        };
      })
    );

    return NextResponse.json({ users: followingWithStats });
  } catch (error) {
    console.error("Following fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
