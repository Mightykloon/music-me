import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { ImportError, MAX_PLAYLIST_TRACKS, linksFor, readMore } from "@/lib/music/link-import";
import { appendTracks } from "@/lib/music/playlist-store";
import { getValidAccessToken } from "@/lib/music/playlist-sync";

export const maxDuration = 30;

const body = z.object({ cursor: z.string().min(1).max(500) });

/**
 * POST { cursor }: read the next batch of one of your playlists and add it to
 * the end. Returns the new song count and the cursor for the batch after
 * (null when done). The browser calls this in a loop, a second or so apart,
 * so a 1,000-song playlist fills in over about ten requests.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // enough for a few thousand songs per ten minutes, not an endless loop
  const blocked = await guard(request, "playlist-more", { limit: 60, windowSec: 10 * 60, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  const userId = session!.user!.id!;

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { id } = await params;
  const playlist = await db.playlist.findFirst({ where: { id, userId }, select: { provider: true, providerPlaylistId: true, trackCount: true } });
  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (playlist.trackCount >= MAX_PLAYLIST_TRACKS) {
    return NextResponse.json({ trackCount: playlist.trackCount, added: 0, next: null, capped: true });
  }

  const kind = parsed.data.cursor.startsWith("album:") ? "album" : "playlist";
  const link = linksFor(playlist.provider, playlist.providerPlaylistId).find((l) => l.kind === kind);
  if (!link) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  // Spotify lists past 100 songs only to a signed-in Spotify account
  let spotifyToken: string | null = null;
  if (playlist.provider === "SPOTIFY") {
    const connection = await db.musicConnection.findFirst({ where: { userId, provider: "SPOTIFY", isActive: true } });
    if (connection) spotifyToken = await getValidAccessToken(connection).catch(() => null);
  }

  try {
    const batch = await readMore(link, parsed.data.cursor, spotifyToken);
    const trackCount = batch.tracks.length ? await appendTracks(id, playlist.provider, batch.tracks) : playlist.trackCount;
    return NextResponse.json({
      trackCount,
      added: trackCount - playlist.trackCount,
      next: trackCount >= MAX_PLAYLIST_TRACKS ? null : batch.next,
      needsSpotifyLogin: batch.needsSpotifyLogin ?? false,
    });
  } catch (err) {
    if (err instanceof ImportError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("Playlist batch failed:", err);
    return NextResponse.json({ error: "Couldn't load more songs. Try again in a bit." }, { status: 500 });
  }
}
