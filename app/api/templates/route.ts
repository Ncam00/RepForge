import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";
import { z } from "zod";

const templateExerciseSchema = z.object({
  exerciseId: z.string().min(1, { message: "exerciseId is required" }),
  order: z.number().int().min(0).optional().default(0),
  sets: z.number().int().min(1, { message: "sets must be at least 1" }).optional().default(3),
  reps: z.string().min(1, { message: "reps is required" }).optional().default("8-12"),
  restTime: z.number().int().min(0).optional().default(90),
  notes: z.string().optional().default(""),
})

const templateSchema = z.object({
  name: z.string().trim().min(1, { message: "Template name is required" }),
  description: z.string().optional(),
  category: z.string().optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration: z.number().int().min(1).optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  exercises: z.array(templateExerciseSchema).min(1, { message: "At least one exercise is required" }),
})

// GET templates
export async function GET(req: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const showPublic = searchParams.get("public") === "true";
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : undefined;

    // Build filter
    const where = showPublic
      ? {
          isPublic: true,
          ...(search ? { name: { contains: search } } : {}),
          ...(category ? { category } : {}),
          ...(difficulty ? { difficulty } : {}),
        }
      : {
          userId: session.user.id,
          ...(search ? { name: { contains: search } } : {}),
          ...(category ? { category } : {}),
          ...(difficulty ? { difficulty } : {}),
        };

    const templates = await prisma.workoutTemplate.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
      ...(limit ? { take: limit } : {}),
    });

    // For public templates, count how many the current user already has copied
    const userTemplateIds = showPublic
      ? new Set(
          (
            await prisma.workoutTemplate.findMany({
              where: { userId: session.user.id },
              select: { name: true },
            })
          ).map((t) => t.name)
        )
      : null;

    const result = templates.map((t) => ({
      ...t,
      isSaved: userTemplateIds
        ? userTemplateIds.has(t.name) || userTemplateIds.has(`${t.name} (Copy)`)
        : undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// CREATE template
export async function POST(req: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let data;
    try {
      data = templateSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: err.errors }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, description, category, difficulty, duration, exercises, isPublic } = data;

    const template = await prisma.workoutTemplate.create({
      data: {
        userId: session.user.id,
        name,
        description,
        category,
        difficulty,
        duration,
        isPublic: isPublic ?? false,
        exercises: {
          create: exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            sets: ex.sets,
            reps: ex.reps,
            restTime: ex.restTime,
            notes: ex.notes,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
