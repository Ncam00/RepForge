"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  TrendingUp,
  Trophy,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  UserMinus,
  Award,
  Medal,
  Star,
  Flame,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { SocialShare, Achievement, SocialUser, LeaderboardEntry } from "@/types/dashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/ui/skeleton-cards";

type Tab = "feed" | "following" | "leaderboard" | "achievements";

interface LeaderboardEntryWithUser extends LeaderboardEntry {
  id: string;
  value: number;
  isCurrentUser: boolean;
}

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const queryClient = useQueryClient();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Social</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Connect with others, share your progress, and compete!
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("feed")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "feed"
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span>Feed</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "following"
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Following</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "leaderboard"
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Leaderboard</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "achievements"
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>Achievements</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "feed" && <FeedTab />}
        {activeTab === "following" && <FollowingTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
        {activeTab === "achievements" && <AchievementsTab />}
      </div>
    </div>
  );
}

function FeedTab() {
  const { data: feed, isLoading } = useQuery({
    queryKey: ["social-feed"],
    queryFn: async () => {
      const res = await fetch("/api/social/feed");
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
  });

  if (isLoading) {
    return <FeedSkeleton count={3} />;
  }

  if (!feed?.shares?.length) {
    return (
      <EmptyState
        icon={Share2}
        title="No workout shares yet"
        description="Complete a workout and share it with the community to see your feed come alive."
        action={{ label: "Log a Workout", href: "/dashboard/history" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {feed.shares.map((share: SocialShare) => (
        <WorkoutShareCard key={share.id} share={share} />
      ))}
    </div>
  );
}

function WorkoutShareCard({ share }: { share: SocialShare }) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/shares/${share.id}/like`, {
        method: share.isLiked ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {share.userName?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{share.userName || "User"}</p>
          <p className="text-sm text-gray-500">
            {format(new Date(share.createdAt), "MMM d 'at' h:mm a")}
          </p>
        </div>
      </div>

      {/* Caption */}
      {share.caption && <p className="text-gray-700">{share.caption}</p>}

      {/* Workout Stats */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="font-semibold">{share.sessionName || "Workout Session"}</p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Duration</p>
            <p className="font-semibold">{share.duration || 0} min</p>
          </div>
          <div>
            <p className="text-gray-500">Sets</p>
            <p className="font-semibold">{share.totalSets || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">Volume</p>
            <p className="font-semibold">
              {share.totalVolume?.toLocaleString() || 0} lbs
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2 border-t">
        <button
          onClick={() => likeMutation.mutate()}
          className={`flex items-center gap-2 transition-colors ${
            share.isLiked
              ? "text-red-600 hover:text-red-700"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Heart
            className="w-5 h-5"
            fill={share.isLiked ? "currentColor" : "none"}
          />
          <span className="text-sm font-medium">{share.likes || 0}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{share.commentCount || 0}</span>
        </button>
      </div>
    </div>
  );
}

function FollowingTab() {
  const [showSuggestions, setShowSuggestions] = useState(true);

  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: ["following"],
    queryFn: async () => {
      const res = await fetch("/api/social/following");
      if (!res.ok) throw new Error("Failed to fetch following");
      return res.json();
    },
  });

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["user-suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/social/suggestions");
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json();
    },
    enabled: showSuggestions,
  });

  if (loadingFollowing) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Following List */}
      <div>
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
          Following ({following?.users?.length || 0})
        </h2>
        {!following?.users?.length ? (
          <EmptyState
            icon={Users}
            title="Not following anyone yet"
            description="Discover other athletes below and follow them to see their workouts here."
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            {following.users.map((user: SocialUser) => (
              <UserCard key={user.id} user={user} isFollowing={true} />
            ))}
          </div>
        )}
      </div>

      {/* Suggested Users */}
      {showSuggestions && suggestions?.users?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Suggested Users</h2>
          <div className="space-y-3">
            {suggestions.users.map((user: SocialUser) => (
              <UserCard key={user.id} user={user} isFollowing={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserCard({
  user,
  isFollowing,
}: {
  user: SocialUser;
  isFollowing: boolean;
}) {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/follow/${user.id}`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["user-suggestions"] });
    },
  });

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
        {user.name?.[0]?.toUpperCase() || "U"}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{user.name || "User"}</p>
        <p className="text-sm text-gray-500">
          {user.workoutCount || 0} workouts · {user.followers || 0} followers
        </p>
      </div>
      <button
        onClick={() => followMutation.mutate()}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          isFollowing
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isFollowing ? (
          <>
            <UserMinus className="w-4 h-4" />
            Unfollow
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Follow
          </>
        )}
      </button>
    </div>
  );
}

function LeaderboardTab() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">(
    "weekly"
  );
  const [category, setCategory] = useState("total_volume");

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard", category, period],
    queryFn: async () => {
      const res = await fetch(
        `/api/social/leaderboard?category=${category}&period=${period}`
      );
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="total_volume">Total Volume</option>
          <option value="total_workouts">Total Workouts</option>
          <option value="streak">Workout Streak</option>
        </select>
        <select
          value={period}
          onChange={(e) =>
            setPeriod(e.target.value as "weekly" | "monthly" | "all_time")
          }
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      {/* Leaderboard */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : !leaderboard?.entries?.length ? (
        <EmptyState
          icon={TrendingUp}
          title="No leaderboard data yet"
          description="Log workouts to appear on the leaderboard and compete with the community."
          action={{ label: "Log a Workout", href: "/dashboard/history" }}
        />
      ) : (
        <div className="space-y-2">
          {leaderboard.entries.map((entry: LeaderboardEntryWithUser, index: number) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                index < 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50" : "bg-white"
              }`}
            >
              <div className="w-12 text-center">
                {index === 0 && <Medal className="w-8 h-8 text-yellow-500 mx-auto" />}
                {index === 1 && <Medal className="w-8 h-8 text-gray-400 mx-auto" />}
                {index === 2 && <Medal className="w-8 h-8 text-orange-600 mx-auto" />}
                {index > 2 && (
                  <span className="text-xl font-bold text-gray-600">
                    {entry.rank || index + 1}
                  </span>
                )}
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {entry.userName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{entry.userName || "User"}</p>
                <p className="text-sm text-gray-500">
                  {category === "total_volume" && `${entry.value.toLocaleString()} lbs`}
                  {category === "total_workouts" && `${entry.value} workouts`}
                  {category === "streak" && `${entry.value} days`}
                </p>
              </div>
              {entry.isCurrentUser && (
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  You
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementsTab() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/social/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const unlocked = achievements?.unlocked || [];
  const locked = achievements?.locked || [];

  return (
    <div className="space-y-8">
      {/* Unlocked Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
          Unlocked ({unlocked.length})
        </h2>
        {!unlocked.length ? (
          <EmptyState
            icon={Trophy}
            title="No achievements yet"
            description="Complete workouts, hit personal records, and stay consistent to unlock achievements."
            action={{ label: "Start Training", href: "/dashboard/history" }}
            className="py-8"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((achievement: Achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Locked Achievements */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Locked ({locked.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((achievement: Achievement) => (
              <AchievementCard
                key={achievement.type}
                achievement={achievement}
                unlocked={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AchievementCard({
  achievement,
  unlocked,
}: {
  achievement: Achievement;
  unlocked: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-lg border ${
        unlocked
          ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
          : "bg-gray-50 border-gray-200 opacity-60"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`text-4xl ${
            unlocked ? "filter-none" : "grayscale opacity-40"
          }`}
        >
          {achievement.icon || "🏆"}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
          <p className="text-sm text-gray-600">{achievement.description}</p>
          {unlocked && achievement.unlockedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Unlocked {format(new Date(achievement.unlockedAt), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
