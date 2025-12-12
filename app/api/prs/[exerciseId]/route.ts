import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ exerciseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { exerciseId } = await context.params;

    const prs = await prisma.personalRecord.findMany({
      where: {
        userId: session.user.id,
        exerciseId,
      },
      orderBy: { date: "desc" },
    });

    // Get current best for each type
    const best = {
      one_rep_max: prs
        .filter((pr) => pr.recordType === "one_rep_max")
        .sort((a, b) => b.value - a.value)[0],
      max_volume: prs
        .filter((pr) => pr.recordType === "max_volume")
        .sort((a, b) => b.value - a.value)[0],
      max_reps: prs
        .filter((pr) => pr.recordType === "max_reps")
        .sort((a, b) => b.value - a.value)[0],
    };

    return NextResponse.json({ prs, best });
  } catch (error) {
    console.error("Error fetching exercise PRs:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise PRs" },
      { status: 500 }
    );
  }
}
