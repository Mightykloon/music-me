import { db } from "@/lib/db";
import { getMusicProvider } from "./index";
import { findOrCreateTrack } from "./search";
import { decrypt, encrypt } from "@/lib/utils/encryption";
import type { MusicProviderType } from "@prisma/client";

/**
 * Get a valid access token, refreshing if expired.
 */
export async function getValidAccessToken(connection: {
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
 * Sync playlist metadata only (fast — no track fetching).
 * Returns the list of playlist IDs that were synced.
 */
export async function syncPlaylistMetadata(connectionId: string): Promise<string[]> {
  const connection = await db.musicConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection || !connection.isActive) return [];

  const provider = getMusicProvider(connection.provider);
  const accessToken = await getValidAccessToken(connection);
  const remotePlaylists = await provider.getUserPlaylists(accessToken);
  const playlistIds: string[] = [];

  for (const remote of remotePlaylists) {
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
    playlistIds.push(playlist.id);
  }

  return playlistIds;
}

/**
 * Sync tracks for a single playlist by its DB id.
 */
export async function syncPlaylistTracks(playlistId: string): Promise<number> {
  const playlist = await db.playlist.findUnique({
    where: { id: playlistId },
    include: { user: { select: { id: true } } },
  });
  if (!playlist) throw new Error("Playlist not found");

  // Find the connection for this provider
  const connection = await db.musicConnection.findFirst({
    where: {
      userId: playlist.userId,
      provider: playlist.provider,
      isActive: true,
    },
  });
  if (!connection) throw new Error("No active connection");

  const provider = getMusicProvider(connection.provider);
  const accessToken = await getValidAccessToken(connection);

  const remoteTracks = await provider.getPlaylistTracks(
    accessToken,
    playlist.providerPlaylistId
  );

  // Delete existing and re-insert
  await db.playlistTrack.deleteMany({ where: { playlistId } });

  // Batch inserts for speed
  for (const rt of remoteTracks) {
    const track = await findOrCreateTrack(rt.track);
    await db.playlistTrack.create({
      data: {
        playlistId,
        trackId: track.id,
        position: rt.position,
        addedAt: rt.addedAt,
      },
    });
  }

  // Update track count
  await db.playlist.update({
    where: { id: playlistId },
    data: { trackCount: remoteTracks.length, lastSyncedAt: new Date() },
  });

  return remoteTracks.length;
}

/**
 * Legacy: Sync all playlists for a specific music connection (metadata only).
 */
export async function syncPlaylists(connectionId: string) {
  return syncPlaylistMetadata(connectionId);
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
      .map((c) => syncPlaylistMetadata(c.id))
  );
}

/**
 * Import playlists on initial connection (metadata only — tracks synced on demand).
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
