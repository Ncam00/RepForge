import { NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";

interface OverloadSuggestion {
  recommendedWeight: number;
  recommendedReps: number;
  confidence: "high" | "medium" | "low";
  reason: string;
  trend: "increasing" | "maintaining" | "decreasing" | "new";
  lastPerformance: {
    weight: number;
    reps: number;
    date: string;
  } | null;
  estimated1RM: number | null;
  progressPercentage: number | null; // % improvement from first to last session
}

// Epley formula for 1RM estimation
function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: exerciseId } = await params;

    // Get recent working sets for this exercise (last 30 days, non-warmup)
    const recentSets = await prisma.exerciseSet.findMany({
      where: {
        exerciseId,
        session: {
          userId: session.user.id,
        },
        isWarmup: false,
        weight: { not: null },
        reps: { not: null },
      },
      include: {
        session: {
          select: {
            startedAt: true,
            id: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
      take: 50, // Get last 50 sets
    });

    // If no history, return new exercise suggestion
    if (recentSets.length === 0) {
      return NextResponse.json<{ suggestion: OverloadSuggestion }>({
        suggestion: {
          recommendedWeight: 0,
          recommendedReps: 8,
          confidence: "low",
          reason: "No previous data - start with a comfortable weight for 8-12 reps",
          trend: "new",
          lastPerformance: null,
          estimated1RM: null,
          progressPercentage: null,
        },
      });
    }

    // Group sets by session to analyze session-level performance
    const sessionMap = new Map<string, {
      date: Date;
      sets: Array<{ weight: number; reps: number; rpe: number | null }>;
    }>();

    recentSets.forEach((set) => {
      const sessionId = set.session.id;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          date: set.session.startedAt,
          sets: [],
        });
      }
      sessionMap.get(sessionId)!.sets.push({
        weight: set.weight!,
        reps: set.reps!,
        rpe: set.rpe,
      });
    });

    // Convert to array and sort by date (oldest first for trend analysis)
    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Get best set per session (highest estimated 1RM)
    const sessionBests = sessions.map((s) => {
      const bestSet = s.sets.reduce((best, set) => {
        const current1RM = calculate1RM(set.weight, set.reps);
        const best1RM = calculate1RM(best.weight, best.reps);
        return current1RM > best1RM ? set : best;
      }, s.sets[0]);

      return {
        date: s.date,
        weight: bestSet.weight,
        reps: bestSet.reps,
        rpe: bestSet.rpe,
        estimated1RM: calculate1RM(bestSet.weight, bestSet.reps),
      };
    });

    const lastSession = sessionBests[sessionBests.length - 1];

    // Calculate trend
    let trend: OverloadSuggestion["trend"] = "maintaining";
    let progressPercentage: number | null = null;

    if (sessionBests.length >= 2) {
      const first1RM = sessionBests[0].estimated1RM;
      const last1RM = lastSession.estimated1RM;
      progressPercentage = Math.round(((last1RM - first1RM) / first1RM) * 100);

      // Compare last 3 sessions average to previous 3
      if (sessionBests.length >= 4) {
        const recent3 = sessionBests.slice(-3);
        const previous3 = sessionBests.slice(-6, -3);
        
        if (previous3.length > 0) {
          const recentAvg1RM = recent3.reduce((sum, s) => sum + s.estimated1RM, 0) / recent3.length;
          const previousAvg1RM = previous3.reduce((sum, s) => sum + s.estimated1RM, 0) / previous3.length;
          
          if (recentAvg1RM > previousAvg1RM * 1.02) {
            trend = "increasing";
          } else if (recentAvg1RM < previousAvg1RM * 0.98) {
            trend = "decreasing";
          }
        }
      } else if (last1RM > sessionBests[0].estimated1RM) {
        trend = "increasing";
      }
    }

    // Determine recommendation based on last performance
    let recommendedWeight = lastSession.weight;
    let recommendedReps = lastSession.reps;
    let confidence: OverloadSuggestion["confidence"] = "medium";
    let reason: string;

    const lastRPE = lastSession.rpe;

    // Progressive overload logic
    if (lastRPE !== null && lastRPE <= 7) {
      // Easy sets - suggest weight increase
      const weightIncrease = lastSession.weight < 50 ? 2.5 : 5; // Smaller increments for lighter weights
      recommendedWeight = Math.round((lastSession.weight + weightIncrease) * 2) / 2; // Round to nearest 0.5
      recommendedReps = Math.max(lastSession.reps - 2, 6); // Drop reps slightly
      confidence = "high";
      reason = `RPE ${lastRPE} was low - increase weight by ${weightIncrease}kg and aim for ${recommendedReps}+ reps`;
    } else if (lastRPE !== null && lastRPE >= 9) {
      // Very hard - maintain or slight deload
      recommendedWeight = lastSession.weight;
      recommendedReps = lastSession.reps;
      confidence = "medium";
      reason = `RPE ${lastRPE} was high - maintain current weight and focus on form`;
    } else if (lastSession.reps >= 12) {
      // Hit high rep target - time to increase weight
      const weightIncrease = lastSession.weight < 50 ? 2.5 : 5;
      recommendedWeight = Math.round((lastSession.weight + weightIncrease) * 2) / 2;
      recommendedReps = 8;
      confidence = "high";
      reason = `Hit ${lastSession.reps} reps - increase weight and target 8-10 reps`;
    } else if (lastSession.reps < 6) {
      // Reps too low - might be too heavy
      recommendedWeight = lastSession.weight;
      recommendedReps = lastSession.reps + 1;
      confidence = "medium";
      reason = `Low reps (${lastSession.reps}) - try to add 1 rep before increasing weight`;
    } else {
      // Normal progression - try to add a rep
      recommendedWeight = lastSession.weight;
      recommendedReps = Math.min(lastSession.reps + 1, 12);
      confidence = "high";
      reason = `Solid performance - aim for ${recommendedReps} reps at ${recommendedWeight}kg`;
    }

    // Adjust confidence based on data consistency
    if (sessionBests.length < 3) {
      confidence = "low";
      reason += " (limited history)";
    } else if (trend === "decreasing") {
      confidence = "medium";
      reason = `Performance trending down - consider a deload week or maintain ${lastSession.weight}kg × ${lastSession.reps}`;
    }

    const suggestion: OverloadSuggestion = {
      recommendedWeight,
      recommendedReps,
      confidence,
      reason,
      trend,
      lastPerformance: {
        weight: lastSession.weight,
        reps: lastSession.reps,
        date: lastSession.date.toISOString(),
      },
      estimated1RM: lastSession.estimated1RM,
      progressPercentage,
    };

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Failed to generate suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
