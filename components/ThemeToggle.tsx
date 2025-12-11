"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Theme</label>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setTheme("light")}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
            theme === "light"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <Sun className="h-5 w-5" />
          <span className="text-sm font-medium">Light</span>
        </button>

        <button
          onClick={() => setTheme("dark")}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
            theme === "dark"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <Moon className="h-5 w-5" />
          <span className="text-sm font-medium">Dark</span>
        </button>

        <button
          onClick={() => setTheme("system")}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
            theme === "system"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <Monitor className="h-5 w-5" />
          <span className="text-sm font-medium">System</span>
        </button>
      </div>
    </div>
  );
}
