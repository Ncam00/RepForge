import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "total_volume";
    const period = searchParams.get("period") || "weekly";

    // Mock data for demo
    const entries = [
      { id: "1", userName: "John Doe", value: 125000, rank: 1, isCurrentUser: false },
      { id: "2", userName: session.user.name || "You", value: 98000, rank: 2, isCurrentUser: true },
      { id: "3", userName: "Jane Smith", value: 87000, rank: 3, isCurrentUser: false },
      { id: "4", userName: "Mike Johnson", value: 76000, rank: 4, isCurrentUser: false },
      { id: "5", userName: "Sarah Wilson", value: 65000, rank: 5, isCurrentUser: false },
    ];

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
