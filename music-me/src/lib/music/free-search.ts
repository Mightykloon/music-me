import type { MusicTrackResult } from "./types";

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
}

/**
 * Free music search using iTunes Search API (no API key required).
 * Used as fallback when user has no connected music services.
 */
export async function freeSearch(
  query: string,
  limit = 20
): Promise<MusicTrackResult[]> {
  try {
    const params = new URLSearchParams({
      term: query,
      media: "music",
      entity: "song",
      limit: String(Math.min(limit, 50)),
    });

    const res = await fetch(
      `https://itunes.apple.com/search?${params}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const results: ITunesResult[] = data.results ?? [];

    return results.map((item) => ({
      provider: "APPLE_MUSIC",
      providerTrackId: String(item.trackId),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName ?? null,
      albumArtUrl: item.artworkUrl100?.replace("100x100", "300x300") ?? null,
      previewUrl: item.previewUrl ?? null,
      duration: item.trackTimeMillis ?? null,
      isrc: null,
      externalUrl: item.trackViewUrl ?? null,
    }));
  } catch {
    return [];
  }
}
