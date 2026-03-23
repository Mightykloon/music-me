import { db } from "@/lib/db";
import { getMusicProvider } from "./index";
import { findOrCreateTrack } from "./search";
import { decrypt } from "@/lib/utils/encryption";
import type { MusicProviderType } from "@prisma/client";

/**
 * Sync all playlists for a specific music connection.
 */
export async function syncPlaylists(connectionId: string) {
  const connection = await db.musicConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection || !connection.isActive) return;

  const provider = getMusicProvider(connection.provider);
  const accessToken = decrypt(connection.accessToken);

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
