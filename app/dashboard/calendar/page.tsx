"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, X } from "lucide-react";
import Link from "next/link";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ["calendar", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const month = format(currentMonth, "yyyy-MM");
      const res = await fetch(`/api/calendar?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch calendar data");
      return res.json();
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getWorkoutsForDate = (date: Date) => {
    if (!calendarData?.workouts) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarData.workouts.filter(
      (w: any) => format(new Date(w.startedAt), "yyyy-MM-dd") === dateStr
    );
  };

  const selectedWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workout Calendar</h1>
          <p className="text-gray-500 mt-1">Track your training schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-lg font-semibold min-w-[200px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {calendarData && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-500">Workouts This Month</div>
            <div className="text-2xl font-bold">{calendarData.monthStats.totalWorkouts}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-500">Completion Rate</div>
            <div className="text-2xl font-bold">{calendarData.monthStats.completionRate}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-500">Total Volume</div>
            <div className="text-2xl font-bold">
              {calendarData.monthStats.totalVolume.toLocaleString()}
              <span className="text-sm font-normal text-gray-500 ml-1">lbs</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-500">Active Days</div>
            <div className="text-2xl font-bold">{calendarData.monthStats.activeDays}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const workouts = getWorkoutsForDate(day);
              const hasWorkouts = workouts.length > 0;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-2 rounded-lg border transition-all relative
                    ${!isCurrentMonth ? "text-gray-400 bg-gray-50" : ""}
                    ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"}
                    ${isTodayDate ? "border-blue-600 border-2" : ""}
                    ${hasWorkouts && isCurrentMonth ? "bg-green-50 border-green-300" : ""}
                  `}
                >
                  <div className="text-sm font-medium">{format(day, "d")}</div>
                  {hasWorkouts && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {workouts.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-green-600 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          {selectedDate ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {format(selectedDate, "MMMM d, yyyy")}
                </h2>
              </div>

              {selectedWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {selectedWorkouts.map((workout: any) => (
                    <Link
                      key={workout.id}
                      href={`/dashboard/history?session=${workout.id}`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{workout.name || "Workout"}</div>
                        {workout.completedAt ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(workout.startedAt), "h:mm a")}
                        {workout.duration && ` • ${workout.duration} min`}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {workout.sets?.length || 0} sets
                      </div>
                      {workout.completedAt && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          Completed
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No workouts on this day</p>
                  <Link
                    href="/dashboard/history"
                    className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Start a workout
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">
                Select a day to view workouts
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg border flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 rounded"></div>
          <span className="text-gray-600">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-green-300 rounded"></div>
          <span className="text-gray-600">Has workouts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
          </div>
          <span className="text-gray-600">Multiple workouts</span>
        </div>
      </div>
    </div>
  );
}
