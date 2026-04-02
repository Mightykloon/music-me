import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/music/playlist-sync";
import { getSpotifyClientToken } from "@/lib/music/providers/spotify";
import { findOrCreateTrack } from "@/lib/music/search";
import type { MusicTrackResult } from "@/lib/music/types";

export const maxDuration = 60;

/**
 * Server-side playlist track fetch.
 *
 * Tries 3 strategies with 2 different tokens:
 *   1. User token  + GET /playlists/{id}        (inline tracks)
 *   2. User token  + GET /playlists/{id}/tracks  (dedicated endpoint)
 *   3. Client creds + GET /playlists/{id}        (works for public playlists)
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

    const userToken = await getValidAccessToken(connection, true);
    const playlistId = playlist.providerPlaylistId;
    const statusLog: string[] = [];

    // Try fetching tracks with multiple strategies
    const allItems: SpotifyTrackItem[] = [];
    let total = 0;
    let strategy = "none";

    // Strategy 1: User token + GET /playlists/{id}
    {
      const res = await spotifyFetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        userToken
      );
      statusLog.push(`S1 user+playlist: ${res.status}`);
      if (res.ok) {
        const pl = await res.json();
        total = pl.tracks?.total ?? 0;
        const items = (pl.tracks?.items ?? []) as SpotifyTrackItem[];
        statusLog.push(`S1 items: ${items.length}, total: ${total}`);
        if (items.length > 0) {
          allItems.push(...items);
          strategy = "user-playlist-object";
          await paginateItems(allItems, pl.tracks?.next, userToken);
        }
      }
    }

    // Strategy 2: User token + GET /playlists/{id}/tracks
    if (allItems.length === 0) {
      const res = await spotifyFetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&additional_types=track`,
        userToken
      );
      statusLog.push(`S2 user+tracks: ${res.status}`);
      if (res.ok) {
        const d = await res.json();
        total = d.total ?? 0;
        const items = (d.items ?? []) as SpotifyTrackItem[];
        statusLog.push(`S2 items: ${items.length}, total: ${total}`);
        if (items.length > 0) {
          allItems.push(...items);
          strategy = "user-tracks-endpoint";
          await paginateItems(allItems, d.next, userToken);
        }
      }
    }

    // Strategy 3: Client credentials + GET /playlists/{id} (public playlists)
    if (allItems.length === 0) {
      try {
        const clientToken = await getSpotifyClientToken();
        const res = await spotifyFetch(
          `https://api.spotify.com/v1/playlists/${playlistId}`,
          clientToken
        );
        statusLog.push(`S3 client+playlist: ${res.status}`);
        if (res.ok) {
          const pl = await res.json();
          total = pl.tracks?.total ?? 0;
          const items = (pl.tracks?.items ?? []) as SpotifyTrackItem[];
          statusLog.push(`S3 items: ${items.length}, total: ${total}`);
          if (items.length > 0) {
            allItems.push(...items);
            strategy = "client-playlist-object";
            await paginateItems(allItems, pl.tracks?.next, clientToken);
          }
        }
      } catch (e) {
        statusLog.push(`S3 error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    console.log(`[fetch-tracks] ${playlist.name} (${playlistId}): ${statusLog.join(" | ")}`);

    if (allItems.length === 0) {
      return NextResponse.json({
        synced: 0,
        total,
        strategy,
        error: `Spotify blocked all 3 strategies. Log: ${statusLog.join("; ")}`,
      });
    }

    // Store tracks in DB
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
    artists: { name: string }[];
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
    await new Promise(r => setTimeout(r, wait * 1000));
    return spotifyFetch(url, token);
  }
  return res;
}

async function paginateItems(
  allItems: SpotifyTrackItem[],
  nextUrl: string | null | undefined,
  token: string
) {
  let url = nextUrl ?? null;
  while (url) {
    await new Promise(r => setTimeout(r, 300));
    const res = await spotifyFetch(url, token);
    if (!res.ok) break;
    const data = await res.json();
    allItems.push(...((data.items ?? []) as SpotifyTrackItem[]));
    url = data.next ?? null;
  }
}
