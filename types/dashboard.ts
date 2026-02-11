// Dashboard and workout-related type definitions

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment?: string;
  difficulty?: string;
  description?: string;
  videoUrl?: string;
}

export interface ExerciseSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  restTime?: number | null;
  isWarmup: boolean;
  notes?: string | null;
  completedAt: string;
  exercise: Exercise;
}

export interface WorkoutSession {
  id: string;
  name?: string | null;
  startedAt: string;
  completedAt?: string | null;
  duration?: number | null;
  notes?: string | null;
  mood?: string | null;
  energyLevel?: number | null;
  sets: ExerciseSet[];
  totalSets?: number;
  exercises?: string[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  recordType: string;
  value: number;
  date: string;
  notes?: string;
  exercise?: Exercise;
}

export interface Weight {
  id: string;
  weight: number;
  unit: string;
  bodyFat?: number;
  muscleMass?: number;
  date: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  difficulty?: string;
  category?: string;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  sets?: number;
  reps?: string;
  restTime?: number;
  notes?: string;
  order: number;
}

export interface DashboardStats {
  currentWeight?: number;
  weightChange?: number;
  weightUnit: string;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  totalExercises: number;
  totalVolume: number;
  recentSessions: WorkoutSession[];
  recentPRs: PersonalRecord[];
  streakDays: number;
  totalWorkouts: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  unit: string;
  startDate: string;
  endDate: string;
  isJoined: boolean;
  progress: number;
  participants: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content?: string;
  mood?: string;
  energyLevel?: number;
  sleepQuality?: number;
  bodyWeight?: number;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialShare {
  id: string;
  userId: string;
  sessionId: string;
  caption?: string;
  isPublic: boolean;
  likes: number;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userAvatar?: string;
  isLiked?: boolean;
  commentCount?: number;
}

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon?: string;
  unlockedAt: string;
}

export interface UserSettings {
  weightUnit: string;
  theme: string;
  notifications: boolean;
  restTimerSound: boolean;
  autoStartTimer: boolean;
}

// Analytics types
export interface MuscleGroupEntry {
  name: string;
  value: number;
}

export interface TopExercise {
  name: string;
  sessions: number;
  totalSets: number;
  totalVolume: number;
  avgWeight: number;
}

export interface AnalyticsData {
  weeklyAverage: number;
  consistencyRate: number;
  currentStreak: number;
  totalPRs: number;
  frequencyData: { date: string; count: number }[];
  muscleGroupData: MuscleGroupEntry[];
  volumeData: { week: number; volume: number }[];
  dayDistribution: { day: string; count: number }[];
  topExercises: TopExercise[];
  insights: string[];
}

// Social types
export interface SocialUser {
  id: string;
  name: string;
  email?: string;
  image?: string;
  isFollowing?: boolean;
  workoutCount?: number;
  followers?: number;
  following?: number;
}

export interface LeaderboardEntry {
  rank?: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  metric?: string;
}

// Exercise stats types
export interface ExerciseStatsSession {
  id: string;
  date: string;
  sets: {
    weight: number;
    reps: number;
    rpe?: number;
  }[];
}

export interface ExerciseStats {
  personalRecords: PersonalRecord[];
  bestSets: {
    weight: number;
    reps: number;
    date: string;
    estimated1RM?: number;
  }[];
  recentSessions: ExerciseStatsSession[];
  progressData: {
    date: string;
    maxWeight: number;
    totalVolume: number;
  }[];
}

// Split types
export interface SplitDay {
  name: string;
  exercises: string[];
}

export interface Split {
  id: string;
  name: string;
  description?: string;
  days: SplitDay[];
  isActive: boolean;
  createdAt: string;
}
