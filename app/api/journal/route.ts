import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

// GET journal entries
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await prisma.journalEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

// CREATE journal entry
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, mood, energyLevel, sleepQuality, bodyWeight, notes } = body;

    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        title,
        content,
        mood,
        energyLevel,
        sleepQuality,
        bodyWeight,
        notes,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}
