import { redis } from "@/lib/redis";

export interface SyncedLyricLine {
  time: number; // milliseconds
  text: string;
}

export interface LyricsResult {
  synced: boolean;
  lines: SyncedLyricLine[];
  plainText: string;
  source: "musixmatch" | "lrclib";
}

const CACHE_TTL = 86400; // 24 hours

/**
 * Fetch synced lyrics for a track. Tries Musixmatch first, falls back to LRCLIB.
 */
export async function getLyrics(
  title: string,
  artist: string,
  duration?: number
): Promise<LyricsResult | null> {
  const cacheKey = `lyrics:${artist}:${title}`.toLowerCase().replace(/\s+/g, "_");

  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Redis unavailable, proceed without cache
  }

  // Try Musixmatch
  let result = await fetchMusixmatch(title, artist);

  // Fallback to LRCLIB
  if (!result) {
    result = await fetchLrclib(title, artist, duration);
  }

  // Cache result
  if (result) {
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch {
      // Redis unavailable
    }
  }

  return result;
}

async function fetchMusixmatch(
  title: string,
  artist: string
): Promise<LyricsResult | null> {
  const apiKey = process.env.MUSIXMATCH_API_KEY;
  if (!apiKey) return null;

  try {
    // Search for the track
    const searchRes = await fetch(
      `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}&apikey=${apiKey}`
    );
    const searchData = await searchRes.json();

    if (searchData.message?.header?.status_code !== 200) return null;

    const lyrics = searchData.message?.body?.lyrics;
    if (!lyrics?.lyrics_body) return null;

    // Try to get synced lyrics (subtitle)
    const subtitleRes = await fetch(
      `https://api.musixmatch.com/ws/1.1/matcher.subtitle.get?q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}&apikey=${apiKey}`
    );
    const subtitleData = await subtitleRes.json();
    const subtitle = subtitleData.message?.body?.subtitle;

    if (subtitle?.subtitle_body) {
      try {
        const lines = JSON.parse(subtitle.subtitle_body);
        return {
          synced: true,
          lines: lines.map(
            (l: { time: { total: number }; text: string }) => ({
              time: Math.round(l.time.total * 1000),
              text: l.text,
            })
          ),
          plainText: lyrics.lyrics_body,
          source: "musixmatch",
        };
      } catch {
        // Failed to parse subtitle, fall through to plain text
      }
    }

    // Return plain text lyrics
    return {
      synced: false,
      lines: lyrics.lyrics_body
        .split("\n")
        .filter((l: string) => l.trim())
        .map((text: string, i: number) => ({ time: i * 3000, text })),
      plainText: lyrics.lyrics_body,
      source: "musixmatch",
    };
  } catch {
    return null;
  }
}

async function fetchLrclib(
  title: string,
  artist: string,
  duration?: number
): Promise<LyricsResult | null> {
  try {
    let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    if (duration) {
      url += `&duration=${Math.round(duration / 1000)}`;
    }

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();

    if (data.syncedLyrics) {
      const lines = parseLrc(data.syncedLyrics);
      return {
        synced: true,
        lines,
        plainText: data.plainLyrics ?? data.syncedLyrics,
        source: "lrclib",
      };
    }

    if (data.plainLyrics) {
      return {
        synced: false,
        lines: data.plainLyrics
          .split("\n")
          .filter((l: string) => l.trim())
          .map((text: string, i: number) => ({ time: i * 3000, text })),
        plainText: data.plainLyrics,
        source: "lrclib",
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse LRC format timestamps into millisecond-indexed lines.
 * Format: [mm:ss.xx] or [mm:ss.xxx]
 */
function parseLrc(lrc: string): SyncedLyricLine[] {
  const lines: SyncedLyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/;

  for (const line of lrc.split("\n")) {
    const match = regex.exec(line);
    if (!match) continue;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    let ms = parseInt(match[3], 10);
    if (match[3].length === 2) ms *= 10; // convert centiseconds to ms

    const time = minutes * 60000 + seconds * 1000 + ms;
    const text = match[4].trim();

    if (text) {
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}
