import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

// Start workout from template
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { templateId } = body;

    // Fetch template with exercises
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Create a new workout session
    const session_data = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        name: template.name,
        notes: `Started from template: ${template.name}`,
      },
    });

    return NextResponse.json({
      sessionId: session_data.id,
      template,
    });
  } catch (error) {
    console.error("Error starting workout from template:", error);
    return NextResponse.json(
      { error: "Failed to start workout" },
      { status: 500 }
    );
  }
}
