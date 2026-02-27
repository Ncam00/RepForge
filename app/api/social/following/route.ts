import { NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getDevSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followRecords = await prisma.follow.findMany({
      where: { followerId: session.user.id },
    });

    const followingWithStats = await Promise.all(
      followRecords.map(async (f) => {
        const [user, followerCount, workoutCount] = await Promise.all([
          prisma.user.findUnique({ where: { id: f.followingId }, select: { id: true, name: true } }),
          prisma.follow.count({ where: { followingId: f.followingId } }),
          prisma.workoutSession.count({ where: { userId: f.followingId } }),
        ]);

        return {
          id: f.followingId,
          name: user?.name,
          workoutCount,
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
