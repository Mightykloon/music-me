import type { MusicTrack } from "@prisma/client";
import { db } from "@/lib/db";
import { CACHE, cached } from "@/lib/api-guard";

// Where a song can actually be played from, worked out once per track and
// saved on the MusicTrack row so every listener after the first costs nothing:
//   - youtubeVideoId: a full-length upload, played in YouTube's embedded player
//   - spotifyTrackId: for listeners logged into Spotify (its embed plays in full)
//   - previewUrl:     the 30 second clip, refreshed when it's the expiring kind
//   - albumArtUrl:    filled in when the import didn't come with one
//
// Every outside call is cached (see api-guard.ts) and YouTube searches are
// capped per day, because each one spends 100 of the free 10,000 daily units.

export interface TrackSources {
  youtubeId: string | null;
  spotifyId: string | null;
  previewUrl: string | null;
  albumArtUrl: string | null;
}

/** YouTube searches allowed per UTC day across the whole site (100 units each). */
const YOUTUBE_DAILY_SEARCHES = Number(process.env.YOUTUBE_DAILY_SEARCHES ?? 90);
/** stored when a search found nothing, so it isn't repeated */
const NO_MATCH = "none";

async function json<T>(url: string, seconds: number, init: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(url, cached(seconds, init, 6000));
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const mainArtist = (artist: string) => artist.split(/,|&| feat\.| ft\./i)[0].trim();
const cleanTitle = (title: string) => title.replace(/\s*[([].*?[)\]]\s*/g, " ").replace(/\s+-\s+.*$/, "").trim();

// ---------------------------------------------------------------- art

/** Cover art for a Spotify track from its public oEmbed (no key needed). */
export async function spotifyTrackArt(trackId: string): Promise<string | null> {
  const d = await json<{ thumbnail_url?: string }>(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${trackId}`)}`,
    CACHE.art
  );
  return d?.thumbnail_url ?? null;
}

interface ITunesHit {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

async function itunesSearch(artist: string, title: string): Promise<ITunesHit | null> {
  const q = new URLSearchParams({ term: `${mainArtist(artist)} ${cleanTitle(title)}`, media: "music", entity: "song", limit: "5" });
  const d = await json<{ results: ITunesHit[] }>(`https://itunes.apple.com/search?${q}`, CACHE.art);
  const t = cleanTitle(title).toLowerCase();
  return d?.results.find((r) => r.trackName.toLowerCase().includes(t)) ?? d?.results[0] ?? null;
}

const bigArt = (url?: string) => url?.replace(/\/\d+x\d+bb\./, "/600x600bb.") ?? null;

/** Run `fn` over `items`, at most `limit` at a time. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

type ArtRow = Pick<MusicTrack, "id" | "provider" | "providerTrackId" | "title" | "artist" | "albumArtUrl">;

/**
 * Fill in covers for tracks that don't have one (older imports), saving them
 * so it only ever happens once per track. Mutates and returns the rows.
 * Capped per call so a huge page can't fan out into hundreds of requests.
 */
export async function fillMissingArt<T extends ArtRow>(tracks: T[], max = 60): Promise<T[]> {
  const missing = tracks.filter((t) => !t.albumArtUrl).slice(0, max);
  if (missing.length === 0) return tracks;
  const found = await mapLimit(missing, 8, (t) =>
    t.provider === "SPOTIFY"
      ? spotifyTrackArt(t.providerTrackId)
      : itunesSearch(t.artist, t.title).then((h) => bigArt(h?.artworkUrl100))
  );
  const updates = missing.flatMap((t, i) => {
    const url = found[i];
    if (!url) return [];
    t.albumArtUrl = url;
    return [db.musicTrack.update({ where: { id: t.id }, data: { albumArtUrl: url } })];
  });
  if (updates.length > 0) await db.$transaction(updates).catch(() => {});
  return tracks;
}

// ---------------------------------------------------------------- previews

async function freshPreview(track: MusicTrack): Promise<{ url: string | null; persist: boolean }> {
  if (track.provider === "DEEZER") {
    // signed links that expire within hours: always ask again (briefly cached)
    const d = await json<{ preview?: string }>(`https://api.deezer.com/track/${track.providerTrackId}`, CACHE.preview);
    return { url: d?.preview || null, persist: false };
  }
  if (track.previewUrl) return { url: track.previewUrl, persist: false };
  if (track.provider === "APPLE_MUSIC" && /^\d+$/.test(track.providerTrackId)) {
    const d = await json<{ results: ITunesHit[] }>(`https://itunes.apple.com/lookup?id=${track.providerTrackId}`, CACHE.art);
    if (d?.results[0]?.previewUrl) return { url: d.results[0].previewUrl, persist: true };
  }
  // anything else: Apple's clips don't expire, so one found by search is kept
  const hit = await itunesSearch(track.artist, track.title);
  if (hit?.previewUrl) return { url: hit.previewUrl, persist: true };
  const q = encodeURIComponent(`${mainArtist(track.artist)} ${cleanTitle(track.title)}`);
  const dz = await json<{ data?: { preview?: string }[] }>(`https://api.deezer.com/search?q=${q}&limit=3`, CACHE.preview);
  return { url: dz?.data?.find((x) => x.preview)?.preview ?? null, persist: false };
}

// ---------------------------------------------------------------- youtube

interface YtItem {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string };
}

/** Matches made before this were scored more loosely (and picked e.g. fan-uploaded acoustic versions); they're re-checked once. */
const MATCHER_SINCE = new Date("2026-10-21T07:00:00Z");

// words that mean "a different version of the song" unless the song's own title has them
const OTHER_VERSIONS = [
  "acoustic", "live", "cover", "karaoke", "instrumental", "remix", "demo", "unplugged", "piano", "orchestral",
  "sped up", "slowed", "reverb", "8d", "nightcore", "bass boosted", "reaction", "tutorial", "lesson",
  "extended", "loop", "1 hour", "mashup", "version", "edit", "session", "rehearsal",
];

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function scoreVideo(item: YtItem, artist: string, title: string): number {
  const vt = item.snippet.title.toLowerCase();
  const ch = item.snippet.channelTitle.toLowerCase();
  const a = squash(mainArtist(artist));
  const t = cleanTitle(title).toLowerCase();
  const original = title.toLowerCase();
  const chSquash = squash(ch.replace(/ - topic$/, "").replace(/vevo$/, ""));
  const artistChannel = a.length > 0 && (chSquash === a || chSquash.includes(a) || a.includes(chSquash));

  let s = 0;
  // where it came from: YouTube's "Artist - Topic" audio uploads are the studio recording
  if (ch.endsWith(" - topic") && artistChannel) s += 6;
  else if (artistChannel) s += 4; // the artist's own channel or their VEVO
  else s -= 3; // someone else's upload
  if (ch.endsWith("vevo")) s += 1;
  // what it is
  if (vt.includes(t)) s += 3;
  if (vt.includes("official audio")) s += 2;
  for (const word of OTHER_VERSIONS) {
    if (new RegExp(`\\b${word}\\b`).test(vt) && !original.includes(word)) s -= 6;
  }
  if (vt.includes("music video") || vt.includes("official video")) s -= 0.5; // skits and intros
  return s;
}

async function searchYouTube(track: MusicTrack): Promise<string | null | "budget"> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const today = await db.musicTrack.count({ where: { youtubeSearchedAt: { gte: since } } });
  if (today >= YOUTUBE_DAILY_SEARCHES) return "budget";

  const q = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    videoCategoryId: "10",
    // a search costs the same quota for 1 result or 50, so look at plenty
    maxResults: "15",
    q: `${mainArtist(track.artist)} ${cleanTitle(track.title)}`,
    key,
  });
  const d = await json<{ items?: YtItem[] }>(`https://www.googleapis.com/youtube/v3/search?${q}`, CACHE.art);
  const ranked = (d?.items ?? [])
    .map((it) => ({ id: it.id.videoId, score: scoreVideo(it, track.artist, track.title) }))
    .sort((x, y) => y.score - x.score);
  // needs to be the right song from the right artist; otherwise better to play the preview
  return ranked[0] && ranked[0].score >= 5 ? ranked[0].id : NO_MATCH;
}

// ---------------------------------------------------------------- spotify

let spotifyToken: { value: string; expires: number } | null = null;

async function spotifyAppToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (spotifyToken && spotifyToken.expires > Date.now() + 60_000) return spotifyToken.value;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { access_token: string; expires_in: number };
    spotifyToken = { value: d.access_token, expires: Date.now() + d.expires_in * 1000 };
    return d.access_token;
  } catch {
    return null;
  }
}

async function searchSpotify(track: MusicTrack): Promise<string | null> {
  if (track.provider === "SPOTIFY" && /^[A-Za-z0-9]{22}$/.test(track.providerTrackId)) return track.providerTrackId;
  const token = await spotifyAppToken();
  if (!token) return null;
  const q = track.isrc ? `isrc:${track.isrc}` : `track:${cleanTitle(track.title)} artist:${mainArtist(track.artist)}`;
  const d = await json<{ tracks?: { items?: { id: string }[] } }>(
    `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(q)}`,
    CACHE.art,
    { headers: { authorization: `Bearer ${token}` } }
  );
  return d?.tracks?.items?.[0]?.id ?? NO_MATCH;
}

// ---------------------------------------------------------------- all together

/** Everything the player needs for one track, looking up and saving whatever is missing. */
export async function resolveSources(track: MusicTrack): Promise<TrackSources> {
  const save: Partial<Pick<MusicTrack, "youtubeVideoId" | "youtubeSearchedAt" | "spotifyTrackId" | "albumArtUrl" | "previewUrl">> = {};

  // no match yet, or one made by the older, looser matcher
  const ytStale = !track.youtubeVideoId || !track.youtubeSearchedAt || track.youtubeSearchedAt < MATCHER_SINCE;

  const [ytFound, sp, preview, art] = await Promise.all([
    ytStale ? searchYouTube(track) : Promise.resolve(track.youtubeVideoId),
    track.spotifyTrackId ? Promise.resolve(track.spotifyTrackId) : searchSpotify(track),
    freshPreview(track),
    track.albumArtUrl
      ? Promise.resolve(track.albumArtUrl)
      : track.provider === "SPOTIFY"
        ? spotifyTrackArt(track.providerTrackId)
        : itunesSearch(track.artist, track.title).then((h) => bigArt(h?.artworkUrl100)),
  ]);

  if (ytStale && ytFound && ytFound !== "budget") {
    save.youtubeVideoId = ytFound;
    save.youtubeSearchedAt = new Date();
  }
  // over today's search budget: keep whatever match there was until tomorrow
  const yt = ytFound === "budget" ? track.youtubeVideoId : ytFound;
  if (!track.spotifyTrackId && sp) save.spotifyTrackId = sp;
  if (!track.albumArtUrl && art) save.albumArtUrl = art;
  if (preview.persist && preview.url) save.previewUrl = preview.url;
  if (Object.keys(save).length > 0) {
    await db.musicTrack.update({ where: { id: track.id }, data: save }).catch(() => {});
  }

  const real = (v: string | null | undefined) => (v && v !== NO_MATCH && v !== "budget" ? v : null);
  return {
    youtubeId: real(yt),
    spotifyId: real(sp),
    previewUrl: preview.url,
    albumArtUrl: art ?? null,
  };
}
