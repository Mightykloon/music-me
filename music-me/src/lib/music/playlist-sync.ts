import { db } from "@/lib/db";
import { getMusicProvider } from "./index";
import { findOrCreateTrack } from "./search";
import { decrypt, encrypt } from "@/lib/utils/encryption";
import type { MusicProviderType } from "@prisma/client";

/**
 * Get a valid access token for a connection, refreshing if expired.
 */
async function getValidToken(connection: {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  provider: string;
}): Promise<string> {
  const provider = getMusicProvider(connection.provider as MusicProviderType);
  const token = decrypt(connection.accessToken);

  // If token hasn't expired, use it directly
  if (!connection.expiresAt || connection.expiresAt > new Date()) {
    return token;
  }

  // Token expired — try to refresh
  if (!connection.refreshToken) {
    throw new Error("Token expired and no refresh token available");
  }

  const refreshed = await provider.refreshToken(
    decrypt(connection.refreshToken)
  );

  // Update stored tokens
  await db.musicConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encrypt(refreshed.accessToken),
      refreshToken: refreshed.refreshToken
        ? encrypt(refreshed.refreshToken)
        : undefined,
      expiresAt: refreshed.expiresAt,
    },
  });

  return refreshed.accessToken;
}

/**
 * Sync all playlists for a specific music connection.
 */
export async function syncPlaylists(connectionId: string) {
  const connection = await db.musicConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection || !connection.isActive) return;

  const provider = getMusicProvider(connection.provider);
  const accessToken = await getValidToken(connection);

  // Fetch playlists from the service
  const remotePlaylists = await provider.getUserPlaylists(accessToken);

  for (const remote of remotePlaylists) {
    // Upsert playlist
    const playlist = await db.playlist.upsert({
      where: {
        userId_provider_providerPlaylistId: {
          userId: connection.userId,
          provider: connection.provider,
          providerPlaylistId: remote.providerPlaylistId,
        },
      },
      update: {
        name: remote.name,
        description: remote.description,
        coverImageUrl: remote.coverImageUrl,
        trackCount: remote.trackCount,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: connection.userId,
        provider: connection.provider,
        providerPlaylistId: remote.providerPlaylistId,
        name: remote.name,
        description: remote.description,
        coverImageUrl: remote.coverImageUrl,
        trackCount: remote.trackCount,
      },
    });

    // Sync tracks for this playlist
    try {
      const remoteTracks = await provider.getPlaylistTracks(
        accessToken,
        remote.providerPlaylistId
      );

      // Remove existing playlist tracks
      await db.playlistTrack.deleteMany({
        where: { playlistId: playlist.id },
      });

      // Insert new tracks
      for (const rt of remoteTracks) {
        const track = await findOrCreateTrack(rt.track);
        await db.playlistTrack.create({
          data: {
            playlistId: playlist.id,
            trackId: track.id,
            position: rt.position,
            addedAt: rt.addedAt,
          },
        });
      }
    } catch {
      // Failed to sync tracks for this playlist, continue with others
    }
  }
}

/**
 * Sync playlists for all active connections of a user.
 */
export async function syncAllUserPlaylists(userId: string) {
  const connections = await db.musicConnection.findMany({
    where: { userId, isActive: true },
  });

  await Promise.allSettled(
    connections
      .filter((c) => getMusicProvider(c.provider).config.supportsPlaylists)
      .map((c) => syncPlaylists(c.id))
  );
}

/**
 * Import playlists on initial connection.
 */
export async function importPlaylistsOnConnect(
  userId: string,
  provider: MusicProviderType,
  accessToken: string
) {
  const musicProvider = getMusicProvider(provider);

  if (!musicProvider.config.supportsPlaylists) return;

  const remotePlaylists = await musicProvider.getUserPlaylists(accessToken);

  for (const remote of remotePlaylists) {
    await db.playlist.upsert({
      where: {
        userId_provider_providerPlaylistId: {
          userId,
          provider,
          providerPlaylistId: remote.providerPlaylistId,
        },
      },
      update: {
        name: remote.name,
        description: remote.description,
        coverImageUrl: remote.coverImageUrl,
        trackCount: remote.trackCount,
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        provider,
        providerPlaylistId: remote.providerPlaylistId,
        name: remote.name,
        description: remote.description,
        coverImageUrl: remote.coverImageUrl,
        trackCount: remote.trackCount,
      },
    });
  }
}
