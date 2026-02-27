"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Plus, Trash2, CheckCircle2, Circle, Edit, X, Save, Dumbbell, Clock, 
  ChevronDown, ChevronUp, Play, Search, ArrowLeft, Settings2, Check, Copy,
  ArrowUp, ArrowDown, Download, AlertTriangle, Sparkles, Moon, StickyNote, Link2
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

type TemplateExercise = {
  id: string
  exerciseId: string
  sets: number
  reps: string
  restTime: number
  notes: string
  order: number
  exercise: Exercise
}

type WorkoutTemplate = {
  id: string
  name: string
  description?: string | null
  category?: string | null
  difficulty?: string | null
  duration?: number | null
  isPublic: boolean
  exercises?: TemplateExercise[]
}

interface ExerciseInput {
  exerciseId: string
  exerciseName: string
  targetSets?: number
  targetReps?: string
  restTime?: number
  notes?: string
  supersetGroup?: number // Group exercises into supersets
}

interface SplitDayInput {
  dayOfWeek: number
  name: string
  description?: string
  order?: number
  exercises?: ExerciseInput[]
  isRestDay?: boolean
  notes?: string
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const MUSCLE_GROUPS = [
  "abs", "back", "biceps", "calves", "chest", "glutes",
  "hamstrings", "quads", "shoulders", "traps", "triceps"
]

// Pre-built program templates
const PROGRAM_TEMPLATES = {
  ppl: {
    name: "Push Pull Legs",
    description: "6-day split targeting push, pull, and leg movements",
    days: [
      { dayOfWeek: 1, name: "Push A", description: "Chest, shoulders, triceps", exercises: [] },
      { dayOfWeek: 2, name: "Pull A", description: "Back, biceps, rear delts", exercises: [] },
      { dayOfWeek: 3, name: "Legs A", description: "Quads, hamstrings, calves", exercises: [] },
      { dayOfWeek: 4, name: "Push B", description: "Chest, shoulders, triceps", exercises: [] },
      { dayOfWeek: 5, name: "Pull B", description: "Back, biceps, rear delts", exercises: [] },
      { dayOfWeek: 6, name: "Legs B", description: "Quads, hamstrings, calves", exercises: [] },
    ],
  },
  upperLower: {
    name: "Upper Lower",
    description: "4-day split alternating upper and lower body",
    days: [
      { dayOfWeek: 1, name: "Upper A", description: "Chest, back, shoulders, arms", exercises: [] },
      { dayOfWeek: 2, name: "Lower A", description: "Quads, hamstrings, glutes, calves", exercises: [] },
      { dayOfWeek: 4, name: "Upper B", description: "Chest, back, shoulders, arms", exercises: [] },
      { dayOfWeek: 5, name: "Lower B", description: "Quads, hamstrings, glutes, calves", exercises: [] },
    ],
  },
  broSplit: {
    name: "Bro Split",
    description: "5-day split with dedicated muscle group days",
    days: [
      { dayOfWeek: 1, name: "Chest", description: "All chest movements", exercises: [] },
      { dayOfWeek: 2, name: "Back", description: "All back movements", exercises: [] },
      { dayOfWeek: 3, name: "Shoulders", description: "All shoulder movements", exercises: [] },
      { dayOfWeek: 4, name: "Arms", description: "Biceps and triceps", exercises: [] },
      { dayOfWeek: 5, name: "Legs", description: "Quads, hamstrings, calves", exercises: [] },
    ],
  },
  fullBody: {
    name: "Full Body",
    description: "3-day full body workouts",
    days: [
      { dayOfWeek: 1, name: "Full Body A", description: "Compound focus", exercises: [] },
      { dayOfWeek: 3, name: "Full Body B", description: "Balanced training", exercises: [] },
      { dayOfWeek: 5, name: "Full Body C", description: "Accessory focus", exercises: [] },
    ],
  },
}

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
  const [activeTab, setActiveTab] = useState<"programs" | "templates">("programs")
  const [selectedDay, setSelectedDay] = useState<SplitDay | null>(null)
  const [showManageSplits, setShowManageSplits] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newSplitName, setNewSplitName] = useState("")
  const [newSplitDescription, setNewSplitDescription] = useState("")
  const [splitDays, setSplitDays] = useState<SplitDayInput[]>([])
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(null)
  const [importingTemplateForDay, setImportingTemplateForDay] = useState<number | null>(null)
  
  // Template state
  const [showPublicTemplates, setShowPublicTemplates] = useState(false)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateCategory, setTemplateCategory] = useState("")
  const [templateDifficulty, setTemplateDifficulty] = useState("beginner")
  const [templateDuration, setTemplateDuration] = useState("")
  const [templateExercises, setTemplateExercises] = useState<
    Array<{ exerciseId: string; sets: number; reps: string; restTime: number; notes: string }>
  >([])

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
    enabled: isCreating || isCreatingTemplate,
  })

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ["templates", showPublicTemplates],
    queryFn: async () => {
      const res = await fetch(`/api/templates?public=${showPublicTemplates}`)
      if (!res.ok) throw new Error("Failed to fetch templates")
      return res.json()
    },
    enabled: activeTab === "templates" || isCreating, // Also fetch when creating a program for import
  })

  const templates: WorkoutTemplate[] = templatesData || []
  const availableExercises: Exercise[] = exercisesData?.exercises || []

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      category?: string | null
      difficulty?: string
      duration?: number | null
      exercises: Array<{ exerciseId: string; sets: number; reps: string; restTime: number; notes: string; order: number }>
    }) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create template")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      resetTemplateForm()
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete template")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
    },
  })

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: WorkoutTemplate) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          difficulty: template.difficulty,
          duration: template.duration,
          exercises: template.exercises?.map((ex, index) => ({
            exerciseId: ex.exerciseId || ex.exercise?.id,
            sets: ex.sets,
            reps: ex.reps,
            restTime: ex.restTime,
            notes: ex.notes,
            order: index,
          })) || [],
        }),
      })
      if (!res.ok) throw new Error("Failed to duplicate template")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
    },
  })

  const startWorkoutMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch("/api/templates/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      })
      if (!res.ok) throw new Error("Failed to start workout")
      return res.json()
    },
    onSuccess: (data) => {
      window.location.href = `/dashboard/history?session=${data.sessionId}`
    },
  })

  const resetTemplateForm = () => {
    setIsCreatingTemplate(false)
    setEditingTemplateId(null)
    setTemplateName("")
    setTemplateDescription("")
    setTemplateCategory("")
    setTemplateDifficulty("beginner")
    setTemplateDuration("")
    setTemplateExercises([])
  }

  const loadTemplateForEdit = (template: WorkoutTemplate) => {
    setEditingTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateDescription(template.description || "")
    setTemplateCategory(template.category || "")
    setTemplateDifficulty(template.difficulty || "beginner")
    setTemplateDuration(template.duration?.toString() || "")
    setTemplateExercises(
      template.exercises?.map((ex) => ({
        exerciseId: ex.exerciseId || ex.exercise?.id || "",
        sets: ex.sets || 3,
        reps: ex.reps || "8-12",
        restTime: ex.restTime || 90,
        notes: ex.notes || "",
      })) || []
    )
    setIsCreatingTemplate(true)
  }

  const handleSubmitTemplate = () => {
    if (!templateName || templateExercises.length === 0) {
      alert("Please provide a name and add at least one exercise")
      return
    }
    const invalidExercise = templateExercises.find(ex => !ex.exerciseId)
    if (invalidExercise) {
      alert("Please select an exercise for all items")
      return
    }
    createTemplateMutation.mutate({
      name: templateName,
      description: templateDescription || undefined,
      category: templateCategory || null,
      difficulty: templateDifficulty,
      duration: templateDuration ? parseInt(templateDuration) : null,
      exercises: templateExercises.map((ex, index) => ({ ...ex, order: index })),
    })
  }

  const addTemplateExercise = () => {
    setTemplateExercises([
      ...templateExercises,
      { exerciseId: "", sets: 3, reps: "8-12", restTime: 90, notes: "" },
    ])
  }

  const removeTemplateExercise = (index: number) => {
    setTemplateExercises(templateExercises.filter((_, i) => i !== index))
  }

  const updateTemplateExercise = (index: number, field: string, value: string | number) => {
    const updated = [...templateExercises]
    updated[index] = { ...updated[index], [field]: value }
    setTemplateExercises(updated)
  }

  const createSplitMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; days?: SplitDayInput[] }) => {
      console.log("Creating split with data:", data)
      const res = await fetch("/api/splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.text()
        console.error("Create split failed:", error)
        throw new Error("Failed to create split")
      }
      return res.json()
    },
    onSuccess: async (result, variables) => {
      console.log("Split created:", result)
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
    onError: (error) => {
      console.error("Mutation error:", error)
      alert("Failed to create program: " + error.message)
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

  const applyTemplate = (templateKey: keyof typeof PROGRAM_TEMPLATES) => {
    const template = PROGRAM_TEMPLATES[templateKey]
    setNewSplitName(template.name)
    setNewSplitDescription(template.description)
    setSplitDays(template.days.map((day, index) => ({
      ...day,
      order: index,
      exercises: [],
    })))
  }

  const handleCopyDay = (index: number) => {
    const dayToCopy = splitDays[index]
    const copiedDay = {
      ...dayToCopy,
      name: `${dayToCopy.name} (Copy)`,
      dayOfWeek: (dayToCopy.dayOfWeek + 1) % 7,
      exercises: dayToCopy.exercises ? [...dayToCopy.exercises] : [],
    }
    setSplitDays([...splitDays, copiedDay])
  }

  // Calculate estimated duration for a day based on exercises
  const calculateDayDuration = (exercises: ExerciseInput[] | undefined): number => {
    if (!exercises || exercises.length === 0) return 0
    let totalMinutes = 0
    for (const ex of exercises) {
      const sets = ex.targetSets || 3
      const restSeconds = ex.restTime || 90
      // ~45 sec per set + rest time
      totalMinutes += (sets * 45 + sets * restSeconds) / 60
    }
    // Add warmup time
    return Math.round(totalMinutes + 5)
  }

  // Calculate muscle coverage for a day's exercises
  const getDayMuscleCoverage = (exercises: ExerciseInput[] | undefined): Record<string, number> => {
    if (!exercises || exercises.length === 0) return {}
    const coverage: Record<string, number> = {}
    
    for (const ex of exercises) {
      const fullExercise = availableExercises.find(e => e.id === ex.exerciseId)
      if (fullExercise?.muscleGroups) {
        const muscles = fullExercise.muscleGroups.split(',').map(m => m.trim().toLowerCase())
        for (const muscle of muscles) {
          coverage[muscle] = (coverage[muscle] || 0) + (ex.targetSets || 3)
        }
      }
    }
    return coverage
  }

  // Get validation warnings for a day
  const getDayWarnings = (day: SplitDayInput): string[] => {
    const warnings: string[] = []
    
    // No warnings for rest days
    if (day.isRestDay) return warnings
    
    if (!day.exercises || day.exercises.length === 0) {
      warnings.push("No exercises added")
      return warnings
    }
    
    // Check for very short or very long workouts
    const duration = calculateDayDuration(day.exercises)
    if (duration > 90) {
      warnings.push("Workout may be too long (90+ min)")
    }
    
    // Check for exercises without sets
    const noSets = day.exercises.filter(e => !e.targetSets || e.targetSets < 1)
    if (noSets.length > 0) {
      warnings.push(`${noSets.length} exercise(s) missing sets`)
    }
    
    // Check for muscle imbalance (e.g., all push, no pull)
    const coverage = getDayMuscleCoverage(day.exercises)
    const hasPush = (coverage['chest'] || 0) + (coverage['shoulders'] || 0) + (coverage['triceps'] || 0)
    const hasPull = (coverage['back'] || 0) + (coverage['biceps'] || 0)
    if (hasPush > 0 && hasPull === 0 && day.exercises.length >= 3) {
      warnings.push("Consider adding pulling exercises for balance")
    }
    if (hasPull > 0 && hasPush === 0 && day.exercises.length >= 3) {
      warnings.push("Consider adding pushing exercises for balance")
    }
    
    return warnings
  }

  // Get smart suggestions for exercises to add to a day
  const getSmartSuggestions = (day: SplitDayInput): Exercise[] => {
    if (!day.exercises || day.exercises.length === 0) return []
    if (availableExercises.length === 0) return []
    
    const coverage = getDayMuscleCoverage(day.exercises)
    const currentIds = new Set(day.exercises.map(e => e.exerciseId))
    
    // Find the primary muscle focus
    const muscles = Object.entries(coverage).sort((a, b) => b[1] - a[1])
    if (muscles.length === 0) return []
    
    const primaryMuscle = muscles[0][0]
    
    // Suggest complementary exercises for the same muscle group
    const suggestions = availableExercises
      .filter(ex => !currentIds.has(ex.id))
      .filter(ex => {
        const exMuscles = ex.muscleGroups?.toLowerCase() || ''
        return exMuscles.includes(primaryMuscle)
      })
      .slice(0, 3)
    
    return suggestions
  }

  const handleRemoveDay = (index: number) => {
    setSplitDays(splitDays.filter((_, i) => i !== index))
    if (expandedDayIndex === index) setExpandedDayIndex(null)
  }

  const handleDayChange = (index: number, field: string, value: string | number | boolean) => {
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

  // Move exercise up or down within a day
  const handleMoveExerciseInDay = (dayIndex: number, exerciseIndex: number, direction: 'up' | 'down') => {
    const updated = [...splitDays]
    const exercises = [...(updated[dayIndex].exercises || [])]
    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1
    
    if (newIndex < 0 || newIndex >= exercises.length) return
    
    // Swap exercises
    const temp = exercises[exerciseIndex]
    exercises[exerciseIndex] = exercises[newIndex]
    exercises[newIndex] = temp
    
    updated[dayIndex].exercises = exercises
    setSplitDays(updated)
  }

  // Import exercises from a saved template into a day
  const handleImportFromTemplate = (dayIndex: number, template: WorkoutTemplate) => {
    const updated = [...splitDays]
    const currentExercises = updated[dayIndex].exercises || []
    
    // Map template exercises to day exercise format
    const templateExercises = (template.exercises || []).map(ex => ({
      exerciseId: ex.exerciseId || ex.exercise?.id || '',
      exerciseName: ex.exercise?.name || 'Unknown Exercise',
      targetSets: ex.sets,
      targetReps: ex.reps,
      restTime: ex.restTime,
      notes: ex.notes,
    })).filter(ex => ex.exerciseId) // Filter out invalid entries
    
    // Merge with existing, avoiding duplicates
    const existingIds = new Set(currentExercises.map(e => e.exerciseId))
    const newExercises = templateExercises.filter(ex => !existingIds.has(ex.exerciseId))
    
    updated[dayIndex].exercises = [...currentExercises, ...newExercises]
    setSplitDays(updated)
    setImportingTemplateForDay(null) // Close dropdown
  }

  const handleCreateSplit = () => {
    if (!newSplitName) {
      console.log("No split name provided")
      return
    }
    const payload = {
      name: newSplitName,
      description: newSplitDescription || undefined,
      days: splitDays.length > 0 ? splitDays.map((day, index) => ({
        ...day,
        order: index,
      })) : undefined,
    }
    console.log("Calling createSplitMutation with:", payload)
    createSplitMutation.mutate(payload)
  }

  // Show day detail view if a day is selected
  if (selectedDay) {
    return <DayExerciseManager splitDay={selectedDay} onClose={() => setSelectedDay(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training</h1>
          <p className="text-muted-foreground">
            {activeTab === "programs" 
              ? (activeSplit ? `Current program: ${activeSplit.name}` : "Select a training program to get started")
              : "Quick workout templates"
            }
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b pb-2">
        <Button 
          variant={activeTab === "programs" ? "default" : "ghost"}
          onClick={() => setActiveTab("programs")}
          className="rounded-b-none"
        >
          <Dumbbell className="mr-2 h-4 w-4" />
          Programs
        </Button>
        <Button 
          variant={activeTab === "templates" ? "default" : "ghost"}
          onClick={() => setActiveTab("templates")}
          className="rounded-b-none"
        >
          <Play className="mr-2 h-4 w-4" />
          Quick Workouts
        </Button>
      </div>

      {/* Programs Tab */}
      {activeTab === "programs" && (
        <div className="space-y-6">
          <div className="flex justify-end">
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
              <CardContent className="space-y-6">
                {/* Quick Start Templates */}
                {splitDays.length === 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Quick Start - Choose a Template</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => applyTemplate("ppl")}
                      >
                        <span className="font-semibold">Push Pull Legs</span>
                        <span className="text-xs text-muted-foreground">6 days/week</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => applyTemplate("upperLower")}
                      >
                        <span className="font-semibold">Upper Lower</span>
                        <span className="text-xs text-muted-foreground">4 days/week</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => applyTemplate("broSplit")}
                      >
                        <span className="font-semibold">Bro Split</span>
                        <span className="text-xs text-muted-foreground">5 days/week</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => applyTemplate("fullBody")}
                      >
                        <span className="font-semibold">Full Body</span>
                        <span className="text-xs text-muted-foreground">3 days/week</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">or create from scratch</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Week Preview */}
                {splitDays.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Week Preview</Label>
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map((dayName, i) => {
                        const dayData = splitDays.find(d => d.dayOfWeek === i)
                        const hasWorkout = dayData && !dayData.isRestDay
                        const isRestDay = dayData?.isRestDay
                        return (
                          <div
                            key={i}
                            className={`flex-1 text-center py-2 rounded text-xs font-medium ${
                              hasWorkout 
                                ? "bg-primary text-primary-foreground" 
                                : isRestDay
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                            }`}
                            title={dayData?.name || "Rest"}
                          >
                            {dayName.slice(0, 3)}
                            {isRestDay && <Moon className="h-3 w-3 mx-auto mt-0.5" />}
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {splitDays.filter(d => !d.isRestDay).length} training days • {splitDays.filter(d => d.isRestDay).length || 0} marked rest • {7 - splitDays.length} unplanned
                    </p>
                  </div>
                )}

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
                        {/* Day Notes */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <StickyNote className="h-4 w-4" />
                            Notes
                          </Label>
                          <textarea
                            placeholder="Equipment needed, tips, modifications..."
                            value={day.notes || ""}
                            onChange={(e) => handleDayChange(index, "notes", e.target.value)}
                            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          {/* Rest Day Toggle */}
                          <Button 
                            variant={day.isRestDay ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDayChange(index, "isRestDay", !day.isRestDay)}
                            title="Toggle rest day"
                          >
                            <Moon className="mr-2 h-4 w-4" />
                            {day.isRestDay ? "Rest Day" : "Training Day"}
                          </Button>
                          {!day.isRestDay && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setExpandedDayIndex(expandedDayIndex === index ? null : index)}
                            >
                              <Dumbbell className="mr-2 h-4 w-4" />
                              {(day.exercises?.length || 0)} exercises
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCopyDay(index)}
                            title="Copy this day"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveDay(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Rest Day Indicator */}
                      {day.isRestDay && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Moon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-muted-foreground">Recovery day - rest and prepare for your next workout</span>
                        </div>
                      )}
                      
                      {/* Duration Estimate - only show if not rest day */}
                      {!day.isRestDay && day.exercises && day.exercises.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>~{calculateDayDuration(day.exercises)} min estimated</span>
                        </div>
                      )}
                      
                      {/* Muscle Coverage Visual */}
                      {!day.isRestDay && day.exercises && day.exercises.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(getDayMuscleCoverage(day.exercises)).map(([muscle, sets]) => (
                            <span 
                              key={muscle} 
                              className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize"
                              title={`${sets} sets for ${muscle}`}
                            >
                              {muscle} ({sets})
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Validation Warnings */}
                      {!day.isRestDay && getDayWarnings(day).length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-600 dark:text-yellow-400">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            {getDayWarnings(day).map((warning, i) => (
                              <div key={i}>{warning}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Expanded Exercise Picker */}
                      {!day.isRestDay && expandedDayIndex === index && (
                        <div className="border-t pt-4 space-y-4">
                          {/* Current exercises */}
                          {day.exercises && day.exercises.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Selected Exercises</Label>
                              {day.exercises.map((exercise, exIndex) => (
                                <div key={exercise.exerciseId} className="flex items-center gap-2 p-2 bg-muted rounded">
                                  {/* Reorder buttons */}
                                  <div className="flex flex-col">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleMoveExerciseInDay(index, exIndex, 'up')}
                                      disabled={exIndex === 0}
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleMoveExerciseInDay(index, exIndex, 'down')}
                                      disabled={exIndex === (day.exercises?.length || 0) - 1}
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  </div>
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
                          
                          {/* Import from Template */}
                          {templates.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm text-muted-foreground">Import from Template</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setImportingTemplateForDay(importingTemplateForDay === index ? null : index)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Import
                                </Button>
                              </div>
                              {importingTemplateForDay === index && (
                                <div className="grid gap-1 max-h-32 overflow-y-auto border rounded p-2">
                                  {templates.map(template => (
                                    <Button
                                      key={template.id}
                                      variant="ghost"
                                      size="sm"
                                      className="justify-start"
                                      onClick={() => handleImportFromTemplate(index, template)}
                                    >
                                      <span className="truncate">{template.name}</span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        ({template.exercises?.length || 0} exercises)
                                      </span>
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Smart Suggestions */}
                          {day.exercises && day.exercises.length > 0 && getSmartSuggestions(day).length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <Label className="text-sm text-muted-foreground">Suggested Exercises</Label>
                              </div>
                              <div className="grid gap-1">
                                {getSmartSuggestions(day).map(exercise => (
                                  <Button
                                    key={exercise.id}
                                    variant="outline"
                                    size="sm"
                                    className="justify-start"
                                    onClick={() => handleAddExerciseToDay(index, exercise)}
                                  >
                                    <Plus className="h-3 w-3 mr-2" />
                                    <span className="truncate">{exercise.name}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {exercise.muscleGroups}
                                    </span>
                                  </Button>
                                ))}
                              </div>
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
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          {/* Templates Header */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={!showPublicTemplates ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPublicTemplates(false)}
              >
                My Templates
              </Button>
              <Button 
                variant={showPublicTemplates ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPublicTemplates(true)}
              >
                Public Library
              </Button>
            </div>
            {!showPublicTemplates && (
              <Button onClick={() => setIsCreatingTemplate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            )}
          </div>

          {/* Create/Edit Template Form */}
          {isCreatingTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>{editingTemplateId ? "Edit Template" : "Create New Template"}</CardTitle>
                <CardDescription>Build a reusable workout template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Template Name *</Label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Push Day, Full Body A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Optional description..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                      <option value="hiit">HIIT</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="full_body">Full Body</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={templateDifficulty}
                      onChange={(e) => setTemplateDifficulty(e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      value={templateDuration}
                      onChange={(e) => setTemplateDuration(e.target.value)}
                      placeholder="60"
                    />
                  </div>
                </div>

                {/* Template Exercises */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Exercises *</Label>
                    <Button variant="link" size="sm" onClick={addTemplateExercise}>
                      + Add Exercise
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {templateExercises.map((ex, index) => (
                      <div key={index} className="p-4 border rounded-md bg-muted/50 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                              value={ex.exerciseId}
                              onChange={(e) => updateTemplateExercise(index, "exerciseId", e.target.value)}
                            >
                              <option value="">Select exercise...</option>
                              {availableExercises.map((exercise) => (
                                <option key={exercise.id} value={exercise.id}>
                                  {exercise.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeTemplateExercise(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Sets</Label>
                            <Input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateTemplateExercise(index, "sets", parseInt(e.target.value))}
                              min={1}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Reps</Label>
                            <Input
                              value={ex.reps}
                              onChange={(e) => updateTemplateExercise(index, "reps", e.target.value)}
                              placeholder="8-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rest (sec)</Label>
                            <Input
                              type="number"
                              value={ex.restTime}
                              onChange={(e) => updateTemplateExercise(index, "restTime", parseInt(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Notes</Label>
                            <Input
                              value={ex.notes}
                              onChange={(e) => updateTemplateExercise(index, "notes", e.target.value)}
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {templateExercises.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No exercises added yet. Click &quot;+ Add Exercise&quot; to start.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSubmitTemplate}
                    disabled={createTemplateMutation.isPending}
                  >
                    {createTemplateMutation.isPending ? "Creating..." : (editingTemplateId ? "Save Changes" : "Create Template")}
                  </Button>
                  <Button variant="outline" onClick={resetTemplateForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Templates List */}
          {templatesLoading ? (
            <p className="text-muted-foreground">Loading templates...</p>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {showPublicTemplates
                    ? "No public templates available yet"
                    : "No templates yet. Create your first template!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.category && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                          {template.category}
                        </span>
                      )}
                      {template.difficulty && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          template.difficulty === "beginner"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : template.difficulty === "intermediate"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        }`}>
                          {template.difficulty}
                        </span>
                      )}
                      {template.duration && (
                        <span className="px-2 py-1 bg-muted rounded-full text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {template.duration} min
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.exercises?.length || 0} exercises
                      </p>
                      <div className="space-y-1">
                        {template.exercises?.slice(0, 3).map((ex) => (
                          <div key={ex.id} className="text-sm flex items-center gap-2">
                            <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">
                              {ex.sets}
                            </span>
                            <span>{ex.exercise?.name}</span>
                          </div>
                        ))}
                        {(template.exercises?.length || 0) > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{(template.exercises?.length || 0) - 3} more
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => startWorkoutMutation.mutate(template.id)}
                        disabled={startWorkoutMutation.isPending}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                      {!showPublicTemplates && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => loadTemplateForEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => duplicateTemplateMutation.mutate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Delete "${template.name}"?`)) {
                                deleteTemplateMutation.mutate(template.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {showPublicTemplates && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => duplicateTemplateMutation.mutate(template)}
                          title="Copy to my templates"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
