"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Play, Square, Clock, Dumbbell, Timer, CheckCircle2, Trophy } from "lucide-react"
import { format } from "date-fns"

type Exercise = {
  id: string
  name: string
  muscleGroups: string[]
}

type ExerciseSet = {
  id: string
  exerciseId: string
  setNumber: number
  weight?: number | null
  reps?: number | null
  rpe?: number | null
  restTime?: number | null
  isWarmup: boolean
  notes?: string | null
  completedAt: string
  exercise: Exercise
}

type WorkoutSession = {
  id: string
  name?: string | null
  startedAt: string
  completedAt?: string | null
  duration?: number | null
  notes?: string | null
  mood?: string | null
  energyLevel?: number | null
  sets: ExerciseSet[]
}

function RestTimer({ duration, onComplete }: { duration: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(duration)

  useEffect(() => {
    if (remaining <= 0) {
      onComplete()
      return
    }

    const timer = setInterval(() => {
      setRemaining((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [remaining, onComplete])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="text-center p-4 bg-primary/10 rounded-lg">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Timer className="h-5 w-5" />
        <span className="text-2xl font-bold">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">Rest time remaining</p>
    </div>
  )
}

function ActiveWorkout({ session }: { session: WorkoutSession }) {
  const queryClient = useQueryClient()
  const [selectedExerciseId, setSelectedExerciseId] = useState("")
  const [weight, setWeight] = useState<number | "">("")
  const [reps, setReps] = useState<number | "">("")
  const [rpe, setRpe] = useState<number | "">("")
  const [isWarmup, setIsWarmup] = useState(false)
  const [notes, setNotes] = useState("")
  const [restTimerDuration, setRestTimerDuration] = useState<number | null>(null)

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const res = await fetch("/api/exercises")
      if (!res.ok) throw new Error("Failed to fetch exercises")
      return res.json()
    },
  })

  const addSetMutation = useMutation({
    mutationFn: async (setData: any) => {
      const res = await fetch(`/api/sessions/${session.id}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setData),
      })
      if (!res.ok) throw new Error("Failed to add set")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      queryClient.invalidateQueries({ queryKey: ["sessionSets", session.id] })
      setWeight("")
      setReps("")
      setRpe("")
      setNotes("")
      setIsWarmup(false)
      
      // Show PR celebration if any PRs were achieved
      if (data.prResults) {
        const prTypes = [];
        if (data.prResults.oneRepMax) prTypes.push("1RM");
        if (data.prResults.maxVolume) prTypes.push("Volume");
        if (data.prResults.maxReps) prTypes.push("Reps");
        
        if (prTypes.length > 0) {
          alert(`🏆 New PR! ${prTypes.join(", ")} - Great job!`);
        }
      }
      
      // Start rest timer if a rest time was set
      if (data.set.restTime) {
        setRestTimerDuration(data.set.restTime)
      }
    },
  })

  const completeSessionMutation = useMutation({
    mutationFn: async (data: { notes?: string; mood?: string; energyLevel?: number }) => {
      const res = await fetch(`/api/sessions?id=${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to complete session")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })

  const deleteSetMutation = useMutation({
    mutationFn: async (setId: string) => {
      const res = await fetch(`/api/sessions/${session.id}/sets?setId=${setId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete set")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      queryClient.invalidateQueries({ queryKey: ["sessionSets", session.id] })
    },
  })

  const handleAddSet = () => {
    if (!selectedExerciseId) return

    const setsForExercise = session.sets.filter((s) => s.exerciseId === selectedExerciseId)
    const setNumber = setsForExercise.length + 1

    addSetMutation.mutate({
      exerciseId: selectedExerciseId,
      setNumber,
      weight: weight || undefined,
      reps: reps || undefined,
      rpe: rpe || undefined,
      restTime: 90, // Default 90 seconds
      isWarmup,
      notes: notes || undefined,
    })
  }

  const handleCompleteSession = () => {
    if (window.confirm("Are you sure you want to complete this workout?")) {
      completeSessionMutation.mutate({})
    }
  }

  const availableExercises = exercises?.exercises || []
  const groupedSets = session.sets.reduce((acc, set) => {
    if (!acc[set.exerciseId]) {
      acc[set.exerciseId] = []
    }
    acc[set.exerciseId].push(set)
    return acc
  }, {} as Record<string, ExerciseSet[]>)

  return (
    <div className="space-y-6">
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                Active Workout
              </CardTitle>
              <CardDescription>
                Started {format(new Date(session.startedAt), "PPp")}
              </CardDescription>
            </div>
            <Button variant="destructive" onClick={handleCompleteSession}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Workout
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {restTimerDuration && (
            <RestTimer
              duration={restTimerDuration}
              onComplete={() => setRestTimerDuration(null)}
            />
          )}

          <div className="space-y-3">
            <Label>Add Exercise Set</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
            >
              <option value="">Select exercise...</option>
              {availableExercises.map((ex: any) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Weight (kg/lbs)</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || "")}
                />
              </div>
              <div>
                <Label className="text-xs">Reps</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || "")}
                />
              </div>
              <div>
                <Label className="text-xs">RPE (1-10)</Label>
                <Input
                  type="number"
                  placeholder="8"
                  min="1"
                  max="10"
                  value={rpe}
                  onChange={(e) => setRpe(parseFloat(e.target.value) || "")}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="warmup"
                checked={isWarmup}
                onChange={(e) => setIsWarmup(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="warmup" className="text-sm">Warmup set</Label>
            </div>

            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Button
              onClick={handleAddSet}
              disabled={!selectedExerciseId || addSetMutation.isPending}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Set
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.keys(groupedSets).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Sets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedSets).map(([exerciseId, sets]) => (
                <div key={exerciseId} className="border rounded-lg p-3">
                  <div className="font-medium mb-2">{sets[0].exercise.name}</div>
                  <div className="space-y-2">
                    {sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Set {set.setNumber}</span>
                          {set.isWarmup && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-700 px-2 py-0.5 rounded">
                              Warmup
                            </span>
                          )}
                          {set.weight && <span>{set.weight} kg/lbs</span>}
                          {set.reps && <span>× {set.reps} reps</span>}
                          {set.rpe && <span className="text-muted-foreground">RPE {set.rpe}</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSetMutation.mutate(set.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/sessions")
      if (!res.ok) throw new Error("Failed to fetch sessions")
      return res.json()
    },
  })

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Workout Session" }),
      })
      if (!res.ok) throw new Error("Failed to start session")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sessions?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete session")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })

  const sessions: WorkoutSession[] = data?.sessions || []
  const activeSession = sessions.find((s) => !s.completedAt)
  const completedSessions = sessions.filter((s) => s.completedAt)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workout Sessions</h1>
          <p className="text-muted-foreground">
            Track your live workouts and review history
          </p>
        </div>
        {!activeSession && (
          <Button onClick={() => startSessionMutation.mutate()} disabled={startSessionMutation.isPending}>
            <Play className="mr-2 h-4 w-4" />
            Start Workout
          </Button>
        )}
      </div>

      {activeSession && <ActiveWorkout session={activeSession} />}

      {isLoading ? (
        <p className="text-muted-foreground">Loading sessions...</p>
      ) : completedSessions.length === 0 && !activeSession ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              No workout sessions recorded yet
            </p>
            <p className="text-sm text-muted-foreground">
              Start your first workout to begin tracking your progress
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Completed Workouts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {session.name || "Workout Session"}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(session.startedAt), "PPP")}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSessionMutation.mutate(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {session.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.duration} min
                      </span>
                    )}
                    <span>{session.sets.length} sets</span>
                  </div>

                  {session.sets.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-1">Exercises:</div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(session.sets.map((s) => s.exercise.name))).map(
                          (name) => (
                            <span
                              key={name}
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                            >
                              {name}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {session.notes && (
                    <div className="text-sm text-muted-foreground italic">
                      {session.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
