import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock suggested users
    const users = [
      { id: "demo1", name: "Alex Fitness", workoutCount: 145, followers: 234 },
      { id: "demo2", name: "Sam Strongman", workoutCount: 98, followers: 156 },
      { id: "demo3", name: "Riley Runner", workoutCount: 203, followers: 389 },
    ];

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
