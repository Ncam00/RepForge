import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    // Search users by name (exclude current user)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        settings: {
          select: {
            profileVisibility: true,
            allowFriendRequests: true,
          },
        },
      take: 20,
    });
    // Check if current user is following each result
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        // Respect privacy settings
        if (user.settings?.profileVisibility === "private") {
          return null;
        }
        const [followStatus, workoutCount, followerCount] = await Promise.all([
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: session.user.id,
                followingId: user.id,
              },
            },
          }),
          prisma.workoutSession.count({
            where: { 
              userId: user.id,
              completedAt: { not: null }
          prisma.follow.count({
            where: { followingId: user.id },
        ]);
        return {
          id: user.id,
          name: user.name,
          isFollowing: !!followStatus,
          workoutCount,
          followers: followerCount,
          allowFriendRequests: user.settings?.allowFriendRequests ?? true,
        };
      })
    );
    return NextResponse.json({
      users: usersWithFollowStatus.filter((u) => u !== null),
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
  }
}
