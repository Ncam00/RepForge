import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const users = await Promise.all(
      following.map(async (f) => {
        const [user, workoutCount, followerCount] = await Promise.all([
          prisma.user.findUnique({
            where: { id: f.followingId },
            select: { id: true, name: true },
          }),
          prisma.workoutSession.count({
            where: { 
              userId: f.followingId,
              completedAt: { not: null }
            },
          }),
          prisma.follow.count({
            where: { followingId: f.followingId },
          }),
        ]);

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          workoutCount,
          followers: followerCount,
        };
      })
    );

    return NextResponse.json({ users: users.filter(u => u !== null) });
  } catch (error) {
    console.error("Following fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
