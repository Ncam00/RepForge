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
    await prisma.like.create({
      data: {
        userId: session.user.id,
        shareId: id,
      },
    });
    await prisma.workoutShare.update({
      where: { id },
      data: { likes: { increment: 1 } },
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed to like" }, { status: 500 });
  }
}
export async function DELETE(
    await prisma.like.deleteMany({
      where: {
      data: { likes: { decrement: 1 } },
    console.error("Unlike error:", error);
    return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
