"use client"

import { useQuery } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, Target, Zap, Minus, Sparkles, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { OverloadSuggestion } from "@/types/dashboard"

interface OverloadSuggestionCardProps {
  exerciseId: string;
  onApplySuggestion?: (weight: number, reps: number) => void;
}

export default function OverloadSuggestionCard({ exerciseId, onApplySuggestion }: OverloadSuggestionCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["suggestion", exerciseId],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/${exerciseId}/suggestion`)
      if (!res.ok) throw new Error("Failed to fetch suggestion")
      return res.json() as Promise<{ suggestion: OverloadSuggestion }>
    },
    enabled: !!exerciseId,
    staleTime: 60000, // Cache for 1 minute
  })

  if (!exerciseId) return null
  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 p-4 animate-pulse">
        <div className="h-4 bg-primary/20 rounded w-1/3 mb-3" />
        <div className="h-8 bg-primary/20 rounded w-1/2 mb-2" />
        <div className="h-3 bg-primary/20 rounded w-2/3" />
      </div>
    )
  }

  if (error || !data?.suggestion) return null

  const { suggestion } = data

  const getTrendIcon = () => {
    switch (suggestion.trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "new":
        return <Sparkles className="h-4 w-4 text-blue-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendLabel = () => {
    switch (suggestion.trend) {
      case "increasing":
        return "Progressing"
      case "decreasing":
        return "Review needed"
      case "new":
        return "New exercise"
      default:
        return "Maintaining"
    }
  }

  const getConfidenceColor = () => {
    switch (suggestion.confidence) {
      case "high":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      default:
        return "bg-gray-400"
    }
  }

  const handleApply = () => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion.recommendedWeight, suggestion.recommendedReps)
    }
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/20 rounded-lg">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-primary">Smart Suggestion</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {getTrendIcon()}
          <span className="text-muted-foreground">{getTrendLabel()}</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-3xl font-bold">{suggestion.recommendedWeight}</span>
            <span className="text-lg text-muted-foreground ml-1">kg</span>
          </div>
          <span className="text-2xl text-muted-foreground">×</span>
          <div>
            <span className="text-3xl font-bold">{suggestion.recommendedReps}</span>
            <span className="text-lg text-muted-foreground ml-1">reps</span>
          </div>
        </div>
        
        {/* Apply button */}
        {onApplySuggestion && suggestion.recommendedWeight > 0 && (
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        )}
      </div>

      {/* Reason */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {suggestion.reason}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-4 pt-2 border-t border-primary/10">
        {/* Confidence */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${getConfidenceColor()}`} />
          <span className="text-xs text-muted-foreground capitalize">
            {suggestion.confidence} confidence
          </span>
        </div>

        {/* Estimated 1RM */}
        {suggestion.estimated1RM && (
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Est. 1RM: {suggestion.estimated1RM}kg
            </span>
          </div>
        )}

        {/* Progress */}
        {suggestion.progressPercentage !== null && (
          <div className="flex items-center gap-1.5">
            {suggestion.progressPercentage >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${suggestion.progressPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
              {suggestion.progressPercentage > 0 ? "+" : ""}{suggestion.progressPercentage}%
            </span>
          </div>
        )}

        {/* Last performance */}
        {suggestion.lastPerformance && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Info className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Last: {suggestion.lastPerformance.weight}kg × {suggestion.lastPerformance.reps} ({formatDistanceToNow(new Date(suggestion.lastPerformance.date), { addSuffix: true })})
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
