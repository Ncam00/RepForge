"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Plus, Trash2, CheckCircle2, Circle, Edit, X, Save, Dumbbell, Clock, 
  ChevronDown, ChevronUp, Play, Search, ArrowLeft, Settings2, Check
} from "lucide-react"

// Types
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

interface ExerciseInput {
  exerciseId: string
  exerciseName: string
  targetSets?: number
  targetReps?: string
  restTime?: number
  notes?: string
}

interface SplitDayInput {
  dayOfWeek: number
  name: string
  description?: string
  order?: number
  exercises?: ExerciseInput[]
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const MUSCLE_GROUPS = [
  "abs", "back", "biceps", "calves", "chest", "glutes",
  "hamstrings", "quads", "shoulders", "traps", "triceps"
]

// Component for managing exercises within a selected day
function DayExerciseManager({ 
  splitDay, 
  onClose 
}: { 
  splitDay: SplitDay
  onClose: () => void 
}) {
  const queryClient = useQueryClient()
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState("")
  const [targetSets, setTargetSets] = useState<number | "">("")
  const [targetReps, setTargetReps] = useState("")
  const [restTime, setRestTime] = useState<number | "">("")
  const [notes, setNotes] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, unknown>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMuscle, setFilterMuscle] = useState("")

  // Fetch exercises for this split day
  const { data: dayExercises } = useQuery({
    queryKey: ["splitDayExercises", splitDay.id],
    queryFn: async () => {
      const res = await fetch(`/api/splits/${splitDay.id}/exercises`)
      if (!res.ok) throw new Error("Failed to fetch exercises")
      return res.json()
    },
  })

  // Fetch all available exercises
  const { data: allExercises } = useQuery({
    queryKey: ["exercises", searchTerm, filterMuscle],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (filterMuscle) params.append("muscleGroup", filterMuscle)
      const res = await fetch(`/api/exercises?${params}`)
      if (!res.ok) throw new Error("Failed to fetch exercises")
      return res.json()
    },
  })

  const addExerciseMutation = useMutation({
    mutationFn: async (data: { exerciseId: string; targetSets?: number; targetReps?: string; restTime?: number; notes?: string }) => {
      const res = await fetch(`/api/splits/${splitDay.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to add exercise")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitDayExercises", splitDay.id] })
      queryClient.invalidateQueries({ queryKey: ["splits"] })
      setIsAddingExercise(false)
      resetForm()
    },
  })

  const updateExerciseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/splits/exercises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update exercise")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitDayExercises", splitDay.id] })
      queryClient.invalidateQueries({ queryKey: ["splits"] })
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
      queryClient.invalidateQueries({ queryKey: ["splitDayExercises", splitDay.id] })
      queryClient.invalidateQueries({ queryKey: ["splits"] })
    },
  })

  const resetForm = () => {
    setSelectedExerciseId("")
    setTargetSets("")
    setTargetReps("")
    setRestTime("")
    setNotes("")
    setSearchTerm("")
    setFilterMuscle("")
  }

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

  const exercises: SplitDayExercise[] = dayExercises || []
  const availableExercises: Exercise[] = allExercises?.exercises || []

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{splitDay.name}</h1>
              {splitDay.description && (
                <p className="text-muted-foreground">{splitDay.description}</p>
              )}
            </div>
          </div>
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            <Play className="mr-2 h-5 w-5" />
            Start Workout
          </Button>
        </div>

        {/* Current Exercises */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Exercises ({exercises.length})
            </CardTitle>
            <CardDescription>
              Exercises planned for this training day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No exercises added yet</p>
                <p className="text-sm">Add exercises from the library below</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((ex, index) => (
                  <div key={ex.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    {editingId === ex.id ? (
                      <div className="space-y-3">
                        <div className="font-medium text-lg">{ex.exercise.name}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Sets</Label>
                            <Input
                              type="number"
                              placeholder="3"
                              value={(editData.targetSets as number) ?? ex.targetSets ?? ""}
                              onChange={(e) => setEditData({ ...editData, targetSets: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Reps</Label>
                            <Input
                              placeholder="8-12"
                              value={(editData.targetReps as string) ?? ex.targetReps ?? ""}
                              onChange={(e) => setEditData({ ...editData, targetReps: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Rest (sec)</Label>
                            <Input
                              type="number"
                              placeholder="90"
                              value={(editData.restTime as number) ?? ex.restTime ?? ""}
                              onChange={(e) => setEditData({ ...editData, restTime: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Notes</Label>
                            <Input
                              placeholder="Focus on form"
                              value={(editData.notes as string) ?? ex.notes ?? ""}
                              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateExerciseMutation.mutate({ id: ex.id, data: editData })}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditData({}) }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{ex.exercise.name}</div>
                            <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                              {ex.targetSets && <span>{ex.targetSets} sets</span>}
                              {ex.targetReps && <span>{ex.targetReps} reps</span>}
                              {ex.restTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {ex.restTime}s rest
                                </span>
                              )}
                            </div>
                            {ex.notes && (
                              <div className="text-sm text-muted-foreground italic mt-1">{ex.notes}</div>
                            )}
                          </div>
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
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExerciseMutation.mutate(ex.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Exercise Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add Exercise</span>
              {!isAddingExercise && (
                <Button onClick={() => setIsAddingExercise(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Library
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          {isAddingExercise && (
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={filterMuscle}
                  onChange={(e) => setFilterMuscle(e.target.value)}
                >
                  <option value="">All Muscles</option>
                  {MUSCLE_GROUPS.map((muscle) => (
                    <option key={muscle} value={muscle}>
                      {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exercise Selection */}
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {availableExercises.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No exercises found
                  </div>
                ) : (
                  availableExercises.map((ex) => {
                    let muscles: string[] = []
                    try {
                      muscles = JSON.parse(ex.muscleGroups)
                    } catch {
                      muscles = ex.muscleGroups ? [ex.muscleGroups] : []
                    }
                    const isSelected = selectedExerciseId === ex.id
                    
                    return (
                      <div
                        key={ex.id}
                        className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent/50 transition-colors ${
                          isSelected ? "bg-primary/10 border-l-4 border-l-primary" : ""
                        }`}
                        onClick={() => setSelectedExerciseId(isSelected ? "" : ex.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{ex.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {muscles.join(", ")} {ex.equipment && `• ${ex.equipment}`}
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Sets/Reps Configuration */}
              {selectedExerciseId && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="font-medium">Configure Exercise</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Sets</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={targetSets}
                        onChange={(e) => setTargetSets(parseInt(e.target.value) || "")}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reps</Label>
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
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Input
                        placeholder="Optional notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAddExercise}
                  disabled={!selectedExerciseId || addExerciseMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingExercise(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

// Main Training Page
export default function TrainingPage() {
  const queryClient = useQueryClient()
  const [selectedDay, setSelectedDay] = useState<SplitDay | null>(null)
  const [showManageSplits, setShowManageSplits] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newSplitName, setNewSplitName] = useState("")
  const [newSplitDescription, setNewSplitDescription] = useState("")
  const [splitDays, setSplitDays] = useState<SplitDayInput[]>([])
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["splits"],
    queryFn: async () => {
      const res = await fetch("/api/splits")
      if (!res.ok) throw new Error("Failed to fetch splits")
      return res.json()
    },
  })

  // Fetch exercises for the create form
  const { data: exercisesData } = useQuery({
    queryKey: ["exercises", exerciseSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (exerciseSearch) params.append("search", exerciseSearch)
      const res = await fetch(`/api/exercises?${params}`)
      if (!res.ok) throw new Error("Failed to fetch exercises")
      return res.json()
    },
    enabled: isCreating,
  })

  const availableExercises: Exercise[] = exercisesData?.exercises || []

  const createSplitMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; days?: SplitDayInput[] }) => {
      const res = await fetch("/api/splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create split")
      return res.json()
    },
    onSuccess: async (result, variables) => {
      // After creating the split, add exercises to each day
      if (result.split?.days && variables.days) {
        for (let i = 0; i < result.split.days.length; i++) {
          const createdDay = result.split.days[i]
          const inputDay = variables.days.find((d: SplitDayInput) => d.dayOfWeek === createdDay.dayOfWeek && d.name === createdDay.name)
          if (inputDay?.exercises?.length) {
            for (const exercise of inputDay.exercises) {
              await fetch(`/api/splits/${createdDay.id}/exercises`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  exerciseId: exercise.exerciseId,
                  targetSets: exercise.targetSets,
                  targetReps: exercise.targetReps,
                  restTime: exercise.restTime,
                  notes: exercise.notes,
                }),
              })
            }
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ["splits"] })
      setIsCreating(false)
      setNewSplitName("")
      setNewSplitDescription("")
      setSplitDays([])
      setExpandedDayIndex(null)
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

  const splits: WorkoutSplit[] = data?.splits || []
  const activeSplit = splits.find(s => s.isActive)

  const handleAddDay = () => {
    setSplitDays([...splitDays, { dayOfWeek: 1, name: "", description: "", exercises: [] }])
  }

  const handleRemoveDay = (index: number) => {
    setSplitDays(splitDays.filter((_, i) => i !== index))
    if (expandedDayIndex === index) setExpandedDayIndex(null)
  }

  const handleDayChange = (index: number, field: string, value: string | number) => {
    const updated = [...splitDays]
    updated[index] = { ...updated[index], [field]: value }
    setSplitDays(updated)
  }

  const handleAddExerciseToDay = (dayIndex: number, exercise: Exercise) => {
    const updated = [...splitDays]
    const exercises = updated[dayIndex].exercises || []
    // Check if already added
    if (exercises.some(e => e.exerciseId === exercise.id)) return
    updated[dayIndex].exercises = [...exercises, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetSets: 3,
      targetReps: "8-12",
    }]
    setSplitDays(updated)
  }

  const handleRemoveExerciseFromDay = (dayIndex: number, exerciseId: string) => {
    const updated = [...splitDays]
    updated[dayIndex].exercises = (updated[dayIndex].exercises || []).filter(e => e.exerciseId !== exerciseId)
    setSplitDays(updated)
  }

  const handleUpdateExerciseInDay = (dayIndex: number, exerciseId: string, field: string, value: unknown) => {
    const updated = [...splitDays]
    updated[dayIndex].exercises = (updated[dayIndex].exercises || []).map(e => 
      e.exerciseId === exerciseId ? { ...e, [field]: value } : e
    )
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

  // Show day detail view if a day is selected
  if (selectedDay) {
    return <DayExerciseManager splitDay={selectedDay} onClose={() => setSelectedDay(null)} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training</h1>
          <p className="text-muted-foreground">
            {activeSplit ? `Current program: ${activeSplit.name}` : "Select a training program to get started"}
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowManageSplits(!showManageSplits)}>
          <Settings2 className="mr-2 h-4 w-4" />
          {showManageSplits ? "Hide" : "Manage"} Programs
        </Button>
      </div>

      {/* Active Split - Training Options */}
      {activeSplit ? (
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-green-500 text-white px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </span>
              <CardTitle>{activeSplit.name}</CardTitle>
            </div>
            <CardDescription>
              {activeSplit.description || "Select what you want to train today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSplit.days.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No training days configured</p>
                <Button variant="link" onClick={() => setShowManageSplits(true)}>
                  Add training days
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSplit.days.map((day) => (
                  <Card
                    key={day.id}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => setSelectedDay(day)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{day.name}</h3>
                          {day.description && (
                            <p className="text-sm text-muted-foreground mt-1">{day.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                            <Dumbbell className="h-4 w-4" />
                            <span>{day.exercises?.length || 0} exercises</span>
                          </div>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Active Program</h3>
            <p className="text-muted-foreground mb-4">
              Create a training split or activate an existing one to start training
            </p>
            <Button onClick={() => setShowManageSplits(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Training Program
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manage Splits Section */}
      {showManageSplits && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Manage Programs</h2>
            <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Button>
          </div>

          {/* Create New Split Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Program</CardTitle>
                <CardDescription>Define your training split structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="split-name">Program Name</Label>
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
                    <Label>Training Days</Label>
                    <Button variant="outline" size="sm" onClick={handleAddDay}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Day
                    </Button>
                  </div>

                  {splitDays.map((day, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="grid gap-4 md:grid-cols-4">
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
                        <div className="flex items-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setExpandedDayIndex(expandedDayIndex === index ? null : index)}
                          >
                            <Dumbbell className="mr-2 h-4 w-4" />
                            {(day.exercises?.length || 0)} exercises
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveDay(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Expanded Exercise Picker */}
                      {expandedDayIndex === index && (
                        <div className="border-t pt-4 space-y-4">
                          {/* Current exercises */}
                          {day.exercises && day.exercises.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Selected Exercises</Label>
                              {day.exercises.map((exercise) => (
                                <div key={exercise.exerciseId} className="flex items-center gap-2 p-2 bg-muted rounded">
                                  <span className="flex-1 font-medium">{exercise.exerciseName}</span>
                                  <Input
                                    type="number"
                                    placeholder="Sets"
                                    value={exercise.targetSets || ""}
                                    onChange={(e) => handleUpdateExerciseInDay(index, exercise.exerciseId, "targetSets", parseInt(e.target.value) || undefined)}
                                    className="w-16"
                                  />
                                  <span className="text-muted-foreground">x</span>
                                  <Input
                                    placeholder="Reps"
                                    value={exercise.targetReps || ""}
                                    onChange={(e) => handleUpdateExerciseInDay(index, exercise.exerciseId, "targetReps", e.target.value)}
                                    className="w-20"
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleRemoveExerciseFromDay(index, exercise.exerciseId)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Exercise search and add */}
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Add Exercises</Label>
                            <Input
                              placeholder="Search exercises..."
                              value={exerciseSearch}
                              onChange={(e) => setExerciseSearch(e.target.value)}
                            />
                            {availableExercises.length > 0 && (
                              <div className="grid gap-1 max-h-48 overflow-y-auto">
                                {availableExercises.slice(0, 20).map((exercise) => {
                                  const isAdded = day.exercises?.some(e => e.exerciseId === exercise.id)
                                  return (
                                    <Button
                                      key={exercise.id}
                                      variant={isAdded ? "secondary" : "ghost"}
                                      size="sm"
                                      className="justify-start"
                                      onClick={() => !isAdded && handleAddExerciseToDay(index, exercise)}
                                      disabled={isAdded}
                                    >
                                      {isAdded && <Check className="mr-2 h-4 w-4" />}
                                      {exercise.name}
                                      <span className="ml-auto text-xs text-muted-foreground capitalize">
                                        {exercise.muscleGroups.replace("_", " ")}
                                      </span>
                                    </Button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateSplit}
                    disabled={!newSplitName || createSplitMutation.isPending}
                  >
                    Create Program
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setNewSplitName("")
                      setNewSplitDescription("")
                      setSplitDays([])
                      setExerciseSearch("")
                      setExpandedDayIndex(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Splits */}
          {isLoading ? (
            <p className="text-muted-foreground">Loading programs...</p>
          ) : splits.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No training programs yet. Create your first one above!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {splits.map((split) => (
                <Card 
                  key={split.id} 
                  className={split.isActive ? "border-2 border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {split.name}
                          {split.isActive && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
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
                          <div key={day.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                            <span className="font-medium">{day.name}</span>
                            <span className="text-muted-foreground">
                              {day.exercises?.length || 0} exercises
                            </span>
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
      )}
    </div>
  )
}
