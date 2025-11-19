"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, CheckCircle2, Circle, Edit } from "lucide-react"

type WorkoutSplit = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  days: Array<{
    id: string
    dayOfWeek: number
    name: string
    description?: string | null
    order: number
  }>
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function SplitsPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newSplitName, setNewSplitName] = useState("")
  const [newSplitDescription, setNewSplitDescription] = useState("")
  const [splitDays, setSplitDays] = useState<Array<{ dayOfWeek: number; name: string; description: string }>>([])

  const { data, isLoading } = useQuery({
    queryKey: ["splits"],
    queryFn: async () => {
      const res = await fetch("/api/splits")
      if (!res.ok) throw new Error("Failed to fetch splits")
      return res.json()
    },
  })

  const createSplitMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; days?: any[] }) => {
      const res = await fetch("/api/splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create split")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
      setIsCreating(false)
      setNewSplitName("")
      setNewSplitDescription("")
      setSplitDays([])
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/splits?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error("Failed to update split")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
    },
  })

  const deleteSplitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/splits?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete split")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
    },
  })

  const handleAddDay = () => {
    setSplitDays([...splitDays, { dayOfWeek: 1, name: "", description: "" }])
  }

  const handleRemoveDay = (index: number) => {
    setSplitDays(splitDays.filter((_, i) => i !== index))
  }

  const handleDayChange = (index: number, field: string, value: any) => {
    const updated = [...splitDays]
    updated[index] = { ...updated[index], [field]: value }
    setSplitDays(updated)
  }

  const handleCreateSplit = () => {
    if (!newSplitName) return

    createSplitMutation.mutate({
      name: newSplitName,
      description: newSplitDescription || undefined,
      days: splitDays.length > 0 ? splitDays.map((day, index) => ({
        ...day,
        order: index,
      })) : undefined,
    })
  }

  const splits: WorkoutSplit[] = data?.splits || []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Splits</h1>
          <p className="text-muted-foreground">
            Create and manage your workout routines
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          New Split
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Split</CardTitle>
            <CardDescription>Define your training split structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="split-name">Split Name</Label>
                <Input
                  id="split-name"
                  placeholder="Push Pull Legs"
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="split-description">Description</Label>
                <Input
                  id="split-description"
                  placeholder="3-day split (optional)"
                  value={newSplitDescription}
                  onChange={(e) => setNewSplitDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Days</Label>
                <Button variant="outline" size="sm" onClick={handleAddDay}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Day
                </Button>
              </div>

              {splitDays.map((day, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={day.dayOfWeek}
                      onChange={(e) => handleDayChange(index, "dayOfWeek", parseInt(e.target.value))}
                    >
                      {DAYS_OF_WEEK.map((dayName, i) => (
                        <option key={i} value={i}>{dayName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Push Day"
                      value={day.name}
                      onChange={(e) => handleDayChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Chest, shoulders, triceps"
                      value={day.description}
                      onChange={(e) => handleDayChange(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDay(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateSplit}
                disabled={!newSplitName || createSplitMutation.isPending}
              >
                Create Split
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setNewSplitName("")
                  setNewSplitDescription("")
                  setSplitDays([])
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading splits...</p>
      ) : splits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No training splits yet. Create your first split to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {splits.map((split) => (
            <Card key={split.id} className={split.isActive ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {split.name}
                      {split.isActive && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    {split.description && (
                      <CardDescription>{split.description}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSplitMutation.mutate(split.id)}
                    disabled={deleteSplitMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {split.days.length > 0 ? (
                  <div className="space-y-2">
                    {split.days.map((day) => (
                      <div key={day.id} className="p-3 rounded-lg border">
                        <div className="font-medium">
                          {DAYS_OF_WEEK[day.dayOfWeek]} - {day.name}
                        </div>
                        {day.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {day.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No days configured</p>
                )}

                <Button
                  variant={split.isActive ? "outline" : "default"}
                  className="w-full mt-4"
                  onClick={() => toggleActiveMutation.mutate({
                    id: split.id,
                    isActive: !split.isActive,
                  })}
                  disabled={toggleActiveMutation.isPending}
                >
                  {split.isActive ? (
                    <>
                      <Circle className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Set as Active
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
