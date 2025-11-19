"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { format, subDays, subMonths, differenceInDays } from "date-fns"
import { Plus, Trash2, Download, Target, TrendingUp, TrendingDown, Camera } from "lucide-react"

type Weight = {
  id: string
  weight: number
  unit: string
  bodyFat?: number | null
  muscleMass?: number | null
  date: string
  notes?: string | null
  photoUrl?: string | null
}

type WeightGoal = {
  id: string
  targetWeight: number
  unit: string
  targetDate?: string | null
  startWeight: number
  startDate: string
  isActive: boolean
}

export default function WeightPage() {
  const queryClient = useQueryClient()
  const [newWeight, setNewWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [muscleMass, setMuscleMass] = useState("")
  const [unit, setUnit] = useState<"kg" | "lbs">("kg")
  const [notes, setNotes] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d")
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [targetWeight, setTargetWeight] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [chartMetric, setChartMetric] = useState<"weight" | "bodyFat" | "muscleMass">("weight")

  const { data, isLoading } = useQuery({
    queryKey: ["weights"],
    queryFn: async () => {
      const res = await fetch("/api/weight")
      if (!res.ok) throw new Error("Failed to fetch weights")
      return res.json()
    },
  })

  const { data: goalData } = useQuery({
    queryKey: ["weight-goal"],
    queryFn: async () => {
      const res = await fetch("/api/weight/goal")
      if (!res.ok) throw new Error("Failed to fetch goal")
      return res.json()
    },
  })

  const addWeightMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to add weight")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weights"] })
      setNewWeight("")
      setBodyFat("")
      setMuscleMass("")
      setNotes("")
      setPhotoUrl("")
    },
  })

  const setGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/weight/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to set goal")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-goal"] })
      setShowGoalForm(false)
      setTargetWeight("")
      setTargetDate("")
    },
  })

  const deleteWeightMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/weight?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete weight")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weights"] })
    },
  })

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight)
    if (isNaN(weight) || weight <= 0) return

    addWeightMutation.mutate({
      weight,
      unit,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      notes: notes || undefined,
      photoUrl: photoUrl || undefined,
    })
  }

  const handleSetGoal = () => {
    const target = parseFloat(targetWeight)
    const weights: Weight[] = data?.weights || []
    const latestWeight = weights[0]

    if (isNaN(target) || target <= 0 || !latestWeight) return

    setGoalMutation.mutate({
      targetWeight: target,
      unit,
      targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      startWeight: latestWeight.weight,
    })
  }

  const exportToCSV = () => {
    const weights: Weight[] = data?.weights || []
    if (weights.length === 0) return

    const headers = ["Date", "Weight", "Unit", "Body Fat %", "Muscle Mass", "Notes"]
    const rows = weights.map(w => [
      format(new Date(w.date), "yyyy-MM-dd"),
      w.weight,
      w.unit,
      w.bodyFat || "",
      w.muscleMass || "",
      w.notes || ""
    ])

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `weight-data-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  const weights: Weight[] = data?.weights || []
  const goal: WeightGoal | null = goalData?.goal || null

  const getFilteredWeights = () => {
    if (dateRange === "all") return weights

    const now = new Date()
    const cutoff = {
      "7d": subDays(now, 7),
      "30d": subDays(now, 30),
      "90d": subMonths(now, 3),
    }[dateRange]

    return weights.filter((w) => new Date(w.date) >= cutoff)
  }

  const filteredWeights = getFilteredWeights()

  const chartData = filteredWeights
    .slice()
    .reverse()
    .map((w) => ({
      date: format(new Date(w.date), "MMM dd"),
      weight: w.weight,
      bodyFat: w.bodyFat,
      muscleMass: w.muscleMass,
    }))

  const latestWeight = weights[0]
  const weightChange = weights.length > 1 ? weights[0].weight - weights[1].weight : 0

  // Calculate goal progress
  const goalProgress = goal && latestWeight
    ? ((latestWeight.weight - goal.startWeight) / (goal.targetWeight - goal.startWeight)) * 100
    : 0

  const daysToGoal = goal?.targetDate
    ? differenceInDays(new Date(goal.targetDate), new Date())
    : null

  // Simple linear prediction
  const predictedWeight = () => {
    if (weights.length < 2) return null
    const recentWeights = weights.slice(0, Math.min(7, weights.length))
    const avgChange = recentWeights.reduce((acc, w, i) => {
      if (i === recentWeights.length - 1) return acc
      return acc + (recentWeights[i].weight - recentWeights[i + 1].weight)
    }, 0) / (recentWeights.length - 1)

    return latestWeight.weight + (avgChange * 7) // 7 days prediction
  }

  const predicted = predictedWeight()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weight Tracking</h1>
          <p className="text-muted-foreground">
            Monitor your body composition and progress
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" disabled={weights.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestWeight ? `${latestWeight.weight} ${latestWeight.unit}` : "--"}
            </div>
            {latestWeight && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(latestWeight.date), "PPP")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${weightChange > 0 ? "text-green-600" : weightChange < 0 ? "text-red-600" : ""}`}>
              {weightChange !== 0 ? (
                <>
                  {weightChange > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} {unit}
                </>
              ) : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Since last entry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Body Fat %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestWeight?.bodyFat ? `${latestWeight.bodyFat}%` : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Latest measurement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Muscle Mass</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestWeight?.muscleMass ? `${latestWeight.muscleMass} ${unit}` : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Latest measurement
            </p>
          </CardContent>
        </Card>
      </div>

      {goal && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Weight Goal</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowGoalForm(!showGoalForm)}>
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Target</div>
                <div className="text-2xl font-bold">{goal.targetWeight} {goal.unit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="text-2xl font-bold">{goalProgress.toFixed(1)}%</div>
              </div>
              {daysToGoal !== null && (
                <div>
                  <div className="text-sm text-muted-foreground">Days Remaining</div>
                  <div className="text-2xl font-bold">{daysToGoal > 0 ? daysToGoal : "Past due"}</div>
                </div>
              )}
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(Math.max(goalProgress, 0), 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {(!goal || showGoalForm) && (
        <Card>
          <CardHeader>
            <CardTitle>Set Weight Goal</CardTitle>
            <CardDescription>Define your target weight and timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="target-weight">Target Weight *</Label>
                <Input
                  id="target-weight"
                  type="number"
                  step="0.1"
                  placeholder="75.0"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-date">Target Date (Optional)</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSetGoal}
                  disabled={!targetWeight || setGoalMutation.isPending}
                  className="w-full"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Set Goal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {predicted && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">7-Day Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {predicted.toFixed(1)} {unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on recent trends
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log Entry</CardTitle>
          <CardDescription>Add a new weight and body composition entry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="75.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <select
                id="unit"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={unit}
                onChange={(e) => setUnit(e.target.value as "kg" | "lbs")}
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyFat">Body Fat % (Optional)</Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                placeholder="15.5"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscleMass">Muscle Mass (Optional)</Label>
              <Input
                id="muscleMass"
                type="number"
                step="0.1"
                placeholder="65.0"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Feeling energized"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photoUrl">Photo URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="photoUrl"
                  type="url"
                  placeholder="https://..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
                {photoUrl && (
                  <Button variant="outline" size="icon" onClick={() => window.open(photoUrl, "_blank")}>
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleAddWeight}
            disabled={!newWeight || addWeightMutation.isPending}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Log Entry
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trends</CardTitle>
              <CardDescription>Visualize your progress over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value as any)}
              >
                <option value="weight">Weight</option>
                <option value="bodyFat">Body Fat %</option>
                <option value="muscleMass">Muscle Mass</option>
              </select>
              {(["7d", "30d", "90d", "all"] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(range)}
                >
                  {range === "all" ? "All" : range.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name={chartMetric === "weight" ? "Weight" : chartMetric === "bodyFat" ? "Body Fat %" : "Muscle Mass"}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data to display
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : weights.length === 0 ? (
            <p className="text-muted-foreground">No entries logged yet</p>
          ) : (
            <div className="space-y-2">
              {weights.map((weight) => (
                <div
                  key={weight.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium text-lg">
                          {weight.weight} {weight.unit}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(weight.date), "PPP")}
                        </div>
                      </div>
                      {weight.bodyFat && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">BF:</span> {weight.bodyFat}%
                        </div>
                      )}
                      {weight.muscleMass && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">MM:</span> {weight.muscleMass} {weight.unit}
                        </div>
                      )}
                      {weight.photoUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(weight.photoUrl!, "_blank")}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Photo
                        </Button>
                      )}
                    </div>
                    {weight.notes && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {weight.notes}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteWeightMutation.mutate(weight.id)}
                    disabled={deleteWeightMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
