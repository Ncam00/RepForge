import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";

/**
 * GET /api/suggestions/exercises
 *
 * Query params:
 *   muscleGroup  - target muscle group (e.g. "Chest", "Back")
 *   difficulty   - "beginner" | "intermediate" | "advanced" (optional)
 *   equipment    - equipment filter (optional)
 *   limit        - max results (default 10, max 30)
 *   exclude      - comma-separated exercise IDs to exclude (already in session)
 *
 * Returns a ranked list of exercises based on:
 *  1. Muscle group match
 *  2. How often the user has done them (variety encouragement)
 *  3. Exercises they haven't tried recently (freshness bonus)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const muscleGroup = searchParams.get("muscleGroup");
    const difficulty = searchParams.get("difficulty");
    const equipment = searchParams.get("equipment");
    const limitParam = parseInt(searchParams.get("limit") || "10");
    const limit = Math.min(Math.max(1, limitParam), 30);
    const excludeParam = searchParams.get("exclude");
    const excludeIds = excludeParam ? excludeParam.split(",").filter(Boolean) : [];

    // Fetch all accessible exercises
    const allExercises = await prisma.exercise.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        ...(difficulty ? { difficulty } : {}),
        ...(equipment ? { equipment } : {}),
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
      select: {
        id: true,
        name: true,
        muscleGroups: true,
        equipment: true,
        difficulty: true,
        description: true,
      },
    });

    // Get recent exercise usage counts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsage = await prisma.exerciseSet.groupBy({
      by: ["exerciseId"],
      where: {
        session: {
          userId,
          startedAt: { gte: thirtyDaysAgo },
        },
      },
      _count: { exerciseId: true },
    });

    const usageMap = new Map<string, number>();
    recentUsage.forEach((u) => usageMap.set(u.exerciseId, u._count.exerciseId));

    // Get favorites
    const favorites = await prisma.exercise.findMany({
      where: { userId, isFavorite: true },
      select: { id: true },
    });
    const favoriteSet = new Set(favorites.map((f) => f.id));

    // Parse and score exercises
    const scored = allExercises
      .map((ex) => {
        let muscles: string[];
        try {
          muscles = ex.muscleGroups ? JSON.parse(ex.muscleGroups) : [];
        } catch {
          muscles = [];
        }

        // Base score: muscle group match
        let score = 0;
        if (muscleGroup) {
          const matchesPrimary = muscles.some(
            (m) => m.toLowerCase() === muscleGroup.toLowerCase()
          );
          const matchesSecondary = muscles.some(
            (m) => m.toLowerCase().includes(muscleGroup.toLowerCase())
          );
          if (matchesPrimary) score += 10;
          else if (matchesSecondary) score += 5;
          else return null; // Skip if no match when filter specified
        }

        // Recency bonus: exercises NOT done recently get a bonus (encourage variety)
        const usageCount = usageMap.get(ex.id) || 0;
        if (usageCount === 0) score += 3; // Fresh/untried exercise
        else if (usageCount < 3) score += 1; // Rarely done

        // Favorite bonus
        if (favoriteSet.has(ex.id)) score += 2;

        // Difficulty weighting (slight preference for intermediate if no filter)
        if (!difficulty) {
          if (ex.difficulty === "intermediate") score += 1;
        }

        return { ...ex, muscles, usageCount, isFavorite: favoriteSet.has(ex.id), score };
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        muscleGroups: string;
        muscles: string[];
        equipment: string | null;
        difficulty: string | null;
        description: string | null;
        usageCount: number;
        isFavorite: boolean;
        score: number;
      }>;

    // Sort by score descending, then alphabetically for ties
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    const results = scored.slice(0, limit).map(({ id, name, muscles, equipment, difficulty, description, usageCount, isFavorite }) => ({
      id,
      name,
      muscleGroups: muscles,
      equipment,
      difficulty,
      description,
      usageCount,     // how many sets done in last 30 days
      isFavorite,
    }));

    return NextResponse.json({
      exercises: results,
      total: scored.length,
      filters: { muscleGroup, difficulty, equipment },
    });
  } catch (error) {
    console.error("Error fetching exercise suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise suggestions" },
      { status: 500 }
    );
  }
}
