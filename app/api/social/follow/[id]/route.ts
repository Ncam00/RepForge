import { NextResponse } from "next/server";

import { auth } from "@/auth";
import prisma from "@/lib/db";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}
export async function DELETE(
    await prisma.follow.deleteMany({
      where: {
    console.error("Unfollow error:", error);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
