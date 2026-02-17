"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
  initialDuration?: number;
  onComplete?: () => void;
  onClose?: () => void;
  showPresets?: boolean;
  compact?: boolean;
}

const PRESETS = [30, 60, 90, 120, 180];

// Notification sound as base64
const TIMER_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJuGYF5wgYBpYV50c3ZfWWmJiJh2bHKBgHtpYmhoa2ZgYmpqZmBmaW5sZmVmanNvbGhqa2lpZWRjYGBhYWJiYmNkZGRlZWZmZ2doaWlqa2tsbG1tbm5vb3BwcHFxcXJycnNzc3R0dHV1dXZ2dnd3d3h4eHl5eXp6ent7e3x8fH19fX5+fn9/f4CAgIGBgYKCgoODg4SEhIWFhYaGhoeHh4iIiImJiYqKiouLi4yMjI2NjY6Ojo+Pj5CQkJGRkZKSkpOTk5SUlJWVlZaWlpeXl5iYmJmZmZqampubm5ycnJ2dnZ6enp+fn6CgoKGhoaKioqOjo6SkpKWlpaampqenp6ioqKmpqaqqqqurq6ysrK2tra6urq+vr7CwsLGxsbKysrOzs7S0tLW1tba2tre3t7i4uLm5ubq6uru7u7y8vL29vb6+vr+/v8DAwMHBwcLCwsPDw8TExMXFxcbGxsfHx8jIyMnJycrKysvLy8zMzM3Nzc7Ozs/Pz9DQ0NHR0dLS0tPT09TU1NXV1dbW1tfX19jY2NnZ2dra2tvb29zc3N3d3d7e3t/f3+Dg4OHh4eLi4uPj4+Tk5OXl5ebm5ufn5+jo6Onp6erq6uvr6+zs7O3t7e7u7u/v7/Dw8PHx8fLy8vPz8/T09PX19fb29vf39/j4+Pn5+fr6+vv7+/z8/P39/f7+/v///w==";

export function RestTimerWidget({
  initialDuration = 90,
  onComplete,
  onClose,
  showPresets = true,
  compact = false,
}: RestTimerProps) {
  const [duration, setDuration] = useState(initialDuration);
  const [remaining, setRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(TIMER_SOUND);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Ignore audio errors
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          playSound();
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remaining, playSound, onComplete]);

  const handleStart = () => {
    if (remaining === 0) {
      setRemaining(duration);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemaining(duration);
  };

  const handlePreset = (seconds: number) => {
    setDuration(seconds);
    setRemaining(seconds);
    setIsRunning(true);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
        <div className="relative">
          <svg className="w-12 h-12 -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-primary/20"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 - (progress / 100) * 2 * Math.PI * 20}
              className="text-primary transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <Timer className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold tabular-nums">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>
          <div className="text-xs text-muted-foreground">Rest Timer</div>
        </div>
        <div className="flex gap-1">
          {isRunning ? (
            <Button variant="ghost" size="icon" onClick={handlePause}>
              <Pause className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleStart}>
              <Play className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-2 border-primary/30 p-6">
      {/* Progress bar background */}
      <div
        className="absolute inset-0 bg-primary/10 transition-all duration-1000 ease-linear"
        style={{ width: `${progress}%` }}
      />

      <div className="relative z-10">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Timer display */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-4">
            <svg className="w-32 h-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-primary/20"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 - (progress / 100) * 2 * Math.PI * 56}
                className="text-primary transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tabular-nums">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground">
                {isRunning ? "Rest" : remaining === 0 ? "Done!" : "Paused"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 mb-4">
            {isRunning ? (
              <Button onClick={handlePause} variant="outline" size="lg">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button onClick={handleStart} size="lg">
                <Play className="w-5 h-5 mr-2" />
                {remaining === 0 ? "Restart" : remaining === duration ? "Start" : "Resume"}
              </Button>
            )}
            <Button onClick={handleReset} variant="outline" size="icon">
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="ghost"
              size="icon"
              className={soundEnabled ? "" : "text-muted-foreground"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          </div>

          {/* Presets */}
          {showPresets && (
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={duration === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePreset(preset)}
                  className="min-w-[60px]"
                >
                  {preset >= 60 ? `${Math.floor(preset / 60)}:${(preset % 60).toString().padStart(2, "0")}` : `${preset}s`}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Floating timer button for quick access
export function FloatingRestTimer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all"
      >
        <Timer className="w-6 h-6" />
      </button>

      {/* Timer popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80">
          <RestTimerWidget onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
