"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Zap, TrendingUp } from "lucide-react";

export default function XpProgress() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ["user-progress"],
    queryFn: async () => {
      const res = await fetch("/api/progress");
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  if (isLoading || !progress) {
    return (
      <div className="bg-white rounded-lg border p-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const { currentLevel, progressPercent, xpInCurrentLevel, xpNeededForNext, badge, currentStreak } = progress;

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {/* Header with Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl shadow-lg`}>
            {badge.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">Level {currentLevel}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${badge.color} text-white`}>
                {badge.title}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {xpInCurrentLevel.toLocaleString()} / {xpNeededForNext.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Streak */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
            <Zap className="w-5 h-5 text-orange-600" fill="currentColor" />
            <div>
              <p className="text-xs text-gray-600">Streak</p>
              <p className="font-bold text-orange-600">{currentStreak} days</p>
            </div>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${badge.color} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{progressPercent.toFixed(1)}% to next level</span>
          <span>Level {currentLevel + 1}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Trophy className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600">Total XP</p>
            <p className="font-bold text-blue-600">{progress.totalXpEarned?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-600">Best Streak</p>
            <p className="font-bold text-green-600">{progress.longestStreak || 0} days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
