import { db } from "@/lib/db";
import { getMusicProvider } from "./index";
import { findOrCreateTrack } from "./search";
import { decrypt, encrypt } from "@/lib/utils/encryption";
import type { MusicProviderType } from "@prisma/client";

/**
 * Get a valid access token, refreshing if expired.
 */
async function getValidAccessToken(connection: {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  provider: MusicProviderType;
}): Promise<string> {
  const accessToken = decrypt(connection.accessToken);

  // If token is not expired, use it directly
  if (!connection.expiresAt || connection.expiresAt > new Date()) {
    return accessToken;
  }

  // Token expired, try to refresh
  if (!connection.refreshToken) {
    throw new Error("Token expired and no refresh token available");
  }

  const provider = getMusicProvider(connection.provider);
  const refreshed = await provider.refreshToken(decrypt(connection.refreshToken));

  // Update tokens in DB
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

  // Get a valid (refreshed if needed) access token
  const accessToken = await getValidAccessToken(connection);

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
    } catch (err) {
      console.error(`Failed to sync tracks for playlist ${playlist.name}:`, err);
      // Continue with other playlists
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
 * Import playlists on initial connection — includes full track sync.
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
    const playlist = await db.playlist.upsert({
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

    // Also sync tracks for each playlist
    try {
      const remoteTracks = await musicProvider.getPlaylistTracks(
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
    } catch (err) {
      console.error(`Failed to sync tracks for playlist ${remote.name}:`, err);
      // Continue with other playlists
    }
  }
}
