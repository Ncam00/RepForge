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

// Calculate streak based on last workout date
export function calculateStreak(lastWorkoutDate: Date | null): { currentStreak: number; shouldContinue: boolean } {
  if (!lastWorkoutDate) {
    return { currentStreak: 1, shouldContinue: false };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastWorkout = new Date(
    lastWorkoutDate.getFullYear(),
    lastWorkoutDate.getMonth(),
    lastWorkoutDate.getDate()
  );

  const daysDiff = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Worked out today already, continue streak
    return { currentStreak: 0, shouldContinue: true };
  } else if (daysDiff === 1) {
    // Worked out yesterday, continue streak
    return { currentStreak: 1, shouldContinue: true };
  } else {
    // Streak broken, start new streak
    return { currentStreak: 1, shouldContinue: false };
  }
}

// Award XP and update user progress
export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  source: string,
  prisma: any
): Promise<{ leveledUp: boolean; newLevel: number; totalXp: number }> {
  // Get or create user progress
  let progress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalXpEarned: 0,
        lastWorkoutDate: null,
      },
    });
  }

  const oldLevel = progress.level;
  const newXp = progress.xp + amount;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > oldLevel;

  // Update progress
  await prisma.userProgress.update({
    where: { userId },
    data: {
      xp: newXp,
      level: newLevel,
      totalXpEarned: progress.totalXpEarned + amount,
    },
  });

  // Record transaction
  await prisma.xpTransaction.create({
    data: {
      userId,
      amount,
      reason,
      source,
    },
  });

  return { leveledUp, newLevel, totalXp: newXp };
}

// Update streak when workout is completed
export async function updateStreak(
  userId: string,
  prisma: any
): Promise<{ streakBonus: number; currentStreak: number }> {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    return { streakBonus: 0, currentStreak: 0 };
  }

  const { currentStreak: streakIncrement, shouldContinue } = calculateStreak(progress.lastWorkoutDate);

  let newStreak = progress.currentStreak;
  
  if (!shouldContinue) {
    // Streak broken or new streak
    newStreak = streakIncrement;
  } else if (streakIncrement > 0) {
    // Continue streak (worked out yesterday)
    newStreak = progress.currentStreak + streakIncrement;
  }
  // If streakIncrement === 0, already worked out today, don't change streak

  const longestStreak = Math.max(newStreak, progress.longestStreak);
  const streakBonus = streakIncrement > 0 ? calculateStreakBonus(newStreak) : 0;

  // Update progress with new streak and last workout date
  await prisma.userProgress.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastWorkoutDate: new Date(),
    },
  });

  return { streakBonus: Math.floor(streakBonus), currentStreak: newStreak };
}
