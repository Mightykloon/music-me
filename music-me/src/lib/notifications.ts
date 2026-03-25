import { db } from "@/lib/db";

type NotificationType = "FOLLOW" | "REACTION" | "COMMENT" | "REPOST" | "MENTION" | "PLAYLIST_DROP";

/**
 * Create a notification for a user.
 * Won't create a notification if the actor is the same as the recipient.
 */
export async function createNotification({
  userId,
  actorId,
  type,
  referenceId,
  referenceType,
}: {
  userId: string;
  actorId: string;
  type: NotificationType;
  referenceId?: string;
  referenceType?: string;
}) {
  // Don't notify yourself
  if (userId === actorId) return;

  try {
    await db.notification.create({
      data: {
        userId,
        actorId,
        type,
        referenceId: referenceId ?? null,
        referenceType: referenceType ?? null,
      },
    });
  } catch {
    // Silently fail — notifications should never break the main action
  }
}
