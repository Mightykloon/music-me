import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getMusicProvider } from "@/lib/music";
import { getValidAccessToken } from "@/lib/music/playlist-sync";
import { findOrCreateTrack } from "@/lib/music/search";
import { SpotifyProvider } from "@/lib/music/providers/spotify";

export const maxDuration = 60;

/**
 * Incremental playlist track sync.
 * Query params:
 *   offset (default 0) — which page of tracks to sync
 *   limit  (default 50) — tracks per page
 *   clear  (default false) — if "true", delete existing tracks first (use on first page)
 *
 * Returns: { synced, total, hasMore, nextOffset }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") ?? 50)));
    const clear = searchParams.get("clear") === "true";

    // Verify ownership
    const playlist = await db.playlist.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Find the user's active connection for this provider
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

    // Get valid access token
    const accessToken = await getValidAccessToken(connection);
    const provider = getMusicProvider(playlist.provider);

    // Use paginated fetch if available (Spotify), otherwise fall back to full fetch
    if (provider instanceof SpotifyProvider) {
      // Clear existing tracks on first page
      if (clear || offset === 0) {
        await db.playlistTrack.deleteMany({
          where: { playlistId: playlist.id },
        });
      }

      const page = await provider.getPlaylistTracksPage(
        accessToken,
        playlist.providerPlaylistId,
        offset,
        limit
      );

      // Insert this page of tracks
      let synced = 0;
      for (const rt of page.tracks) {
        try {
          const track = await findOrCreateTrack(rt.track);
          await db.playlistTrack.upsert({
            where: {
              playlistId_trackId: {
                playlistId: playlist.id,
                trackId: track.id,
              },
            },
            update: { position: rt.position, addedAt: rt.addedAt },
            create: {
              playlistId: playlist.id,
              trackId: track.id,
              position: rt.position,
              addedAt: rt.addedAt,
            },
          });
          synced++;
        } catch (err) {
          console.error(`Failed to sync track:`, err);
        }
      }

      // Update playlist metadata
      await db.playlist.update({
        where: { id: playlist.id },
        data: {
          trackCount: page.total,
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.json({
        synced,
        total: page.total,
        hasMore: page.hasMore,
        nextOffset: offset + limit,
        currentOffset: offset,
      });
    } else {
      // Non-Spotify: full sync (smaller playlists expected)
      const remoteTracks = await provider.getPlaylistTracks(
        accessToken,
        playlist.providerPlaylistId
      );

      await db.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });

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

      await db.playlist.update({
        where: { id: playlist.id },
        data: { trackCount: remoteTracks.length, lastSyncedAt: new Date() },
      });

      return NextResponse.json({
        synced: remoteTracks.length,
        total: remoteTracks.length,
        hasMore: false,
        nextOffset: 0,
        currentOffset: 0,
      });
    }
  } catch (err) {
    console.error("Playlist sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
