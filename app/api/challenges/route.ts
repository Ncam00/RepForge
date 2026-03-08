import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getDevSession } from "@/lib/dev-auth"

// Hardcoded community challenges users can join
const TEMPLATE_CHALLENGES = [
  {
    id: "tmpl-1",
    title: "30-Day Consistency Challenge",
    description: "Log at least one workout every day for 30 consecutive days.",
    category: "streak",
    target: 30,
    goal: 30,
    unit: "days",
    xpReward: 500,
    participantCount: 142,
    maxParticipants: null,
    creatorName: "RepForge",
    endDate: null,
    isJoined: false,
  },
  {
    id: "tmpl-2",
    title: "100 Workouts Club",
    description: "Complete 100 total workout sessions. A true milestone of dedication.",
    category: "workouts",
    target: 100,
    goal: 100,
    unit: "workouts",
    xpReward: 1000,
    participantCount: 87,
    maxParticipants: null,
    creatorName: "RepForge",
    endDate: null,
    isJoined: false,
  },
  {
    id: "tmpl-3",
    title: "Monthly Volume King",
    description: "Lift 10,000 lbs of total volume in a single month.",
    category: "weight_lifted",
    target: 10000,
    goal: 10000,
    unit: "lbs",
    xpReward: 300,
    participantCount: 54,
    maxParticipants: null,
    creatorName: "RepForge",
    endDate: null,
    isJoined: false,
  },
  {
    id: "tmpl-4",
    title: "Weekly Warrior",
    description: "Complete 5 workouts in a single week.",
    category: "workouts",
    target: 5,
    goal: 5,
    unit: "workouts",
    xpReward: 150,
    participantCount: 231,
    maxParticipants: null,
    creatorName: "RepForge",
    endDate: null,
    isJoined: false,
  },
  {
    id: "tmpl-5",
    title: "1000 Reps Challenge",
    description: "Log 1,000 total reps of any exercise.",
    category: "reps",
    target: 1000,
    goal: 1000,
    unit: "reps",
    xpReward: 250,
    participantCount: 76,
    maxParticipants: null,
    creatorName: "RepForge",
    endDate: null,
    isJoined: false,
  },
]

export async function GET() {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id

  // Get user's personal challenges (these are "joined")
  const userChallenges = await prisma.challenge.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  const joinedTemplateIds = new Set(
    userChallenges
      .map((c) => c.type) // we store template id in type field when joining
      .filter((t) => t.startsWith("tmpl-"))
  )

  // Map DB challenges to the display format
  const formattedUserChallenges = userChallenges.map((c) => {
    const template = TEMPLATE_CHALLENGES.find((t) => t.id === c.type)
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      category: template?.category || c.type,
      goal: c.target,
      target: `${c.target} ${template?.unit || ""}`.trim(),
      unit: template?.unit || "",
      xpReward: c.xpReward,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate?.toISOString() || null,
      isJoined: true,
      progress: c.progress,
      participantCount: template?.participantCount || 1,
      maxParticipants: null,
      creatorName: template ? "RepForge" : session.user.name || "You",
      userStatus: c.status,
    }
  })

  // Template challenges the user has NOT joined yet
  const availableTemplates = TEMPLATE_CHALLENGES.filter(
    (t) => !joinedTemplateIds.has(t.id)
  ).map((t) => ({
    ...t,
    goal: t.target,
    startDate: new Date().toISOString(),
    endDate: null,
    progress: 0,
    userStatus: "available",
  }))

  return NextResponse.json({
    challenges: [...formattedUserChallenges, ...availableTemplates],
  })
}

export async function POST(request: Request) {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const body = await request.json()

  const { title, description, category, target, xpReward, endDate } = body

  if (!title || !target) {
    return NextResponse.json({ error: "Title and target are required" }, { status: 400 })
  }

  const challenge = await prisma.challenge.create({
    data: {
      userId,
      title,
      description: description || "",
      type: category || "custom",
      target: Number(target),
      xpReward: Number(xpReward) || 100,
      status: "active",
      startDate: new Date(),
      endDate: endDate ? new Date(endDate) : null,
    },
  })

  return NextResponse.json({ challenge })
}
