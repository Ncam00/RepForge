/**
 * lib/notifications.ts
 *
 * Server-side utility for creating in-app notifications.
 * Import and call `createNotification()` from any API route handler
 * to queue a notification for a user.
 *
 * Example usage in sessions/[id]/sets/route.ts (after a PR is set):
 *   await createNotification(userId, {
 *     type: "pr_achieved",
 *     title: "New Personal Record!",
 *     message: `You hit a new PR on ${exerciseName}: ${value} ${unit}`,
 *     data: { exerciseId, recordType, value },
 *   });
 */

import prisma from "@/lib/db";

export type NotificationType =
  | "workout_reminder"
  | "pr_achieved"
  | "streak_milestone"
  | "streak_broken"
  | "challenge_update"
  | "challenge_completed"
  | "level_up"
  | "achievement_unlocked"
  | "social_follow"
  | "social_like"
  | "social_comment"
  | "template_shared";

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  /** Optional context payload serialized as JSON */
  data?: Record<string, unknown>;
}

/**
 * Creates a notification for a specific user. This is a fire-and-forget
 * helper — errors are logged but not re-thrown so they don't interrupt
 * the calling request.
 */
export async function createNotification(
  userId: string,
  notification: CreateNotificationInput
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data ? JSON.stringify(notification.data) : null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Do not re-throw — notification failure should not break the main request
  }
}

/**
 * Creates notifications for multiple users at once (e.g. follower notifications).
 * Uses createMany for efficiency.
 */
export async function createNotifications(
  userIds: string[],
  notification: CreateNotificationInput
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data ? JSON.stringify(notification.data) : null,
      })),
    });
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
  }
}

// ── Pre-built notification factories ──────────────────────────────────────────

export const Notifications = {
  prAchieved: (exerciseName: string, recordType: string, value: number, exerciseId: string) => ({
    type: "pr_achieved" as NotificationType,
    title: "🏆 New Personal Record!",
    message: `You crushed your ${recordType.replace(/_/g, " ")} on ${exerciseName}: ${value}`,
    data: { exerciseId, recordType, value },
  }),

  streakMilestone: (days: number) => ({
    type: "streak_milestone" as NotificationType,
    title: `🔥 ${days}-Day Streak!`,
    message: `Amazing! You've trained ${days} days in a row. Keep it up!`,
    data: { days },
  }),

  streakBroken: (previousStreak: number) => ({
    type: "streak_broken" as NotificationType,
    title: "Streak Ended",
    message: `Your ${previousStreak}-day streak ended. Start a new one today!`,
    data: { previousStreak },
  }),

  levelUp: (newLevel: number) => ({
    type: "level_up" as NotificationType,
    title: `⬆️ Level Up! You're now Level ${newLevel}`,
    message: `Congratulations! Keep earning XP to reach Level ${newLevel + 1}.`,
    data: { newLevel },
  }),

  achievementUnlocked: (title: string, description: string, achievementId: string) => ({
    type: "achievement_unlocked" as NotificationType,
    title: `🎖️ Achievement Unlocked: ${title}`,
    message: description,
    data: { achievementId },
  }),

  challengeCompleted: (challengeTitle: string, xpReward: number, challengeId: string) => ({
    type: "challenge_completed" as NotificationType,
    title: `🏅 Challenge Complete: ${challengeTitle}`,
    message: `You earned ${xpReward} XP for completing this challenge!`,
    data: { challengeId, xpReward },
  }),

  socialFollow: (followerName: string, followerId: string) => ({
    type: "social_follow" as NotificationType,
    title: "New Follower",
    message: `${followerName} started following you.`,
    data: { followerId },
  }),

  socialLike: (likerName: string, sessionName: string, shareId: string) => ({
    type: "social_like" as NotificationType,
    title: "Someone liked your workout",
    message: `${likerName} liked your "${sessionName}" session.`,
    data: { shareId },
  }),
};
