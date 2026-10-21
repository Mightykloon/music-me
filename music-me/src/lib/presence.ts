import { db } from "@/lib/db";
import { ONLINE_WINDOW_MS } from "@/lib/presence-config";

// Who's online: every open, visible tab of a signed-in user sends a heartbeat
// (see components/presence-heartbeat.tsx) which stamps User.lastSeenAt.
// "Online" means a heartbeat within the last ONLINE_WINDOW_MS.

/** skip the write if the last stamp is this fresh (several tabs open, quick reloads) */
const MIN_WRITE_GAP_MS = 60 * 1000;

/** Record a heartbeat. One cheap conditional update; usually a no-op. */
export async function touchPresence(userId: string) {
  const stale = new Date(Date.now() - MIN_WRITE_GAP_MS);
  await db.user.updateMany({
    where: { id: userId, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: stale } }] },
    data: { lastSeenAt: new Date() },
  });
}

/** People online right now, most recently active first. */
export async function onlineUsers(excludeId: string | null, take = 50) {
  return db.user.findMany({
    where: {
      lastSeenAt: { gte: new Date(Date.now() - ONLINE_WINDOW_MS) },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { lastSeenAt: "desc" },
    take,
    select: {
      id: true,
      username: true,
      displayName: true,
      profile: { select: { profilePictureUrl: true } },
    },
  });
}
