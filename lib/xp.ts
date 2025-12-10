// XP and Level calculation utilities

export const XP_REWARDS = {
  WORKOUT_COMPLETE: 50,
  SET_COMPLETE: 5,
  PR_SET: 100,
  STREAK_BONUS_PER_DAY: 10,
  FIRST_WORKOUT_OF_DAY: 25,
  CHALLENGE_COMPLETE: 200,
  ACHIEVEMENT_UNLOCK: 150,
};

// Calculate level from XP using exponential curve
export function calculateLevel(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100))
  // This means: Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 400 XP, Level 4 = 900 XP, etc.
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Calculate XP needed for next level
export function xpForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  return (nextLevel - 1) ** 2 * 100;
}

// Calculate XP needed to reach a specific level
export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100;
}

// Get XP progress towards next level
export function getXpProgress(currentXp: number): {
  currentLevel: number;
  nextLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevel(currentXp);
  const nextLevel = currentLevel + 1;
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(nextLevel);
  const xpInCurrentLevel = currentXp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progressPercent = (xpInCurrentLevel / xpNeededForNext) * 100;

  return {
    currentLevel,
    nextLevel,
    currentLevelXp,
    nextLevelXp,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercent,
  };
}

// Get level badge/title based on level
export function getLevelBadge(level: number): {
  title: string;
  color: string;
  icon: string;
} {
  if (level >= 50) return { title: "Legend", color: "from-purple-500 to-pink-500", icon: "👑" };
  if (level >= 40) return { title: "Master", color: "from-yellow-500 to-orange-500", icon: "🏆" };
  if (level >= 30) return { title: "Expert", color: "from-blue-500 to-cyan-500", icon: "⭐" };
  if (level >= 20) return { title: "Advanced", color: "from-green-500 to-emerald-500", icon: "💪" };
  if (level >= 10) return { title: "Intermediate", color: "from-gray-500 to-slate-500", icon: "🔥" };
  return { title: "Beginner", color: "from-gray-400 to-gray-500", icon: "🌱" };
}

// Calculate streak bonus XP
export function calculateStreakBonus(streakDays: number): number {
  const baseBonus = XP_REWARDS.STREAK_BONUS_PER_DAY * streakDays;
  // Bonus multiplier for milestones
  if (streakDays >= 365) return baseBonus * 3; // 1 year streak
  if (streakDays >= 100) return baseBonus * 2.5; // 100 day streak
  if (streakDays >= 30) return baseBonus * 2; // 30 day streak
  if (streakDays >= 7) return baseBonus * 1.5; // 7 day streak
  return baseBonus;
}
