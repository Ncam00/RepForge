"use client";

import { Lock, Eye, Users, Trophy } from "lucide-react";

interface PrivacySettingsProps {
  profileVisibility: string;
  workoutVisibility: string;
  showOnLeaderboard: boolean;
  allowFriendRequests: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export function PrivacySettings({
  profileVisibility,
  workoutVisibility,
  showOnLeaderboard,
  allowFriendRequests,
  onChange,
}: PrivacySettingsProps) {
  const visibilityOptions = [
    { value: "public", label: "Public", description: "Anyone can see" },
    { value: "friends", label: "Friends Only", description: "Only your friends" },
    { value: "private", label: "Private", description: "Only you" },
  ];

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-xl font-semibold dark:text-white">Privacy Settings</h2>
      </div>
      
      <div className="space-y-6">
        {/* Profile Visibility */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <label className="text-sm font-medium dark:text-gray-200">Profile Visibility</label>
          </div>
          <div className="space-y-2">
            {visibilityOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.value}
                  checked={profileVisibility === option.value}
                  onChange={(e) => onChange("profileVisibility", e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Workout Visibility */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <label className="text-sm font-medium dark:text-gray-200">Workout Visibility</label>
          </div>
          <div className="space-y-2">
            {visibilityOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="workoutVisibility"
                  value={option.value}
                  checked={workoutVisibility === option.value}
                  onChange={(e) => onChange("workoutVisibility", e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.value === "public" && "Share your workouts with everyone"}
                    {option.value === "friends" && "Only friends can see your workouts"}
                    {option.value === "private" && "Keep workouts completely private"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Other Privacy Options */}
        <div className="space-y-3 pt-4 border-t dark:border-gray-700">
          <label className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Show on Leaderboard</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Appear in global and friends leaderboards
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showOnLeaderboard}
              onChange={(e) => onChange("showOnLeaderboard", e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Allow Friend Requests</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Let other users send you friend requests
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={allowFriendRequests}
              onChange={(e) => onChange("allowFriendRequests", e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
