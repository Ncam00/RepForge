import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

// GET user settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Return settings or defaults
    return NextResponse.json({
      name: session.user.name || "",
      email: session.user.email || "",
      weightUnit: settings?.weightUnit || "lbs",
      theme: settings?.theme || "light",
      notifications: settings?.notifications ?? true,
      restTimerSound: settings?.restTimerSound ?? true,
      autoStartTimer: settings?.autoStartTimer ?? true,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// UPDATE user settings
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      weightUnit,
      theme,
      notifications,
      restTimerSound,
      autoStartTimer,
    } = body;

    // Update user name if provided
    if (name && name !== session.user.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      });
    }

    // Upsert settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        weightUnit,
        theme,
        notifications,
        restTimerSound,
        autoStartTimer,
      },
      create: {
        userId: session.user.id,
        weightUnit,
        theme,
        notifications,
        restTimerSound,
        autoStartTimer,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
