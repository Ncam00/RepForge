import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getDevSession } from "@/lib/dev-auth"

const TEMPLATE_CHALLENGES = [
  {
    id: "tmpl-1",
    title: "30-Day Consistency Challenge",
    description: "Log at least one workout every day for 30 consecutive days.",
    category: "streak",
    target: 30,
    unit: "days",
    xpReward: 500,
  },
  {
    id: "tmpl-2",
    title: "100 Workouts Club",
    description: "Complete 100 total workout sessions. A true milestone of dedication.",
    category: "workouts",
    target: 100,
    unit: "workouts",
    xpReward: 1000,
  },
  {
    id: "tmpl-3",
    title: "Monthly Volume King",
    description: "Lift 10,000 lbs of total volume in a single month.",
    category: "weight_lifted",
    target: 10000,
    unit: "lbs",
    xpReward: 300,
  },
  {
    id: "tmpl-4",
    title: "Weekly Warrior",
    description: "Complete 5 workouts in a single week.",
    category: "workouts",
    target: 5,
    unit: "workouts",
    xpReward: 150,
  },
  {
    id: "tmpl-5",
    title: "1000 Reps Challenge",
    description: "Log 1,000 total reps of any exercise.",
    category: "reps",
    target: 1000,
    unit: "reps",
    xpReward: 250,
  },
]

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const { id } = await params

  const template = TEMPLATE_CHALLENGES.find((t) => t.id === id)
  if (!template) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
  }

  // Check if already joined
  const existing = await prisma.challenge.findFirst({
    where: { userId, type: id },
  })
  if (existing) {
    return NextResponse.json({ error: "Already joined" }, { status: 409 })
  }

  const challenge = await prisma.challenge.create({
    data: {
      userId,
      title: template.title,
      description: template.description,
      type: id, // store template ID so we can match back
      target: template.target,
      xpReward: template.xpReward,
      status: "active",
      startDate: new Date(),
    },
  })

  return NextResponse.json({ challenge })
}
