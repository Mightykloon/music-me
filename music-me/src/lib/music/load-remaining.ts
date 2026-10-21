"use client";

// After an import or re-sync, big playlists keep filling in a batch at a time
// (see /api/music/playlists/[id]/more), spaced out so the services we read
// from aren't hammered.

const GAP_MS = 1200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface LoadResult {
  trackCount: number;
  /** stopped at Spotify's 100-song limit for people without a connected Spotify account */
  needsSpotifyLogin: boolean;
  error?: string;
}

/** Keep asking for the next batch until there isn't one. `onProgress` gets the song count so far. */
export async function loadRemaining(
  playlistId: string,
  next: string | null,
  trackCount: number,
  onProgress?: (count: number) => void
): Promise<LoadResult> {
  let cursor = next;
  let count = trackCount;
  while (cursor) {
    await sleep(GAP_MS);
    const res = await fetch(`/api/music/playlists/${playlistId}/more`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cursor }),
    });
    if (res.status === 429) {
      // over the per-user limit: wait it out and carry on
      await sleep(Math.min(60, Number(res.headers.get("retry-after") ?? 30)) * 1000);
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { trackCount: count, needsSpotifyLogin: false, error: data.error ?? "Couldn't load the rest of the songs." };
    count = data.trackCount ?? count;
    onProgress?.(count);
    if (data.needsSpotifyLogin) return { trackCount: count, needsSpotifyLogin: true };
    cursor = data.next ?? null;
  }
  return { trackCount: count, needsSpotifyLogin: false };
}

export const SPOTIFY_LIMIT_NOTE =
  "Spotify only shares the first 100 songs of a playlist publicly. Connect your Spotify account in Settings to load the rest, or import the same playlist from Deezer.";
