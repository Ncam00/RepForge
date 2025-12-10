"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, CheckCircle2, Circle, Edit, X, Save, Dumbbell, Clock } from "lucide-react"

type Exercise = {
  id: string
  name: string
  muscleGroups: string
  equipment?: string | null
  difficulty?: string | null
  videoUrl?: string | null
}

type SplitDayExercise = {
  id: string
  exerciseId: string
  order: number
  targetSets?: number | null
  targetReps?: string | null
  restTime?: number | null
  notes?: string | null
  exercise: Exercise
}

type SplitDay = {
  id: string
  dayOfWeek: number
  name: string
  description?: string | null
  order: number
  exercises?: SplitDayExercise[]
}

type WorkoutSplit = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  days: SplitDay[]
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function DayExerciseManager({ splitDayId }: { splitDayId: string }) {
  const queryClient = useQueryClient()
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState("")
  const [targetSets, setTargetSets] = useState<number | "">("")
  const [targetReps, setTargetReps] = useState("")
  const [restTime, setRestTime] = useState<number | "">("")
  const [notes, setNotes] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

  // Fetch exercises for this split day
  const { data: dayExercises } = useQuery({
    queryKey: ["splitDayExercises", splitDayId],
    queryFn: async () => {
      const res = await fetch(`/api/splits/${splitDayId}/exercises`)
      if (!res.ok) throw new Error("Failed to fetch exercises")
      return res.json()
    },
  })

  // Fetch all available exercises
  const { data: allExercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const res = await fetch("/api/exercises")
      if (!res.ok) throw new Error("Failed to fetch exercises")
      return res.json()
    },
  })

  const addExerciseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/splits/${splitDayId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to add exercise")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitDayExercises", splitDayId] })
      setIsAddingExercise(false)
      setSelectedExerciseId("")
      setTargetSets("")
      setTargetReps("")
      setRestTime("")
      setNotes("")
    },
  })

  const updateExerciseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/splits/exercises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update exercise")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitDayExercises", splitDayId] })
      setEditingId(null)
      setEditData({})
    },
  })

  const removeExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/splits/exercises/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove exercise")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitDayExercises", splitDayId] })
    },
  })

  const handleAddExercise = () => {
    if (!selectedExerciseId) return

    addExerciseMutation.mutate({
      exerciseId: selectedExerciseId,
      targetSets: targetSets || undefined,
      targetReps: targetReps || undefined,
      restTime: restTime || undefined,
      notes: notes || undefined,
    })
  }

  const handleUpdateExercise = (id: string) => {
    updateExerciseMutation.mutate({ id, data: editData })
  }

  const exercises: SplitDayExercise[] = dayExercises || []
  const availableExercises: Exercise[] = allExercises?.exercises || []

  return (
    <div className="space-y-3 mt-3">
      {exercises.length > 0 && (
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div key={ex.id} className="p-3 rounded-lg border bg-muted/50">
              {editingId === ex.id ? (
                <div className="space-y-2">
                  <div className="font-medium">{ex.exercise.name}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Sets</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={editData.targetSets ?? ex.targetSets ?? ""}
                        onChange={(e) => setEditData({ ...editData, targetSets: parseInt(e.target.value) || undefined })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reps</Label>
                      <Input
                        placeholder="8-12"
                        value={editData.targetReps ?? ex.targetReps ?? ""}
                        onChange={(e) => setEditData({ ...editData, targetReps: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rest (sec)</Label>
                      <Input
                        type="number"
                        placeholder="90"
                        value={editData.restTime ?? ex.restTime ?? ""}
                        onChange={(e) => setEditData({ ...editData, restTime: parseInt(e.target.value) || undefined })}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Input
                      placeholder="Focus on form"
                      value={editData.notes ?? ex.notes ?? ""}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateExercise(ex.id)}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{ex.exercise.name}</div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        {ex.targetSets && <span>{ex.targetSets} sets</span>}
                        {ex.targetReps && <span>{ex.targetReps} reps</span>}
                        {ex.restTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {ex.restTime}s
                          </span>
                        )}
                      </div>
                      {ex.notes && (
                        <div className="text-sm text-muted-foreground mt-1 italic">
                          {ex.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(ex.id)
                          setEditData({
                            targetSets: ex.targetSets,
                            targetReps: ex.targetReps,
                            restTime: ex.restTime,
                            notes: ex.notes,
                          })
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExerciseMutation.mutate(ex.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isAddingExercise ? (
        <div className="p-3 rounded-lg border bg-card space-y-3">
          <div className="space-y-2">
            <Label>Select Exercise</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
            >
              <option value="">Choose an exercise...</option>
              {availableExercises.map((ex) => {
                let muscles = [];
                try {
                  muscles = JSON.parse(ex.muscleGroups);
                } catch {
                  muscles = [];
                }
                return (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} {muscles.length > 0 ? `(${muscles.join(", ")})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Target Sets</Label>
              <Input
                type="number"
                placeholder="3"
                value={targetSets}
                onChange={(e) => setTargetSets(parseInt(e.target.value) || "")}
              />
            </div>
            <div>
              <Label className="text-xs">Target Reps</Label>
              <Input
                placeholder="8-12"
                value={targetReps}
                onChange={(e) => setTargetReps(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Rest (sec)</Label>
              <Input
                type="number"
                placeholder="90"
                value={restTime}
                onChange={(e) => setRestTime(parseInt(e.target.value) || "")}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Input
              placeholder="Focus on form, slow negatives, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddExercise}
              disabled={!selectedExerciseId || addExerciseMutation.isPending}
            >
              Add Exercise
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingExercise(false)
                setSelectedExerciseId("")
                setTargetSets("")
                setTargetReps("")
                setRestTime("")
                setNotes("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setIsAddingExercise(true)}
        >
          <Plus className="mr-2 h-3 w-3" />
          Add Exercise
        </Button>
      )}
    </div>
  )
}

export default function SplitsPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newSplitName, setNewSplitName] = useState("")
  const [newSplitDescription, setNewSplitDescription] = useState("")
  const [splitDays, setSplitDays] = useState<Array<{ dayOfWeek: number; name: string; description: string }>>([])
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

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

  const toggleDayExpanded = (dayId: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId)
    } else {
      newExpanded.add(dayId)
    }
    setExpandedDays(newExpanded)
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
                      <div key={day.id} className="rounded-lg border">
                        <div
                          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleDayExpanded(day.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                <Dumbbell className="h-4 w-4" />
                                {DAYS_OF_WEEK[day.dayOfWeek]} - {day.name}
                              </div>
                              {day.description && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {day.description}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleDayExpanded(day.id)
                              }}
                            >
                              {expandedDays.has(day.id) ? "Hide" : "Manage"}
                            </Button>
                          </div>
                        </div>
                        {expandedDays.has(day.id) && (
                          <div className="px-3 pb-3 border-t">
                            <DayExerciseManager splitDayId={day.id} />
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
