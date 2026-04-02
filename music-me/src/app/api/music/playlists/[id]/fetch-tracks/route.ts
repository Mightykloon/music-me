import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/music/playlist-sync";
import { findOrCreateTrack } from "@/lib/music/search";
import type { MusicTrackResult } from "@/lib/music/types";

export const maxDuration = 60;

/**
 * Server-side playlist track fetch using GET /playlists/{id} endpoint.
 * This endpoint returns tracks INLINE with the playlist object, which may
 * be less restricted than GET /playlists/{id}/tracks in Spotify Dev Mode.
 *
 * Falls back to GET /playlists/{id}/tracks if the inline approach fails.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const playlist = await db.playlist.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!playlist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const connection = await db.musicConnection.findFirst({
      where: {
        userId: session.user.id,
        provider: playlist.provider,
        isActive: true,
      },
    });
    if (!connection) {
      return NextResponse.json({ error: "No active connection" }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(connection, true);
    const playlistId = playlist.providerPlaylistId;

    // Strategy 1: GET /playlists/{id} — full playlist object with tracks inline
    const allItems: SpotifyTrackItem[] = [];
    let total = 0;
    let strategy = "none";

    const r1 = await spotifyFetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      accessToken
    );

    if (r1.ok) {
      const pl = await r1.json();
      total = pl.tracks?.total ?? 0;
      const items = (pl.tracks?.items ?? []) as SpotifyTrackItem[];
      allItems.push(...items);
      strategy = "playlist-object";

      // Try pagination (may 403 in Dev Mode)
      let nextUrl: string | null = pl.tracks?.next ?? null;
      while (nextUrl) {
        await delay(300);
        const pageRes = await spotifyFetch(nextUrl, accessToken);
        if (!pageRes.ok) break;
        const pageData = await pageRes.json();
        allItems.push(...((pageData.items ?? []) as SpotifyTrackItem[]));
        nextUrl = pageData.next ?? null;
      }
    }

    // Strategy 2: GET /playlists/{id}/tracks directly
    if (allItems.length === 0) {
      const r2 = await spotifyFetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&additional_types=track`,
        accessToken
      );
      if (r2.ok) {
        const d = await r2.json();
        total = d.total ?? 0;
        allItems.push(...((d.items ?? []) as SpotifyTrackItem[]));
        strategy = "tracks-endpoint";

        let nextUrl: string | null = d.next ?? null;
        while (nextUrl) {
          await delay(300);
          const pageRes = await spotifyFetch(nextUrl, accessToken);
          if (!pageRes.ok) break;
          const pageData = await pageRes.json();
          allItems.push(...((pageData.items ?? []) as SpotifyTrackItem[]));
          nextUrl = pageData.next ?? null;
        }
      }
    }

    if (allItems.length === 0 && total === 0) {
      // Both strategies failed — return error info
      const status1 = r1.ok ? 200 : r1.status;
      return NextResponse.json({
        synced: 0,
        total: 0,
        error: `Spotify returned no tracks (status: ${status1}). Dev Mode may be blocking.`,
        strategy,
      });
    }

    // Map and store tracks
    let synced = 0;
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      if (!item.track || item.track.type !== "track" || !item.track.id) continue;

      try {
        const trackData: MusicTrackResult = {
          provider: "SPOTIFY",
          providerTrackId: item.track.id,
          title: item.track.name ?? "",
          artist: (item.track.artists ?? []).map((a: { name: string }) => a.name).join(", "),
          album: item.track.album?.name ?? null,
          albumArtUrl: item.track.album?.images?.[0]?.url ?? null,
          previewUrl: item.track.preview_url ?? null,
          duration: item.track.duration_ms ?? null,
          isrc: item.track.external_ids?.isrc ?? null,
          externalUrl: item.track.external_urls?.spotify ?? null,
        };

        const track = await findOrCreateTrack(trackData);
        await db.playlistTrack.upsert({
          where: {
            playlistId_trackId: { playlistId: playlist.id, trackId: track.id },
          },
          update: { position: i, addedAt: new Date(item.added_at || Date.now()) },
          create: {
            playlistId: playlist.id,
            trackId: track.id,
            position: i,
            addedAt: new Date(item.added_at || Date.now()),
          },
        });
        synced++;
      } catch (err) {
        console.error(`Failed to store track at position ${i}:`, err);
      }
    }

    // Update playlist metadata
    await db.playlist.update({
      where: { id: playlist.id },
      data: { trackCount: total || synced, lastSyncedAt: new Date() },
    });

    return NextResponse.json({ synced, total, strategy });
  } catch (err) {
    console.error("Fetch-tracks error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed", synced: 0, total: 0 },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SpotifyTrackItem {
  added_at?: string;
  track: {
    id: string;
    name: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    artists: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    album: any;
    preview_url: string | null;
    duration_ms: number | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    external_ids: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    external_urls: any;
  } | null;
}

async function spotifyFetch(url: string, token: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    const wait = Number(res.headers.get("Retry-After") ?? 3);
    await delay(wait * 1000);
    return spotifyFetch(url, token);
  }
  return res;
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
