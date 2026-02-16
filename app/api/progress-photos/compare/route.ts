import { NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "front";

    // Get the oldest photo in this category
    const oldestPhoto = await prisma.progressPhoto.findFirst({
      where: {
        userId: session.user.id,
        category,
      },
      orderBy: { date: "asc" },
    });

    // Get the newest photo in this category
    const newestPhoto = await prisma.progressPhoto.findFirst({
      where: {
        userId: session.user.id,
        category,
      },
      orderBy: { date: "desc" },
    });

    // Get all photos for timeline selection
    const allPhotos = await prisma.progressPhoto.findMany({
      where: {
        userId: session.user.id,
        category,
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        imageData: true,
      },
    });

    // Get photo counts by category
    const categoryCounts = await prisma.progressPhoto.groupBy({
      by: ["category"],
      where: { userId: session.user.id },
      _count: { category: true },
    });

    const counts = {
      front: 0,
      side: 0,
      back: 0,
      total: 0,
    };

    categoryCounts.forEach((c: { category: string; _count: { category: number } }) => {
      counts[c.category as keyof typeof counts] = c._count.category;
      counts.total += c._count.category;
    });

    return NextResponse.json({
      before: oldestPhoto,
      after: newestPhoto,
      timeline: allPhotos,
      counts,
      hasSufficientPhotos: allPhotos.length >= 2,
    });
  } catch (error) {
    console.error("Failed to fetch comparison data:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparison data" },
      { status: 500 }
    );
  }
}
