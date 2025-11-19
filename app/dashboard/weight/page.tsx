"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, subDays, subMonths } from "date-fns"
import { Plus, Trash2 } from "lucide-react"

type Weight = {
  id: string
  weight: number
  unit: string
  date: string
  notes?: string | null
}

export default function WeightPage() {
  const queryClient = useQueryClient()
  const [newWeight, setNewWeight] = useState("")
  const [unit, setUnit] = useState<"kg" | "lbs">("kg")
  const [notes, setNotes] = useState("")
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d")

  const { data, isLoading } = useQuery({
    queryKey: ["weights"],
    queryFn: async () => {
      const res = await fetch("/api/weight")
      if (!res.ok) throw new Error("Failed to fetch weights")
      return res.json()
    },
  })

  const addWeightMutation = useMutation({
    mutationFn: async (data: { weight: number; unit: string; notes?: string }) => {
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
      setNotes("")
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
      notes: notes || undefined,
    })
  }

  const weights: Weight[] = data?.weights || []

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
    }))

  const latestWeight = weights[0]
  const weightChange =
    weights.length > 1 ? weights[0].weight - weights[1].weight : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weight Tracking</h1>
        <p className="text-muted-foreground">
          Monitor your body weight over time
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
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
          <CardHeader>
            <CardTitle>Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${weightChange > 0 ? "text-green-600" : weightChange < 0 ? "text-red-600" : ""}`}>
              {weightChange !== 0 ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} ${unit}` : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Since last entry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{weights.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Logged weights
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Weight</CardTitle>
          <CardDescription>Add a new weight entry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Feeling energized"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleAddWeight}
            disabled={!newWeight || addWeightMutation.isPending}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Log Weight
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weight Trend</CardTitle>
            <div className="flex gap-2">
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
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No weight data to display
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : weights.length === 0 ? (
            <p className="text-muted-foreground">No weights logged yet</p>
          ) : (
            <div className="space-y-2">
              {weights.map((weight) => (
                <div
                  key={weight.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">
                      {weight.weight} {weight.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(weight.date), "PPP")}
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
