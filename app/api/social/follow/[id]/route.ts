import { NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";
import { createNotification, Notifications } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getDevSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: id,
      },
    });

    // Notify the followed user
    const follower = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    if (follower?.name) {
      await createNotification(id, Notifications.socialFollow(follower.name, session.user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getDevSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}
