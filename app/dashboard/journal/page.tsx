"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Edit, Trash2, BookOpen, Smile, Frown, Meh, Battery, Moon } from "lucide-react";

const MOODS = [
  { value: "great", label: "Great", icon: "😄", color: "green" },
  { value: "good", label: "Good", icon: "🙂", color: "blue" },
  { value: "okay", label: "Okay", icon: "😐", color: "yellow" },
  { value: "bad", label: "Bad", icon: "😕", color: "orange" },
  { value: "terrible", label: "Terrible", icon: "😢", color: "red" },
];

export default function JournalPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [bodyWeight, setBodyWeight] = useState("");
  const [notes, setNotes] = useState("");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal"],
    queryFn: async () => {
      const res = await fetch("/api/journal");
      if (!res.ok) throw new Error("Failed to fetch entries");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      resetForm();
      setIsCreating(false);
      alert("Journal entry saved!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setMood("");
    setEnergyLevel(5);
    setSleepQuality(5);
    setBodyWeight("");
    setNotes("");
    setEditingEntry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      content,
      mood: mood || null,
      energyLevel,
      sleepQuality,
      bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
      notes,
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Journal</h1>
          <p className="text-gray-500 mt-1">Track your thoughts, mood, and progress</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? "Cancel" : "New Entry"}
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">New Journal Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Today's training thoughts..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How are you feeling?
              </label>
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      mood === m.value
                        ? `border-${m.color}-500 bg-${m.color}-50`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="text-xs font-medium">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  Energy Level: {energyLevel}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Sleep Quality: {sleepQuality}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body Weight (Optional)
              </label>
              <input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="155.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Journal Entry
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Write your thoughts, reflections, goals, or anything on your mind..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Diet, injuries, supplements, etc."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "Saving..." : "Save Entry"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading entries...</div>
      ) : entries?.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No journal entries yet. Start writing!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries?.map((entry: any) => {
            const entryMood = MOODS.find((m) => m.value === entry.mood);
            return (
              <div
                key={entry.id}
                className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {entryMood && (
                        <span className="text-2xl">{entryMood.icon}</span>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">
                          {entry.title || "Journal Entry"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(entry.date), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Delete this entry?")) {
                        deleteMutation.mutate(entry.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {entry.content && (
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                    {entry.content}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  {entry.energyLevel && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                      ⚡ Energy: {entry.energyLevel}/10
                    </span>
                  )}
                  {entry.sleepQuality && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      😴 Sleep: {entry.sleepQuality}/10
                    </span>
                  )}
                  {entry.bodyWeight && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      ⚖️ {entry.bodyWeight} lbs
                    </span>
                  )}
                </div>

                {entry.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {entry.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
