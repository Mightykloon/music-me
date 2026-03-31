import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getMusicProvider } from "@/lib/music";
import { getValidAccessToken } from "@/lib/music/playlist-sync";
import { findOrCreateTrack } from "@/lib/music/search";
import { SpotifyProvider, getSpotifyClientToken } from "@/lib/music/providers/spotify";

export const maxDuration = 60;

/**
 * Incremental playlist track sync — processes small batches (10 tracks)
 * for reliability on large playlists.
 *
 * Query params:
 *   offset (default 0) — starting position in the playlist
 *   limit  (default 10) — tracks per request (kept small for reliability)
 *
 * Returns: { synced, total, hasMore, nextOffset, currentOffset }
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
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));

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

    const provider = getMusicProvider(playlist.provider);

    // Get access token — for Spotify, prefer client credentials (works for public playlists
    // without needing a user's OAuth token, avoiding expired/revoked token issues)
    let accessToken: string;

    if (playlist.provider === "SPOTIFY") {
      try {
        accessToken = await getSpotifyClientToken();
      } catch (err) {
        console.error("Client credentials failed, trying user token:", err);
        if (connection) {
          accessToken = await getValidAccessToken(connection, offset === 0);
        } else {
          return NextResponse.json(
            { error: "Failed to get Spotify access token" },
            { status: 500 }
          );
        }
      }
    } else if (connection) {
      accessToken = await getValidAccessToken(connection, offset === 0);
    } else {
      return NextResponse.json(
        { error: "No active connection for this provider" },
        { status: 400 }
      );
    }

    // Helper to fetch a page with retry logic for 429
    async function fetchPage(token: string, pId: string, off: number, lim: number) {
      if (!(provider instanceof SpotifyProvider)) return null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const currentToken = attempt > 0 ? await getSpotifyClientToken() : token;
          return await provider.getPlaylistTracksPage(currentToken, pId, off, lim);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          if (msg.includes("429")) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          if ((msg.includes("403") || msg.includes("401")) && attempt < 2) {
            console.log(`Got ${msg} on attempt ${attempt + 1}, refreshing token...`);
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          throw err;
        }
      }
      return null;
    }

    if (provider instanceof SpotifyProvider) {
      const page = await fetchPage(accessToken, playlist.providerPlaylistId, offset, limit);
      if (!page) {
        return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
      }

      // Upsert each track individually — no bulk delete
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
          console.error(`Failed to sync track at position ${rt.position}:`, err);
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
