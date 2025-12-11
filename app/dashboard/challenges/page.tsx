"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Target,
  Users,
  Plus,
  Calendar,
  TrendingUp,
  Award,
  Flame,
  Dumbbell,
} from "lucide-react";
import { format } from "date-fns";

type Tab = "active" | "my-challenges" | "create";

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Challenges</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Compete, achieve, and earn XP!
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b dark:border-gray-700">
        <div className="flex gap-6">
          <TabButton
            active={activeTab === "active"}
            onClick={() => setActiveTab("active")}
            icon={<Trophy className="w-4 h-4" />}
            label="Active Challenges"
          />
          <TabButton
            active={activeTab === "my-challenges"}
            onClick={() => setActiveTab("my-challenges")}
            icon={<Target className="w-4 h-4" />}
            label="My Challenges"
          />
          <TabButton
            active={activeTab === "create"}
            onClick={() => setActiveTab("create")}
            icon={<Plus className="w-4 h-4" />}
            label="Create Challenge"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "active" && <ActiveChallengesTab />}
        {activeTab === "my-challenges" && <MyChallengesTab />}
        {activeTab === "create" && <CreateChallengeTab />}
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

function ActiveChallengesTab() {
  const { data: challenges, isLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const res = await fetch("/api/challenges");
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Loading challenges...
      </div>
    );
  }

  const activeChallenges = challenges?.challenges?.filter(
    (c: any) => !c.isJoined
  );

  if (!activeChallenges?.length) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-300">
          No active challenges available
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create a challenge to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeChallenges.map((challenge: any) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
}

function MyChallengesTab() {
  const { data: challenges, isLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const res = await fetch("/api/challenges");
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  const myChallenges = challenges?.challenges?.filter((c: any) => c.isJoined);

  if (!myChallenges?.length) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-300">
          You haven't joined any challenges yet
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Browse active challenges to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {myChallenges.map((challenge: any) => (
        <ChallengeCard key={challenge.id} challenge={challenge} showProgress />
      ))}
    </div>
  );
}

function ChallengeCard({
  challenge,
  showProgress = false,
}: {
  challenge: any;
  showProgress?: boolean;
}) {
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/challenges/${challenge.id}/join`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to join challenge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "workouts":
        return <Dumbbell className="w-5 h-5" />;
      case "sets":
      case "reps":
        return <TrendingUp className="w-5 h-5" />;
      case "weight_lifted":
        return <Award className="w-5 h-5" />;
      case "streak":
        return <Flame className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const progressPercentage = showProgress
    ? Math.min((challenge.userProgress / challenge.target) * 100, 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 space-y-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg dark:text-gray-100">
            {challenge.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            by {challenge.creatorName}
          </p>
        </div>
        <div className="text-blue-600 dark:text-blue-400">
          {getCategoryIcon(challenge.category)}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {challenge.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 py-4 border-y dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
          <p className="font-bold dark:text-gray-200">{challenge.target}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">XP Reward</p>
          <p className="font-bold text-yellow-600 dark:text-yellow-400">
            {challenge.xpReward} XP
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Participants
          </p>
          <p className="font-bold dark:text-gray-200">
            {challenge.participantCount}
            {challenge.maxParticipants && ` / ${challenge.maxParticipants}`}
          </p>
        </div>
        {challenge.endDate && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ends</p>
            <p className="font-bold dark:text-gray-200">
              {format(new Date(challenge.endDate), "MMM d")}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar (if joined) */}
      {showProgress && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">Progress</span>
            <span className="font-medium dark:text-gray-200">
              {challenge.userProgress} / {challenge.target}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {challenge.userStatus === "completed" && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Award className="w-4 h-4" />
              <span className="font-medium">Completed!</span>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {!showProgress && (
        <button
          onClick={() => joinMutation.mutate()}
          disabled={joinMutation.isPending}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {joinMutation.isPending ? "Joining..." : "Join Challenge"}
        </button>
      )}
    </div>
  );
}

function CreateChallengeTab() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "workouts",
    target: 10,
    xpReward: 100,
    isPublic: true,
    maxParticipants: null as number | null,
    endDate: "",
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create challenge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "workouts",
        target: 10,
        xpReward: 100,
        isPublic: true,
        maxParticipants: null,
        endDate: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 space-y-6">
          <h2 className="text-xl font-semibold dark:text-gray-100">
            Create New Challenge
          </h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200 mb-2">
              Challenge Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 30-Day Workout Streak"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the challenge..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="workouts">Total Workouts</option>
              <option value="sets">Total Sets</option>
              <option value="reps">Total Reps</option>
              <option value="weight_lifted">Weight Lifted (lbs)</option>
              <option value="streak">Workout Streak (days)</option>
            </select>
          </div>

          {/* Target & XP Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Target
              </label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: parseInt(e.target.value) })
                }
                required
                min="1"
                className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                XP Reward
              </label>
              <input
                type="number"
                value={formData.xpReward}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    xpReward: parseInt(e.target.value),
                  })
                }
                required
                min="1"
                className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Public & Max Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium dark:text-gray-200">
                  Public Challenge
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Max Participants
              </label>
              <input
                type="number"
                value={formData.maxParticipants || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxParticipants: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                min="2"
                placeholder="Unlimited"
                className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending
              ? "Creating..."
              : "Create Challenge"}
          </button>

          {createMutation.isSuccess && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                ✅ Challenge created successfully!
              </p>
            </div>
          )}

          {createMutation.isError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                ❌ Failed to create challenge. Please try again.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
