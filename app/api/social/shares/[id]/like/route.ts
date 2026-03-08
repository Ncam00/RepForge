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

    await prisma.like.create({
      data: {
        userId: session.user.id,
        shareId: id,
      },
    });

    const updatedShare = await prisma.workoutShare.update({
      where: { id },
      data: { likes: { increment: 1 } },
      select: { userId: true, caption: true },
    });

    // Don't notify yourself
    if (updatedShare.userId !== session.user.id) {
      const liker = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });
      if (liker?.name) {
        await createNotification(
          updatedShare.userId,
          Notifications.socialLike(liker.name, updatedShare.caption || "workout", id)
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed to like" }, { status: 500 });
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

    await prisma.like.deleteMany({
      where: {
        userId: session.user.id,
        shareId: id,
      },
    });

    await prisma.workoutShare.update({
      where: { id },
      data: { likes: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlike error:", error);
    return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
  }
}
