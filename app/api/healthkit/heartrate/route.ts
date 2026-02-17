import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getDevSession } from "@/auth"

// GET - Get heart rate data with optional time range
export async function GET(request: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const period = searchParams.get("period") || "day" // day, week, month

  try {
    // Calculate date range based on period if not explicitly provided
    let start: Date
    let end: Date = new Date()

    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      switch (period) {
        case "week":
          start = new Date()
          start.setDate(start.getDate() - 7)
          break
        case "month":
          start = new Date()
          start.setMonth(start.getMonth() - 1)
          break
        case "day":
        default:
          start = new Date()
          start.setHours(0, 0, 0, 0)
          break
      }
    }

    const samples = await prisma.heartRateSample.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: start,
          lte: end
        }
      },
      orderBy: { timestamp: "asc" }
    })

    // Calculate statistics
    const values = samples.map(s => s.value)
    const stats = values.length > 0 ? {
      average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    } : null

    // Get resting heart rate (samples during sedentary periods, usually morning)
    const restingSamples = samples.filter(s => s.motionContext === "sedentary")
    const restingHR = restingSamples.length > 0
      ? Math.round(restingSamples.map(s => s.value).reduce((a, b) => a + b, 0) / restingSamples.length)
      : null

    return NextResponse.json({
      samples,
      stats,
      restingHeartRate: restingHR,
      period: { start, end }
    })
  } catch (error) {
    console.error("Error fetching heart rate data:", error)
    return NextResponse.json({ error: "Failed to fetch heart rate data" }, { status: 500 })
  }
}

// POST - Add heart rate samples (for manual entry or other integrations)
export async function POST(request: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Support single sample or batch
    const samples = Array.isArray(body) ? body : [body]
    
    const data = samples.map(sample => ({
      userId: session.user.id,
      timestamp: new Date(sample.timestamp || new Date()),
      value: sample.value,
      motionContext: sample.motionContext || "notSet"
    }))

    await prisma.heartRateSample.createMany({
      data,
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      samplesAdded: data.length
    })
  } catch (error) {
    console.error("Error adding heart rate samples:", error)
    return NextResponse.json({ error: "Failed to add heart rate samples" }, { status: 500 })
  }
}
