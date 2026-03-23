import { db } from "@/lib/db";
import { getMusicProvider } from "./index";
import { findOrCreateTrack } from "./search";
import { decrypt } from "@/lib/utils/encryption";

/**
 * Poll the user's primary music connection for the currently playing track.
 * Updates the NowPlaying record in the database.
 */
export async function pollNowPlaying(userId: string): Promise<boolean> {
  // Find the user's primary (or first active) connection that supports now playing
  const connection = await db.musicConnection.findFirst({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { isPrimary: "desc" },
  });

  if (!connection) return false;

  const provider = getMusicProvider(connection.provider);
  if (!provider.config.supportsNowPlaying) return false;

  try {
    const accessToken = decrypt(connection.accessToken);
    const nowPlaying = await provider.getNowPlaying(accessToken);

    if (!nowPlaying || !nowPlaying.isPlaying) {
      // Clear now playing
      await db.nowPlaying.deleteMany({ where: { userId } });
      return false;
    }

    // Upsert the track
    const track = await findOrCreateTrack(nowPlaying.track);

    // Upsert now playing
    await db.nowPlaying.upsert({
      where: { userId },
      update: {
        trackId: track.id,
        startedAt: nowPlaying.startedAt,
        provider: connection.provider,
        isActive: true,
      },
      create: {
        userId,
        trackId: track.id,
        startedAt: nowPlaying.startedAt,
        provider: connection.provider,
        isActive: true,
      },
    });

    return true;
  } catch {
    return false;
  }
}
