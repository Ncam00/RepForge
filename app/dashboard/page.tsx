"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, Dumbbell, Calendar, Award, Flame, Activity, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useRouter } from "next/navigation"
import XpProgress from "@/components/XpProgress"

export default function DashboardPage() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  const stats = data?.stats || {}
  const recentPRs = data?.recentPRs || []
  const recentSessions = data?.recentSessions || []
  const weightHistory = data?.weightHistory || []

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Track your progress and stay consistent.
          </p>
        </div>
        <Link href="/dashboard/history">
          <Button size="lg" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Start Workout
          </Button>
        </Link>
      </div>

      {/* XP and Level Progress */}
      <XpProgress />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {stats.currentWeight ? (
              <>
                <div className="text-2xl font-bold">
                  {stats.currentWeight} {stats.weightUnit}
                </div>
                {stats.weightChange !== null && (
                  <p className="text-xs flex items-center gap-1 text-muted-foreground mt-1">
                    {stats.weightChange > 0 ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : stats.weightChange < 0 ? (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    ) : null}
                    {stats.weightChange > 0 ? "+" : ""}
                    {stats.weightChange.toFixed(1)} {stats.weightUnit} (30d)
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted">--</div>
                <p className="text-xs text-muted-foreground mt-1">No weight logged yet</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts This Week</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Dumbbell className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workoutsThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.workoutsThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Streak</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.streak > 0 ? "days in a row 🔥" : "Start today!"}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalVolume ? `${stats.totalVolume.toLocaleString()}` : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.weightUnit} this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Split & PRs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Training Split</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.activeSplit ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{stats.activeSplit.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {stats.activeSplit.daysCount} day split
                    </div>
                  </div>
                  <Link href="/dashboard/splits">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No active split</p>
                <Link href="/dashboard/splits">
                  <Button size="sm">Create Split</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Personal Records</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {recentPRs.length > 0 ? (
              <div className="space-y-2">
                {recentPRs.slice(0, 3).map((pr: any) => (
                  <div key={pr.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{pr.exerciseName}</span>
                    <span className="text-muted-foreground">
                      {pr.value} {pr.recordType === "one_rep_max" ? "kg" : ""}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.totalPRs} total records
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Award className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No records yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete workouts to track PRs
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weight Progress Chart */}
      {weightHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weight Progress (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), "PPP")}
                  formatter={(value: any) => [`${value} ${stats.weightUnit}`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/weight" className="block">
              <Button className="w-full transition-all duration-200 hover:scale-105" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Log Weight
              </Button>
            </Link>
            <Link href="/dashboard/history" className="block">
              <Button className="w-full transition-all duration-200 hover:scale-105" variant="outline">
                <Dumbbell className="mr-2 h-4 w-4" />
                Log Workout
              </Button>
            </Link>
            <Link href="/dashboard/exercises" className="block">
              <Button className="w-full transition-all duration-200 hover:scale-105" variant="outline">
                <Award className="mr-2 h-4 w-4" />
                Exercises
              </Button>
            </Link>
            <Link href="/dashboard/splits" className="block">
              <Button className="w-full transition-all duration-200 hover:scale-105" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Splits
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 transition-all duration-200 hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              {recentSessions.length > 0 && (
                <Link href="/dashboard/history">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    View All
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.slice(0, 3).map((session: any) => (
                  <div key={session.id} className="group border-l-4 border-primary pl-3 py-2 rounded hover:bg-muted/50 transition-colors duration-200 cursor-pointer">
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {session.name || "Workout Session"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(session.startedAt), {
                        addSuffix: true,
                      })}
                      {" • "}
                      {session.totalSets} sets
                      {session.duration && ` • ${session.duration} min`}
                    </div>
                    {session.exercises.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {session.exercises.slice(0, 3).map((ex: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                          >
                            {ex}
                          </span>
                        ))}
                        {session.exercises.length > 3 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{session.exercises.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No recent activity yet
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Start your fitness journey with your first workout!
                </p>
                <Link href="/dashboard/history">
                  <Button size="sm">
                    <Dumbbell className="mr-2 h-4 w-4" />
                    Start Now
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
