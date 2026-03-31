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

    if (!connection) {
      return NextResponse.json(
        { error: "No active connection for this provider" },
        { status: 400 }
      );
    }

    // Always force-refresh user token on first page to ensure it's valid
    const forceRefresh = offset === 0;
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(connection, forceRefresh);
    } catch (refreshErr) {
      console.error("Token refresh failed:", refreshErr);
      return NextResponse.json(
        { error: `Token refresh failed: ${refreshErr instanceof Error ? refreshErr.message : "Unknown error"}. Try reconnecting Spotify in Settings > Connections.` },
        { status: 401 }
      );
    }

    // Helper to fetch a page with retry logic for 403/429
    // Falls back to client credentials if user token gets 403
    async function fetchPage(token: string, pId: string, off: number, lim: number) {
      if (!(provider instanceof SpotifyProvider)) return null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          let currentToken = token;
          if (attempt === 1) {
            // Second attempt: force-refresh user token
            currentToken = await getValidAccessToken(connection!, true);
          } else if (attempt === 2) {
            // Third attempt: try client credentials as fallback
            try {
              currentToken = await getSpotifyClientToken();
              console.log("Trying client credentials token as fallback...");
            } catch {
              currentToken = await getValidAccessToken(connection!, true);
            }
          }
          return await provider.getPlaylistTracksPage(currentToken, pId, off, lim);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          console.error(`Sync attempt ${attempt + 1}/3 failed for playlist ${pId} offset ${off}:`, msg);
          if (msg.includes("429")) {
            const wait = 3000 * (attempt + 1);
            console.log(`Rate limited, waiting ${wait}ms...`);
            await new Promise(r => setTimeout(r, wait));
            continue;
          }
          if ((msg.includes("403") || msg.includes("401")) && attempt < 2) {
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
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
