"use client";

import { useQuery } from "@tanstack/react-query";

export default function LevelBadge() {
  const { data: progress } = useQuery({
    queryKey: ["user-progress"],
    queryFn: async () => {
      const res = await fetch("/api/progress");
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!progress) return null;

  const { currentLevel, badge } = progress;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg shadow-sm">
      <span className="text-lg" role="img" aria-label={`${badge.title} badge`}>{badge.icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-gray-700">Level</span>
        <span className="text-sm font-bold">{currentLevel}</span>
      </div>
    </div>
  );
}
