import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getDevSession } from "@/lib/dev-auth"

// Types for HealthKit data from Apple Watch
interface HealthKitWorkout {
  id: string;
  type: string; // e.g., "traditionalStrengthTraining", "running", "cycling"
  startDate: string;
  endDate: string;
  duration: number; // seconds
  totalEnergyBurned?: number; // calories
  totalDistance?: number; // meters
  averageHeartRate?: number;
  maxHeartRate?: number;
  metadata?: Record<string, unknown>;
}

interface HealthKitHeartRate {
  timestamp: string;
  value: number;
  motionContext?: "sedentary" | "active" | "notSet";
}

interface HealthKitSyncPayload {
  deviceId: string;
  syncTimestamp: string;
  workouts?: HealthKitWorkout[];
  heartRateSamples?: HealthKitHeartRate[];
  activeEnergy?: { date: string; calories: number }[];
  restingEnergy?: { date: string; calories: number }[];
  stepCount?: { date: string; steps: number }[];
}

// POST - Sync HealthKit data from Apple Watch
export async function POST(request: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const payload: HealthKitSyncPayload = await request.json()
    
    const results = {
      workoutsProcessed: 0,
      heartRateSamplesProcessed: 0,
      energyRecordsProcessed: 0,
      errors: [] as string[]
    }

    // Store device sync info
    await prisma.healthKitDevice.upsert({
      where: {
        userId_deviceId: {
          userId: session.user.id,
          deviceId: payload.deviceId
        }
      },
      update: {
        lastSyncAt: new Date(payload.syncTimestamp)
      },
      create: {
        userId: session.user.id,
        deviceId: payload.deviceId,
        lastSyncAt: new Date(payload.syncTimestamp)
      }
    })

    // Process workouts
    if (payload.workouts?.length) {
      for (const workout of payload.workouts) {
        try {
          await prisma.healthKitWorkout.upsert({
            where: {
              userId_externalId: {
                userId: session.user.id,
                externalId: workout.id
              }
            },
            update: {
              type: workout.type,
              startDate: new Date(workout.startDate),
              endDate: new Date(workout.endDate),
              duration: workout.duration,
              totalEnergyBurned: workout.totalEnergyBurned,
              totalDistance: workout.totalDistance,
              averageHeartRate: workout.averageHeartRate,
              maxHeartRate: workout.maxHeartRate,
              metadata: workout.metadata ? JSON.stringify(workout.metadata) : null
            },
            create: {
              userId: session.user.id,
              externalId: workout.id,
              type: workout.type,
              startDate: new Date(workout.startDate),
              endDate: new Date(workout.endDate),
              duration: workout.duration,
              totalEnergyBurned: workout.totalEnergyBurned,
              totalDistance: workout.totalDistance,
              averageHeartRate: workout.averageHeartRate,
              maxHeartRate: workout.maxHeartRate,
              metadata: workout.metadata ? JSON.stringify(workout.metadata) : null
            }
          })
          results.workoutsProcessed++
        } catch {
          results.errors.push(`Failed to process workout ${workout.id}`)
        }
      }
    }

    // Process heart rate samples (batch insert for efficiency)
    if (payload.heartRateSamples?.length) {
      const samples = payload.heartRateSamples.map(hr => ({
        userId: session.user.id,
        timestamp: new Date(hr.timestamp),
        value: hr.value,
        motionContext: hr.motionContext || "notSet",
        deviceId: payload.deviceId
      }))

      try {
        const hrResults = await Promise.allSettled(
          samples.map(sample =>
            prisma.heartRateSample.upsert({
              where: { userId_timestamp: { userId: sample.userId, timestamp: sample.timestamp } },
              update: {},
              create: sample,
            })
          )
        )
        results.heartRateSamplesProcessed = hrResults.filter(r => r.status === "fulfilled").length
      } catch (error) {
        results.errors.push("Failed to process heart rate samples")
      }
    }

    // Process energy data (active + resting)
    if (payload.activeEnergy?.length || payload.restingEnergy?.length) {
      const energyRecords = [
        ...(payload.activeEnergy || []).map(e => ({
          userId: session.user.id,
          date: new Date(e.date),
          type: "active" as const,
          calories: e.calories
        })),
        ...(payload.restingEnergy || []).map(e => ({
          userId: session.user.id,
          date: new Date(e.date),
          type: "resting" as const,
          calories: e.calories
        }))
      ]

      for (const record of energyRecords) {
        try {
          await prisma.energyRecord.upsert({
            where: {
              userId_date_type: {
                userId: record.userId,
                date: record.date,
                type: record.type
              }
            },
            update: { calories: record.calories },
            create: record
          })
          results.energyRecordsProcessed++
        } catch {
          results.errors.push(`Failed to process energy record for ${record.date}`)
        }
      }
    }

    // Process step count
    if (payload.stepCount?.length) {
      for (const step of payload.stepCount) {
        try {
          await prisma.stepRecord.upsert({
            where: {
              userId_date: {
                userId: session.user.id,
                date: new Date(step.date)
              }
            },
            update: { steps: step.steps },
            create: {
              userId: session.user.id,
              date: new Date(step.date),
              steps: step.steps
            }
          })
        } catch {
          results.errors.push(`Failed to process step count for ${step.date}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sync completed",
      results
    })
  } catch (error) {
    console.error("HealthKit sync error:", error)
    return NextResponse.json({ error: "Failed to sync HealthKit data" }, { status: 500 })
  }
}

// GET - Get sync status and last synced data summary
export async function GET() {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const devices = await prisma.healthKitDevice.findMany({
      where: { userId: session.user.id },
      orderBy: { lastSyncAt: "desc" }
    })

    const recentWorkouts = await prisma.healthKitWorkout.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
      take: 5
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayStats = await prisma.heartRateSample.aggregate({
      where: {
        userId: session.user.id,
        timestamp: { gte: todayStart }
      },
      _avg: { value: true },
      _min: { value: true },
      _max: { value: true },
      _count: true
    })

    const todayEnergy = await prisma.energyRecord.findMany({
      where: {
        userId: session.user.id,
        date: { gte: todayStart }
      }
    })

    const todaySteps = await prisma.stepRecord.findFirst({
      where: {
        userId: session.user.id,
        date: { gte: todayStart }
      }
    })

    return NextResponse.json({
      devices,
      recentWorkouts,
      todayStats: {
        heartRate: {
          average: todayStats._avg.value,
          min: todayStats._min.value,
          max: todayStats._max.value,
          sampleCount: todayStats._count
        },
        energy: {
          active: todayEnergy.find(e => e.type === "active")?.calories || 0,
          resting: todayEnergy.find(e => e.type === "resting")?.calories || 0
        },
        steps: todaySteps?.steps || 0
      }
    })
  } catch (error) {
    console.error("Error fetching HealthKit status:", error)
    return NextResponse.json({ error: "Failed to fetch sync status" }, { status: 500 })
  }
}
