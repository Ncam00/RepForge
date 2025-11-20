import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock feed data
    const shares = [
      {
        id: "demo1",
        caption: "Great leg day! Feeling the burn 🔥",
        createdAt: new Date(),
        likes: 12,
        comments: 3,
        isLiked: false,
        userName: "Demo User",
        userId: "demo1",
        sessionName: "Leg Day",
        duration: 65,
        totalSets: 18,
        totalVolume: 12500,
      },
    ];

    return NextResponse.json({ shares });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
