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
  Search,
  Medal,
  Flame,
} from "lucide-react";
import { format } from "date-fns";

type Tab = "feed" | "following" | "leaderboard" | "search";

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<Tab>("feed");

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
      <div className="border-b dark:border-gray-700 overflow-x-auto">
        <div className="flex gap-3 sm:gap-6 min-w-max">
          <TabButton
            active={activeTab === "feed"}
            onClick={() => setActiveTab("feed")}
            icon={<Share2 className="w-4 h-4" />}
            label="Feed"
          />
          <TabButton
            active={activeTab === "following"}
            onClick={() => setActiveTab("following")}
            icon={<Users className="w-4 h-4" />}
            label="Following"
          />
          <TabButton
            active={activeTab === "leaderboard"}
            onClick={() => setActiveTab("leaderboard")}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Leaderboard"
          />
          <TabButton
            active={activeTab === "search"}
            onClick={() => setActiveTab("search")}
            icon={<Search className="w-4 h-4" />}
            label="Search"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "feed" && <FeedTab />}
        {activeTab === "following" && <FollowingTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
        {activeTab === "search" && <SearchTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-1 border-b-2 transition-colors ${
        active
          ? "border-blue-600 text-blue-600 font-medium"
          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </button>
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
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Loading feed...
      </div>
    );
  }

  if (!feed?.shares?.length) {
    return (
      <div className="text-center py-12">
        <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-300">No workout shares yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Follow users or share your workouts to see them here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {feed.shares.map((share: any) => (
        <WorkoutShareCard key={share.id} share={share} />
      ))}
    </div>
  );
}

function WorkoutShareCard({ share }: { share: any }) {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-6 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {share.userName?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <p className="font-semibold dark:text-gray-100">
            {share.userName || "User"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(share.createdAt), "MMM d 'at' h:mm a")}
          </p>
        </div>
      </div>

      {/* Caption */}
      {share.caption && (
        <p className="text-gray-700 dark:text-gray-300">{share.caption}</p>
      )}

      {/* Workout Stats */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
        <p className="font-semibold dark:text-gray-100">
          {share.sessionName || "Workout Session"}
        </p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Duration</p>
            <p className="font-semibold dark:text-gray-200">
              {share.duration || 0} min
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Sets</p>
            <p className="font-semibold dark:text-gray-200">
              {share.totalSets || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Volume</p>
            <p className="font-semibold dark:text-gray-200">
              {share.totalVolume?.toLocaleString() || 0} lbs
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2 border-t dark:border-gray-700">
        <button
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-2 transition-colors ${
            share.isLiked
              ? "text-red-600 hover:text-red-700"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <Heart
            className="w-5 h-5"
            fill={share.isLiked ? "currentColor" : "none"}
          />
          <span className="text-sm font-medium">{share.likes || 0}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{share.comments || 0}</span>
        </button>
      </div>
    </div>
  );
}

function FollowingTab() {
  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: ["following"],
    queryFn: async () => {
      const res = await fetch("/api/social/following");
      if (!res.ok) throw new Error("Failed to fetch following");
      return res.json();
    },
  });

  const { data: suggestions } = useQuery({
    queryKey: ["user-suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/social/suggestions");
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json();
    },
  });

  if (loadingFollowing) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Following List */}
      <div>
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
          Following ({following?.users?.length || 0})
        </h2>
        {!following?.users?.length ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300">
              Not following anyone yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {following.users.map((user: any) => (
              <UserCard key={user.id} user={user} isFollowing={true} />
            ))}
          </div>
        )}
      </div>

      {/* Suggested Users */}
      {suggestions?.users?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Suggested Users
          </h2>
          <div className="space-y-3">
            {suggestions.users.map((user: any) => (
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
  user: any;
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
      queryClient.invalidateQueries({ queryKey: ["search-results"] });
    },
  });

  return (
    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
        {user.name?.[0]?.toUpperCase() || "U"}
      </div>
      <div className="flex-1">
        <p className="font-semibold dark:text-gray-100">{user.name || "User"}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {user.workoutCount || 0} workouts · {user.followers || 0} followers
        </p>
      </div>
      <button
        onClick={() => followMutation.mutate()}
        disabled={followMutation.isPending}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          isFollowing
            ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">("weekly");
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
          className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200"
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
          className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      {/* Leaderboard */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      ) : !leaderboard?.entries?.length ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-300">
            No leaderboard data yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.entries.map((entry: any, index: number) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 p-4 rounded-lg border dark:border-gray-700 ${
                index < 3
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
                  : "bg-white dark:bg-gray-800"
              }`}
            >
              <div className="w-12 text-center">
                {index === 0 && (
                  <Medal className="w-8 h-8 text-yellow-500 mx-auto" />
                )}
                {index === 1 && (
                  <Medal className="w-8 h-8 text-gray-400 mx-auto" />
                )}
                {index === 2 && (
                  <Medal className="w-8 h-8 text-orange-600 mx-auto" />
                )}
                {index > 2 && (
                  <span className="text-xl font-bold text-gray-600 dark:text-gray-400">
                    {entry.rank || index + 1}
                  </span>
                )}
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {entry.userName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="font-semibold dark:text-gray-100">
                  {entry.userName || "User"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category === "total_volume" &&
                    `${entry.value.toLocaleString()} lbs`}
                  {category === "total_workouts" && `${entry.value} workouts`}
                  {category === "streak" && `${entry.value} days`}
                </p>
              </div>
              {entry.isCurrentUser && (
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
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

function SearchTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: results, isLoading } = useQuery({
    queryKey: ["search-results", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { users: [] };
      const res = await fetch(
        `/api/social/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Failed to search users");
      return res.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Results */}
      {!searchQuery.trim() ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300">
            Search for users to connect with
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Searching...
        </div>
      ) : !results?.users?.length ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.users.map((user: any) => (
            <UserCard
              key={user.id}
              user={user}
              isFollowing={user.isFollowing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
