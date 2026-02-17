"use client";

import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Target, Calendar, Flame, Award, Trophy, Dumbbell } from "lucide-react";
import { format, subDays } from "date-fns";
import { AnalyticsData, MuscleGroupEntry, TopExercise } from "@/types/dashboard";
import Link from "next/link";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface PersonalRecord {
  id: string;
  exerciseId: string;
  recordType: string;
  value: number;
  date: string;
  exercise: {
    name: string;
  };
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const { data: prsData } = useQuery({
    queryKey: ["prs"],
    queryFn: async () => {
      const res = await fetch("/api/prs");
      if (!res.ok) throw new Error("Failed to fetch PRs");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  const recentPRs: PersonalRecord[] = (prsData?.prs || []).slice(0, 5);

  const formatRecordType = (type: string) => {
    switch (type) {
      case "one_rep_max": return "1RM";
      case "max_volume": return "Volume";
      case "max_reps": return "Max Reps";
      default: return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your progress and performance insights
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Weekly Avg</div>
          </div>
          <div className="text-3xl font-bold">{analytics.weeklyAverage}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">workouts/week</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Consistency</div>
          </div>
          <div className="text-3xl font-bold">{analytics.consistencyRate}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">last 30 days</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
          </div>
          <div className="text-3xl font-bold">{analytics.currentStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">days</div>
        </div>

        <Link href="/dashboard/prs" className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total PRs</div>
          </div>
          <div className="text-3xl font-bold">{analytics.totalPRs}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">personal records</div>
        </Link>
      </div>

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Recent Personal Records
            </h2>
            <Link href="/dashboard/prs" className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline">
              View all PRs →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {recentPRs.map((pr) => (
              <div key={pr.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                <div className="text-sm font-medium truncate">{pr.exercise.name}</div>
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {pr.value} {pr.recordType === "max_reps" ? "reps" : "lbs"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatRecordType(pr.recordType)} • {format(new Date(pr.date), "MMM d")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout Frequency Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Workout Frequency (30 Days)</h2>
          {analytics.frequencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.frequencyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Workouts"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No data available</p>
          )}
        </div>

        {/* Muscle Group Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Muscle Group Focus</h2>
          {analytics.muscleGroupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.muscleGroupData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {analytics.muscleGroupData.map((entry: MuscleGroupEntry, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No data available</p>
          )}
        </div>

        {/* Volume Progression */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Volume Progression</h2>
          {analytics.volumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="week"
                  tickFormatter={(week) => `Week ${week}`}
                />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                <Bar dataKey="volume" fill="#10b981" name="Total Volume (lbs)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No data available</p>
          )}
        </div>

        {/* Best Days to Workout */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Workout Days Distribution</h2>
          {analytics.dayDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dayDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="#8b5cf6" name="Workouts" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Top Exercises */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Most Performed Exercises</h2>
        {analytics.topExercises.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Exercise</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Sessions</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Total Sets</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Total Volume</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Avg Weight</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topExercises.map((exercise: TopExercise, idx: number) => (
                  <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-medium">{exercise.name}</td>
                    <td className="p-3">{exercise.sessions}</td>
                    <td className="p-3">{exercise.totalSets}</td>
                    <td className="p-3">{exercise.totalVolume.toLocaleString()} lbs</td>
                    <td className="p-3">{Math.round(exercise.avgWeight)} lbs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No exercise data yet</p>
        )}
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.insights.map((insight: string, idx: number) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-md">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2"></div>
              <p className="text-gray-700 dark:text-gray-300">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
