"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Play, Square, Clock, Dumbbell, Timer, CheckCircle2, Trophy, Flame } from "lucide-react"
import { format } from "date-fns"
import { ExerciseSet, WorkoutSession, Exercise } from "@/types/dashboard"
import OverloadSuggestionCard from "@/components/OverloadSuggestion"

interface SetData {
  exerciseId: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  restTime?: number;
  isWarmup: boolean;
  notes?: string;
}

interface PRResult {
  oneRepMax?: boolean;
  maxVolume?: boolean;
  maxReps?: boolean;
}

interface SetResponse {
  set: ExerciseSet;
  prResults?: PRResult;
}

function RestTimer({ duration, onComplete }: { duration: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(duration)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (remaining <= 0) {
      // Play notification sound (if available)
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJuGYF5wgYBpYV50c3ZfWWmJiJh2bHKBgHtpYmhoa2ZgYmpqZmBmaW5sZmVmanNvbGhqa2lpZWRjYGBhYWJiYmNkZGRlZWZmZ2doaWlqa2tsbG1tbm5vb3BwcHFxcXJycnNzc3R0dHV1dXZ2dnd3d3h4eHl5eXp6ent7e3x8fH19fX5+fn9/f4CAgIGBgYKCgoODg4SEhIWFhYaGhoeHh4iIiImJiYqKiouLi4yMjI2NjY6Ojo+Pj5CQkJGRkZKSkpOTk5SUlJWVlZaWlpeXl5iYmJmZmZqampubm5ycnJ2dnZ6enp+fn6CgoKGhoaKioqOjo6SkpKWlpaampqenp6ioqKmpqaqqqqurq6ysrK2tra6urq+vr7CwsLGxsbKysrOzs7S0tLW1tba2tre3t7i4uLm5ubq6uru7u7y8vL29vb6+vr+/v8DAwMHBwcLCwsPDw8TExMXFxcbGxsfHx8jIyMnJycrKysvLy8zMzM3Nzc7Ozs/Pz9DQ0NHR0dLS0tPT09TU1NXV1dbW1tfX19jY2NnZ2dra2tvb29zc3N3d3d7e3t/f3+Dg4OHh4eLi4uPj4+Tk5OXl5ebm5ufn5+jo6Onp6erq6uvr6+zs7O3t7e7u7u/v7/Dw8PHx8fLy8vPz8/T09PX19fb29vf39/j4+Pn5+fr6+vv7+/z8/P39/f7+/v///w==")
        audio.volume = 0.5
        audio.play().catch(() => {})
      } catch (e) {}
      onComplete()
      return
    }

    if (isPaused) return

    const timer = setInterval(() => {
      setRemaining((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [remaining, isPaused, onComplete])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = ((duration - remaining) / duration) * 100

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-2 border-primary/30 p-6">
      {/* Progress bar background */}
      <div 
        className="absolute inset-0 bg-primary/10 transition-all duration-1000 ease-linear"
        style={{ width: `${progress}%` }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-2 bg-primary/20 rounded-full animate-pulse">
            <Timer className="h-6 w-6 text-primary" />
          </div>
          <span className="text-4xl font-bold tabular-nums tracking-tight">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground text-center mb-4">Rest time remaining</p>
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="min-w-[80px]"
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onComplete}
            className="min-w-[80px]"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
}

function SessionStats({ session }: { session: WorkoutSession }) {
  const totalVolume = session.sets.reduce((sum, set) => {
    return sum + ((set.weight || 0) * (set.reps || 0))
  }, 0)
  
  const totalSets = session.sets.filter(s => !s.isWarmup).length
  const warmupSets = session.sets.filter(s => s.isWarmup).length
  const exerciseCount = new Set(session.sets.map(s => s.exerciseId)).size
  
  const avgRPE = session.sets.filter(s => s.rpe).length > 0
    ? session.sets.reduce((sum, s) => sum + (s.rpe || 0), 0) / session.sets.filter(s => s.rpe).length
    : null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-4 border border-blue-500/20">
        <div className="text-2xl font-bold text-blue-600">{totalVolume.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Total Volume (lbs)</div>
      </div>
      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-4 border border-green-500/20">
        <div className="text-2xl font-bold text-green-600">{totalSets}</div>
        <div className="text-xs text-muted-foreground">Working Sets</div>
      </div>
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-4 border border-purple-500/20">
        <div className="text-2xl font-bold text-purple-600">{exerciseCount}</div>
        <div className="text-xs text-muted-foreground">Exercises</div>
      </div>
      <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg p-4 border border-orange-500/20">
        <div className="text-2xl font-bold text-orange-600">{avgRPE ? avgRPE.toFixed(1) : "--"}</div>
        <div className="text-xs text-muted-foreground">Avg RPE</div>
      </div>
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
    mutationFn: async (setData: SetData) => {
      const res = await fetch(`/api/sessions/${session.id}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setData),
      })
      if (!res.ok) throw new Error("Failed to add set")
      return res.json() as Promise<SetResponse>
    },
    onSuccess: (data: SetResponse) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      queryClient.invalidateQueries({ queryKey: ["sessionSets", session.id] })
      setWeight("")
      setReps("")
      setRpe("")
      setNotes("")
      setIsWarmup(false)
      
      // Show PR celebration if any PRs were achieved
      if (data.prResults) {
        const prTypes: string[] = [];
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

  const handleCopyLastSet = () => {
    if (!selectedExerciseId) return
    
    const setsForExercise = session.sets.filter((s) => s.exerciseId === selectedExerciseId)
    const lastSet = setsForExercise[setsForExercise.length - 1]
    
    if (lastSet) {
      setWeight(lastSet.weight || "")
      setReps(lastSet.reps || "")
      setRpe(lastSet.rpe || "")
      setIsWarmup(lastSet.isWarmup)
    }
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
      <Card className="border-2 border-primary/50 bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle>Active Workout</CardTitle>
                <CardDescription className="mt-1">
                  {format(new Date(session.startedAt), "MMM d, yyyy 'at' h:mm a")}
                </CardDescription>
              </div>
            </div>
            <Button 
              size="lg"
              variant="default"
              onClick={handleCompleteSession}
              className="w-full sm:w-auto gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Session Stats */}
          {session.sets.length > 0 && <SessionStats session={session} />}

          {/* Rest Timer */}
          {restTimerDuration && (
            <RestTimer
              duration={restTimerDuration}
              onComplete={() => setRestTimerDuration(null)}
            />
          )}

          {/* Exercise Selection */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <Label className="text-base font-semibold">Add Exercise Set</Label>
              <span className="text-xs text-muted-foreground">{session.sets.length} sets logged</span>
            </div>
            <select
              className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-4 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:border-primary font-medium"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
            >
              <option value="">Select an exercise...</option>
              {availableExercises.map((ex: Exercise) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {/* Progressive Overload Suggestion */}
          {selectedExerciseId && (
            <OverloadSuggestionCard
              exerciseId={selectedExerciseId}
              onApplySuggestion={(suggestedWeight, suggestedReps) => {
                setWeight(suggestedWeight)
                setReps(suggestedReps)
              }}
            />
          )}

          {/* Set Input Fields - Mobile Optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-xs font-semibold text-muted-foreground">
                Weight
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="100"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || "")}
                className="h-11 text-lg font-semibold text-center"
              />
              <p className="text-xs text-muted-foreground text-center">kg/lbs</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reps" className="text-xs font-semibold text-muted-foreground">
                Reps
              </Label>
              <Input
                id="reps"
                type="number"
                placeholder="8"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || "")}
                className="h-11 text-lg font-semibold text-center"
              />
              <p className="text-xs text-muted-foreground text-center">reps</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rpe" className="text-xs font-semibold text-muted-foreground">
                RPE
              </Label>
              <Input
                id="rpe"
                type="number"
                placeholder="8"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value) || "")}
                className="h-11 text-lg font-semibold text-center"
              />
              <p className="text-xs text-muted-foreground text-center">/10</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warmup" className="text-xs font-semibold text-muted-foreground">
                Type
              </Label>
              <button
                onClick={() => setIsWarmup(!isWarmup)}
                className={`h-11 w-full rounded-lg font-semibold text-sm transition-all duration-200 ${
                  isWarmup
                    ? "bg-yellow-500/20 border-2 border-yellow-500 text-yellow-700"
                    : "bg-muted border-2 border-input text-muted-foreground hover:border-primary"
                }`}
              >
                {isWarmup ? "Warmup" : "Working"}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground">
              Notes (optional)
            </Label>
            <Input
              id="notes"
              placeholder="How did the set feel?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Add Set Button - Large for mobile */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddSet}
              disabled={!selectedExerciseId || addSetMutation.isPending}
              size="lg"
              className="flex-1 text-base font-semibold gap-2 hover:scale-[1.02] transition-transform"
            >
              <Plus className="h-5 w-5" />
              {addSetMutation.isPending ? "Adding..." : "Add Set"}
            </Button>
            {selectedExerciseId && session.sets.filter(s => s.exerciseId === selectedExerciseId).length > 0 && (
              <Button
                onClick={handleCopyLastSet}
                variant="outline"
                size="lg"
                className="gap-2"
                title="Copy values from last set"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </Button>
            )}
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
