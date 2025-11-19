"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Search, Dumbbell } from "lucide-react"

type Exercise = {
  id: string
  name: string
  description?: string | null
  videoUrl?: string | null
  muscleGroups: string[]
  equipment?: string | null
  difficulty?: string | null
  instructions?: string | null
  tips?: string | null
  isPublic: boolean
}

const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "abs", "traps"
]

const DIFFICULTIES = ["beginner", "intermediate", "advanced"]

export default function ExercisesPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMuscle, setFilterMuscle] = useState("")
  const [filterDifficulty, setFilterDifficulty] = useState("")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([])
  const [equipment, setEquipment] = useState("")
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [instructions, setInstructions] = useState("")
  const [tips, setTips] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["exercises", filterMuscle, filterDifficulty, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterMuscle) params.append("muscleGroup", filterMuscle)
      if (filterDifficulty) params.append("difficulty", filterDifficulty)
      if (searchTerm) params.append("search", searchTerm)

      const res = await fetch(`/api/exercises?${params}`)
      if (!res.ok) throw new Error("Failed to fetch exercises")
      return res.json()
    },
  })

  const createExerciseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create exercise")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] })
      resetForm()
      setIsCreating(false)
    },
  })

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/exercises?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete exercise")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] })
    },
  })

  const resetForm = () => {
    setName("")
    setDescription("")
    setVideoUrl("")
    setSelectedMuscles([])
    setEquipment("")
    setDifficulty("beginner")
    setInstructions("")
    setTips("")
  }

  const handleSubmit = () => {
    if (!name || selectedMuscles.length === 0) return

    createExerciseMutation.mutate({
      name,
      description: description || undefined,
      videoUrl: videoUrl || undefined,
      muscleGroups: selectedMuscles,
      equipment: equipment || undefined,
      difficulty,
      instructions: instructions || undefined,
      tips: tips || undefined,
      isPublic: false,
    })
  }

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    )
  }

  const exercises: Exercise[] = data?.exercises || []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exercise Library</h1>
          <p className="text-muted-foreground">
            Browse and manage exercises
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" />
          {isCreating ? "Cancel" : "Add Exercise"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Exercise</CardTitle>
            <CardDescription>Add a new exercise to your library</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ex-name">Exercise Name *</Label>
                <Input
                  id="ex-name"
                  placeholder="Barbell Bench Press"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-equipment">Equipment</Label>
                <Input
                  id="ex-equipment"
                  placeholder="Barbell"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-description">Description</Label>
              <Input
                id="ex-description"
                placeholder="Compound chest exercise"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Muscle Groups *</Label>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((muscle) => (
                  <Button
                    key={muscle}
                    type="button"
                    variant={selectedMuscles.includes(muscle) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMuscle(muscle)}
                  >
                    {muscle}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-difficulty">Difficulty</Label>
              <select
                id="ex-difficulty"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-video">Video URL</Label>
              <Input
                id="ex-video"
                type="url"
                placeholder="https://youtube.com/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-instructions">Instructions</Label>
              <textarea
                id="ex-instructions"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Step-by-step instructions..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-tips">Tips</Label>
              <textarea
                id="ex-tips"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Form tips and cues..."
                value={tips}
                onChange={(e) => setTips(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!name || selectedMuscles.length === 0 || createExerciseMutation.isPending}
              >
                Create Exercise
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search exercises..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscle-filter">Muscle Group</Label>
              <select
                id="muscle-filter"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={filterMuscle}
                onChange={(e) => setFilterMuscle(e.target.value)}
              >
                <option value="">All</option>
                {MUSCLE_GROUPS.map((muscle) => (
                  <option key={muscle} value={muscle}>
                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty-filter">Difficulty</Label>
              <select
                id="difficulty-filter"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                <option value="">All</option>
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading exercises...</p>
      ) : exercises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No exercises found. Try adjusting your filters or add a new exercise.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                    {exercise.description && (
                      <CardDescription className="mt-1">
                        {exercise.description}
                      </CardDescription>
                    )}
                  </div>
                  {!exercise.isPublic && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteExerciseMutation.mutate(exercise.id)}
                      disabled={deleteExerciseMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Muscles:</div>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.map((muscle) => (
                      <span
                        key={muscle}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                {exercise.equipment && (
                  <div className="text-sm">
                    <span className="font-medium">Equipment:</span> {exercise.equipment}
                  </div>
                )}

                {exercise.difficulty && (
                  <div className="text-sm">
                    <span className="font-medium">Difficulty:</span>{" "}
                    <span className={`
                      ${exercise.difficulty === "beginner" ? "text-green-600" : ""}
                      ${exercise.difficulty === "intermediate" ? "text-yellow-600" : ""}
                      ${exercise.difficulty === "advanced" ? "text-red-600" : ""}
                    `}>
                      {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                    </span>
                  </div>
                )}

                {exercise.videoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(exercise.videoUrl!, "_blank")}
                  >
                    Watch Demo
                  </Button>
                )}

                {(exercise.instructions || exercise.tips) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    View Details
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedExercise(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{selectedExercise.name}</CardTitle>
              {selectedExercise.description && (
                <CardDescription>{selectedExercise.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedExercise.instructions && (
                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedExercise.instructions}
                  </p>
                </div>
              )}
              {selectedExercise.tips && (
                <div>
                  <h3 className="font-semibold mb-2">Tips</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedExercise.tips}
                  </p>
                </div>
              )}
              <Button onClick={() => setSelectedExercise(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
