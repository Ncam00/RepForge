import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { subDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = subDays(new Date(), days);

    // Get XP transactions
    const transactions = await prisma.xpTransaction.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate cumulative XP over time
    let cumulative = 0;
    const chartData = transactions.map((tx) => {
      cumulative += tx.amount;
      return {
        date: tx.createdAt.toISOString(),
        xp: tx.amount,
        cumulativeXp: cumulative,
        reason: tx.reason,
        source: tx.source,
      };
    });

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error("Error fetching XP data:", error);
    return NextResponse.json(
      { error: "Failed to fetch XP data" },
      { status: 500 }
    );
  }
}
