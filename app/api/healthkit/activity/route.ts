import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getDevSession } from "@/lib/dev-auth"
import { startOfDay, subDays, format } from "date-fns"

// GET - Get activity data (energy burned, steps)
export async function GET(request: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get("days") || "7")
  const startDate = startOfDay(subDays(new Date(), days - 1))

  try {
    // Get energy records
    const energyRecords = await prisma.energyRecord.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate }
      },
      orderBy: { date: "asc" }
    })

    // Get step records
    const stepRecords = await prisma.stepRecord.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate }
      },
      orderBy: { date: "asc" }
    })

    // Group by date for easier charting
    const dailyData: Record<string, {
      date: string;
      activeCalories: number;
      restingCalories: number;
      totalCalories: number;
      steps: number;
    }> = {}

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd")
      dailyData[date] = {
        date,
        activeCalories: 0,
        restingCalories: 0,
        totalCalories: 0,
        steps: 0
      }
    }

    // Fill in energy data
    for (const record of energyRecords) {
      const date = format(record.date, "yyyy-MM-dd")
      if (dailyData[date]) {
        if (record.type === "active") {
          dailyData[date].activeCalories = record.calories
        } else if (record.type === "resting") {
          dailyData[date].restingCalories = record.calories
        }
        dailyData[date].totalCalories = 
          dailyData[date].activeCalories + dailyData[date].restingCalories
      }
    }

    // Fill in step data
    for (const record of stepRecords) {
      const date = format(record.date, "yyyy-MM-dd")
      if (dailyData[date]) {
        dailyData[date].steps = record.steps
      }
    }

    const data = Object.values(dailyData)

    // Calculate totals and averages
    const totals = {
      totalActiveCalories: data.reduce((sum, d) => sum + d.activeCalories, 0),
      totalRestingCalories: data.reduce((sum, d) => sum + d.restingCalories, 0),
      totalSteps: data.reduce((sum, d) => sum + d.steps, 0),
      avgActiveCalories: Math.round(data.reduce((sum, d) => sum + d.activeCalories, 0) / days),
      avgSteps: Math.round(data.reduce((sum, d) => sum + d.steps, 0) / days)
    }

    return NextResponse.json({
      dailyData: data,
      totals,
      period: {
        days,
        start: startDate,
        end: new Date()
      }
    })
  } catch (error) {
    console.error("Error fetching activity data:", error)
    return NextResponse.json({ error: "Failed to fetch activity data" }, { status: 500 })
  }
}

// POST - Manually add activity data
export async function POST(request: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { date, activeCalories, restingCalories, steps } = body
    const recordDate = new Date(date || new Date())
    recordDate.setHours(0, 0, 0, 0)

    const results: string[] = []

    if (activeCalories !== undefined) {
      await prisma.energyRecord.upsert({
        where: {
          userId_date_type: {
            userId: session.user.id,
            date: recordDate,
            type: "active"
          }
        },
        update: { calories: activeCalories },
        create: {
          userId: session.user.id,
          date: recordDate,
          type: "active",
          calories: activeCalories
        }
      })
      results.push("activeCalories")
    }

    if (restingCalories !== undefined) {
      await prisma.energyRecord.upsert({
        where: {
          userId_date_type: {
            userId: session.user.id,
            date: recordDate,
            type: "resting"
          }
        },
        update: { calories: restingCalories },
        create: {
          userId: session.user.id,
          date: recordDate,
          type: "resting",
          calories: restingCalories
        }
      })
      results.push("restingCalories")
    }

    if (steps !== undefined) {
      await prisma.stepRecord.upsert({
        where: {
          userId_date: {
            userId: session.user.id,
            date: recordDate
          }
        },
        update: { steps },
        create: {
          userId: session.user.id,
          date: recordDate,
          steps
        }
      })
      results.push("steps")
    }

    return NextResponse.json({
      success: true,
      recorded: results,
      date: recordDate
    })
  } catch (error) {
    console.error("Error recording activity data:", error)
    return NextResponse.json({ error: "Failed to record activity data" }, { status: 500 })
  }
}
