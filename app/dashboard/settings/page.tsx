"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Moon, Sun, Bell, Download, Save, Settings2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    weightUnit: "lbs",
    theme: "light",
    notifications: true,
    restTimerSound: true,
    autoStartTimer: true,
  });

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || session?.user?.name || "",
        email: settings.email || session?.user?.email || "",
        weightUnit: settings.weightUnit || "lbs",
        theme: settings.theme || "light",
        notifications: settings.notifications ?? true,
        restTimerSound: settings.restTimerSound ?? true,
        autoStartTimer: settings.autoStartTimer ?? true,
      });
    }
  }, [settings, session]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      alert("Settings saved successfully!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const handleExport = async (format: "json" | "csv" = "json", type: string = "all") => {
    try {
      const res = await fetch(`/api/settings/export?format=${format}&type=${type}`);
      if (!res.ok) throw new Error("Failed to export data");
      
      const date = new Date().toISOString().split("T")[0];
      const filename = `repforge-${type}-${date}.${format}`;
      
      if (format === "csv") {
        const text = await res.text();
        const blob = new Blob([text], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert("Export failed. Please try again.");
    }
  };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Settings2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Section */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                placeholder="your.email@example.com"
                disabled
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preferences</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight Unit
              </label>
              <select
                value={formData.weightUnit}
                onChange={(e) =>
                  setFormData({ ...formData, weightUnit: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
              >
                <option value="lbs">Pounds (lbs)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Theme
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTheme("light");
                    setFormData({ ...formData, theme: "light" });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                    mounted && theme === "light"
                      ? "bg-white border-blue-500 text-blue-700 shadow-sm"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme("dark");
                    setFormData({ ...formData, theme: "dark" });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                    mounted && theme === "dark"
                      ? "bg-gray-900 border-blue-500 text-blue-300 shadow-sm"
                      : "bg-gray-900 border-gray-600 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications & Behavior</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Enable Notifications
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Receive reminders and updates
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) =>
                  setFormData({ ...formData, notifications: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Rest Timer Sound
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Play sound when rest timer completes
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.restTimerSound}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    restTimerSound: e.target.checked,
                  })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Auto-Start Rest Timer
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically start timer after completing a set
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.autoStartTimer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoStartTimer: e.target.checked,
                  })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data Management</h2>
          </div>
          <div className="space-y-4">
            {/* Export Options */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Export Your Data
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Download your workout data in JSON or CSV format
              </div>
              
              {/* JSON Exports */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">JSON Format (Full Data)</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleExport("json", "all")}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    <Download className="w-3 h-3" />
                    All Data
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("json", "workouts")}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                  >
                    <Download className="w-3 h-3" />
                    Workouts
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("json", "exercises")}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                  >
                    <Download className="w-3 h-3" />
                    Exercises
                  </button>
                </div>
              </div>
              
              {/* CSV Exports */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CSV Format (Spreadsheet Compatible)</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleExport("csv", "workouts")}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    <Download className="w-3 h-3" />
                    Workouts
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("csv", "sets")}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    <Download className="w-3 h-3" />
                    All Sets
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("csv", "weights")}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    <Download className="w-3 h-3" />
                    Weight History
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("csv", "prs")}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    <Download className="w-3 h-3" />
                    Personal Records
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
              <div className="font-medium text-red-900 dark:text-red-300 mb-1">Danger Zone</div>
              <div className="text-sm text-red-700 dark:text-red-400 mb-3">
                Permanently delete your account and all data
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure? This action cannot be undone. All your data will be permanently deleted."
                    )
                  ) {
                    alert("Account deletion coming soon!");
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-4 h-4" />
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
