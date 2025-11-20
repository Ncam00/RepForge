"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Copy, Play, Trash2, Edit, Share2, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showPublic, setShowPublic] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [duration, setDuration] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<
    Array<{ exerciseId: string; sets: number; reps: string; restTime: number; notes: string }>
  >([]);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", showPublic],
    queryFn: async () => {
      const res = await fetch(`/api/templates?public=${showPublic}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const res = await fetch("/api/exercises");
      if (!res.ok) throw new Error("Failed to fetch exercises");
      return res.json();
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setIsCreating(false);
      resetForm();
      alert("Template created successfully!");
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const startWorkoutMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch("/api/templates/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (!res.ok) throw new Error("Failed to start workout");
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = `/dashboard/history?session=${data.sessionId}`;
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setDifficulty("beginner");
    setDuration("");
    setSelectedExercises([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedExercises.length === 0) {
      alert("Please provide a name and add at least one exercise");
      return;
    }

    createTemplateMutation.mutate({
      name,
      description,
      category: category || null,
      difficulty,
      duration: duration ? parseInt(duration) : null,
      exercises: selectedExercises.map((ex, index) => ({
        ...ex,
        order: index,
      })),
    });
  };

  const addExercise = () => {
    setSelectedExercises([
      ...selectedExercises,
      { exerciseId: "", sets: 3, reps: "8-12", restTime: 90, notes: "" },
    ]);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedExercises(updated);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workout Templates</h1>
          <p className="text-gray-500 mt-1">
            Save and reuse your favorite workouts
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? "Cancel" : "Create Template"}
        </button>
      </div>

      {/* Toggle Public Templates */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPublic(false)}
          className={`px-4 py-2 rounded-md ${
            !showPublic
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          My Templates
        </button>
        <button
          onClick={() => setShowPublic(true)}
          className={`px-4 py-2 rounded-md ${
            showPublic
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Public Library
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Create New Template</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Push Day, Full Body A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Optional description..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="hiit">HIIT</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="full_body">Full Body</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Exercises *
                </label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Add Exercise
                </button>
              </div>
              <div className="space-y-3">
                {selectedExercises.map((ex, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-md bg-gray-50 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <select
                          value={ex.exerciseId}
                          onChange={(e) =>
                            updateExercise(index, "exerciseId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          required
                        >
                          <option value="">Select exercise...</option>
                          {exercises?.map((exercise: any) => (
                            <option key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-600">Sets</label>
                        <input
                          type="number"
                          value={ex.sets}
                          onChange={(e) =>
                            updateExercise(
                              index,
                              "sets",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Reps</label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) =>
                            updateExercise(index, "reps", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="8-12"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Rest (sec)
                        </label>
                        <input
                          type="number"
                          value={ex.restTime}
                          onChange={(e) =>
                            updateExercise(
                              index,
                              "restTime",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Notes</label>
                        <input
                          type="text"
                          value={ex.notes}
                          onChange={(e) =>
                            updateExercise(index, "notes", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {selectedExercises.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No exercises added yet. Click "+ Add Exercise" to start.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createTemplateMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createTemplateMutation.isPending
                  ? "Creating..."
                  : "Create Template"}
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

      {/* Templates List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          Loading templates...
        </div>
      ) : templates?.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border text-center">
          <p className="text-gray-500">
            {showPublic
              ? "No public templates available yet"
              : "No templates yet. Create your first template to get started!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates?.map((template: any) => (
            <div
              key={template.id}
              className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {template.category && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {template.category}
                  </span>
                )}
                {template.difficulty && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      template.difficulty === "beginner"
                        ? "bg-green-100 text-green-700"
                        : template.difficulty === "intermediate"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {template.difficulty}
                  </span>
                )}
                {template.duration && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {template.duration} min
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  {template.exercises?.length || 0} exercises
                </div>
                <div className="space-y-1">
                  {template.exercises?.slice(0, 3).map((ex: any) => (
                    <div
                      key={ex.id}
                      className="text-sm text-gray-700 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                        {ex.sets}
                      </span>
                      <span>{ex.exercise.name}</span>
                    </div>
                  ))}
                  {template.exercises?.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{template.exercises.length - 3} more
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startWorkoutMutation.mutate(template.id)}
                  disabled={startWorkoutMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
                {!showPublic && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Delete template "${template.name}"? This cannot be undone.`
                        )
                      ) {
                        deleteTemplateMutation.mutate(template.id);
                      }
                    }}
                    className="p-2 border border-gray-300 rounded-md hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
