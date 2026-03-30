import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SpotifyProvider, getSpotifyClientToken } from "@/lib/music/providers/spotify";
import type { MusicProviderType } from "@prisma/client";

export const maxDuration = 60; // Allow up to 60s for large playlists

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const playlist = await db.playlist.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    if (playlist.provider === "SPOTIFY") {
      const token = await getSpotifyClientToken();
      const spotify = new SpotifyProvider();

      const remoteTracks = await spotify.getPlaylistTracks(
        token,
        playlist.providerPlaylistId
      );

      // Upsert all tracks in parallel batches of 50
      const BATCH_SIZE = 50;
      const trackIds: string[] = [];

      for (let i = 0; i < remoteTracks.length; i += BATCH_SIZE) {
        const batch = remoteTracks.slice(i, i + BATCH_SIZE);
        const upserted = await Promise.all(
          batch.map((rt) =>
            db.musicTrack.upsert({
              where: {
                provider_providerTrackId: {
                  provider: rt.track.provider as MusicProviderType,
                  providerTrackId: rt.track.providerTrackId,
                },
              },
              update: {
                title: rt.track.title,
                artist: rt.track.artist,
                album: rt.track.album,
                albumArtUrl: rt.track.albumArtUrl,
                previewUrl: rt.track.previewUrl,
                duration: rt.track.duration,
                isrc: rt.track.isrc,
                externalUrl: rt.track.externalUrl,
              },
              create: {
                provider: rt.track.provider as MusicProviderType,
                providerTrackId: rt.track.providerTrackId,
                title: rt.track.title,
                artist: rt.track.artist,
                album: rt.track.album,
                albumArtUrl: rt.track.albumArtUrl,
                previewUrl: rt.track.previewUrl,
                duration: rt.track.duration,
                isrc: rt.track.isrc,
                externalUrl: rt.track.externalUrl,
              },
              select: { id: true },
            })
          )
        );
        trackIds.push(...upserted.map((t) => t.id));
      }

      // Clear old playlist tracks
      await db.playlistTrack.deleteMany({
        where: { playlistId: playlist.id },
      });

      // Insert new playlist tracks in batches
      for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
        const batch = trackIds.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((trackId, j) =>
            db.playlistTrack.create({
              data: {
                playlistId: playlist.id,
                trackId,
                position: i + j,
                addedAt: remoteTracks[i + j]?.addedAt ?? new Date(),
              },
            })
          )
        );
      }

      // Update playlist metadata
      await db.playlist.update({
        where: { id: playlist.id },
        data: {
          trackCount: remoteTracks.length,
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        trackCount: remoteTracks.length,
      });
    }

    // For non-Spotify providers, fall back to connection-based sync
    const { syncPlaylists } = await import("@/lib/music/playlist-sync");
    const connection = await db.musicConnection.findFirst({
      where: {
        userId: session.user.id,
        provider: playlist.provider,
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No active connection for this provider" },
        { status: 400 }
      );
    }

    await syncPlaylists(connection.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Playlist sync error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
