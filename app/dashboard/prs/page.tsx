"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trophy,
  Dumbbell,
  Target,
  Flame,
  Calculator,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface PersonalRecord {
  id: string;
  exerciseId: string;
  recordType: string;
  value: number;
  date: string;
  notes?: string;
  exercise: {
    id: string;
    name: string;
    muscleGroups: string[];
  };
}

// Epley formula for 1RM calculation
function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// Calculate percentage of 1RM
function calculatePercentage(oneRM: number, percentage: number): number {
  return Math.round(oneRM * (percentage / 100) * 10) / 10;
}

function OneRMCalculator() {
  const [weight, setWeight] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [estimated1RM, setEstimated1RM] = useState<number | null>(null);

  const handleCalculate = () => {
    if (typeof weight === "number" && typeof reps === "number" && weight > 0 && reps > 0) {
      setEstimated1RM(calculate1RM(weight, reps));
    }
  };

  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
  const repRanges = ["1", "2-3", "3-4", "5-6", "7-8", "9-10", "11-12", "13-15", "16-18", "19-21", "22-25"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>1RM Calculator</CardTitle>
            <CardDescription>Estimate your one-rep max using the Epley formula</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Weight Lifted</Label>
            <Input
              type="number"
              placeholder="Enter weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
            />
          </div>
          <div className="space-y-2">
            <Label>Reps Completed</Label>
            <Input
              type="number"
              placeholder="Enter reps"
              min={1}
              max={30}
              value={reps}
              onChange={(e) => setReps(e.target.value ? Number(e.target.value) : "")}
            />
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          Calculate 1RM
        </Button>

        {estimated1RM && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Estimated 1RM</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {estimated1RM} lbs
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-2 text-left">%1RM</th>
                    <th className="px-4 py-2 text-left">Weight</th>
                    <th className="px-4 py-2 text-left">Est. Reps</th>
                  </tr>
                </thead>
                <tbody>
                  {percentages.map((pct, i) => (
                    <tr key={pct} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2 font-medium">{pct}%</td>
                      <td className="px-4 py-2">{calculatePercentage(estimated1RM, pct)} lbs</td>
                      <td className="px-4 py-2 text-gray-500">{repRanges[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatRecordType(type: string): { label: string; icon: React.ReactNode; color: string } {
  switch (type) {
    case "one_rep_max":
      return {
        label: "1RM",
        icon: <Dumbbell className="h-4 w-4" />,
        color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
      };
    case "max_volume":
      return {
        label: "Volume",
        icon: <Target className="h-4 w-4" />,
        color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case "max_reps":
      return {
        label: "Max Reps",
        icon: <Flame className="h-4 w-4" />,
        color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
      };
    default:
      return {
        label: type,
        icon: <Trophy className="h-4 w-4" />,
        color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
      };
  }
}

export default function PRsPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: prsData, isLoading } = useQuery({
    queryKey: ["prs"],
    queryFn: async () => {
      const res = await fetch("/api/prs");
      if (!res.ok) throw new Error("Failed to fetch PRs");
      return res.json();
    },
  });

  const prs: PersonalRecord[] = prsData?.prs || [];

  // Filter PRs
  const filteredPRs = prs.filter((pr) => {
    const matchesType = filterType === "all" || pr.recordType === filterType;
    const matchesSearch =
      searchQuery === "" ||
      pr.exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group PRs by exercise for the summary view
  const prsByExercise = filteredPRs.reduce((acc, pr) => {
    if (!acc[pr.exerciseId]) {
      acc[pr.exerciseId] = {
        exercise: pr.exercise,
        records: [],
      };
    }
    acc[pr.exerciseId].records.push(pr);
    return acc;
  }, {} as Record<string, { exercise: PersonalRecord["exercise"]; records: PersonalRecord[] }>);

  // Stats
  const totalPRs = prs.length;
  const oneRMPRs = prs.filter((pr) => pr.recordType === "one_rep_max").length;
  const volumePRs = prs.filter((pr) => pr.recordType === "max_volume").length;
  const repsPRs = prs.filter((pr) => pr.recordType === "max_reps").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading PRs...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Personal Records
        </h1>
        <p className="text-gray-500 mt-1">Track your all-time bests and calculate your 1RM</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-200 dark:bg-yellow-800 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalPRs}</div>
                <div className="text-xs text-gray-500">Total PRs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{oneRMPRs}</div>
                <div className="text-xs text-gray-500">1RM Records</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{volumePRs}</div>
                <div className="text-xs text-gray-500">Volume PRs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{repsPRs}</div>
                <div className="text-xs text-gray-500">Rep PRs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1RM Calculator */}
        <div className="lg:col-span-1">
          <OneRMCalculator />
        </div>

        {/* PR List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {["all", "one_rep_max", "max_volume", "max_reps"].map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType(type)}
                    >
                      {type === "all"
                        ? "All"
                        : type === "one_rep_max"
                        ? "1RM"
                        : type === "max_volume"
                        ? "Volume"
                        : "Reps"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PRs by Exercise */}
          {Object.keys(prsByExercise).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                  No Personal Records Yet
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Start logging your workouts to track your PRs!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.values(prsByExercise).map(({ exercise, records }) => (
                <Card key={exercise.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          {exercise.muscleGroups.map((mg) => (
                            <span
                              key={mg}
                              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"
                            >
                              {mg}
                            </span>
                          ))}
                        </div>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {records.map((pr) => {
                        const { label, icon, color } = formatRecordType(pr.recordType);
                        return (
                          <div
                            key={pr.id}
                            className={`p-3 rounded-lg ${color} flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-2">
                              {icon}
                              <span className="font-medium">{label}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {pr.recordType === "max_reps"
                                  ? `${pr.value} reps`
                                  : `${pr.value} ${pr.recordType === "max_volume" ? "lbs" : "lbs"}`}
                              </div>
                              <div className="text-xs opacity-75">
                                {format(new Date(pr.date), "MMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
