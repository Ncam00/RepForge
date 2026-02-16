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
    const category = searchParams.get("category"); // front, side, back, or all
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: { userId: string; category?: string } = {
      userId: session.user.id,
    };

    if (category && category !== "all") {
      where.category = category;
    }

    const photos = await prisma.progressPhoto.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      select: {
        id: true,
        category: true,
        date: true,
        notes: true,
        weightId: true,
        imageData: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Failed to fetch progress photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress photos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { imageData, category, notes, date, weightId } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["front", "side", "back"];
    const photoCategory = validCategories.includes(category) ? category : "front";

    const photo = await prisma.progressPhoto.create({
      data: {
        userId: session.user.id,
        imageData,
        category: photoCategory,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
        weightId: weightId || null,
      },
    });

    return NextResponse.json({
      photo: {
        id: photo.id,
        category: photo.category,
        date: photo.date,
        notes: photo.notes,
        createdAt: photo.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to upload progress photo:", error);
    return NextResponse.json(
      { error: "Failed to upload progress photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("id");

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const photo = await prisma.progressPhoto.findFirst({
      where: {
        id: photoId,
        userId: session.user.id,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    await prisma.progressPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete progress photo:", error);
    return NextResponse.json(
      { error: "Failed to delete progress photo" },
      { status: 500 }
    );
  }
}
