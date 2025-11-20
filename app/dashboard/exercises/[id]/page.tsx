"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  Trophy,
  Dumbbell,
  Calendar,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default function ExerciseStatsPage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.id as string;

  const { data: exercise, isLoading: exerciseLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/${exerciseId}`);
      if (!res.ok) throw new Error("Failed to fetch exercise");
      return res.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["exercise-stats", exerciseId],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/${exerciseId}/stats`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  if (exerciseLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading exercise stats...</div>
      </div>
    );
  }

  if (!exercise || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Exercise not found</p>
        <Link
          href="/dashboard/exercises"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Back to Exercises
        </Link>
      </div>
    );
  }

  const muscleGroups = JSON.parse(exercise.muscleGroups || "[]");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{exercise.name}</h1>
          <div className="flex gap-2 mt-2">
            {muscleGroups.map((muscle: string) => (
              <span
                key={muscle}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-500">Total Sessions</div>
          </div>
          <div className="text-3xl font-bold">{stats.totalSessions}</div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Dumbbell className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-500">Total Sets</div>
          </div>
          <div className="text-3xl font-bold">{stats.totalSets}</div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-500">Total Volume</div>
          </div>
          <div className="text-3xl font-bold">
            {stats.totalVolume.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">lbs</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-sm text-gray-500">1RM Estimate</div>
          </div>
          <div className="text-3xl font-bold">
            {stats.estimated1RM || "--"}
            <span className="text-sm font-normal text-gray-500 ml-1">lbs</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Progression */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Volume Progression</h2>
          </div>
          {stats.volumeHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.volumeHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) =>
                    format(new Date(date), "MMM d, yyyy")
                  }
                />
                <Bar dataKey="volume" fill="#3b82f6" name="Volume (lbs)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No volume data yet
            </p>
          )}
        </div>

        {/* Max Weight Progression */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Max Weight Progression</h2>
          </div>
          {stats.maxWeightHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.maxWeightHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) =>
                    format(new Date(date), "MMM d, yyyy")
                  }
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Max Weight (lbs)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No weight data yet
            </p>
          )}
        </div>
      </div>

      {/* Personal Records */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h2 className="text-xl font-semibold">Personal Records</h2>
        </div>
        {stats.personalRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.personalRecords.map((pr: any) => (
              <div
                key={pr.id}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="text-sm text-gray-500 mb-1">
                  {pr.recordType === "one_rep_max"
                    ? "1 Rep Max"
                    : pr.recordType === "max_volume"
                    ? "Max Volume"
                    : "Max Reps"}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {pr.value}
                  {pr.recordType !== "max_reps" && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      lbs
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {format(new Date(pr.date), "MMM d, yyyy")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No personal records yet. Keep pushing!
          </p>
        )}
      </div>

      {/* Best Sets */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Best Sets (Last 30 Days)</h2>
        </div>
        {stats.bestSets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-gray-500">
                    Date
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">
                    Weight
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">
                    Reps
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">
                    Volume
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">
                    1RM Est.
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.bestSets.map((set: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {format(new Date(set.completedAt), "MMM d, yyyy")}
                    </td>
                    <td className="p-3 font-medium">{set.weight} lbs</td>
                    <td className="p-3">{set.reps}</td>
                    <td className="p-3">{set.weight * set.reps} lbs</td>
                    <td className="p-3">
                      {Math.round(set.weight * (1 + set.reps / 30))} lbs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No sets recorded in the last 30 days
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
        </div>
        {stats.recentSessions.length > 0 ? (
          <div className="space-y-3">
            {stats.recentSessions.map((session: any) => (
              <div
                key={session.sessionId}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{session.sessionName}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(session.date), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {session.sets.length} sets
                    </div>
                    <div className="font-medium">
                      {session.totalVolume.toLocaleString()} lbs
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {session.sets.map((set: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {set.weight}x{set.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent sessions</p>
        )}
      </div>
    </div>
  );
}
