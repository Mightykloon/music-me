import type { MusicProviderType } from "@prisma/client";
import { CACHE, cached } from "@/lib/api-guard";
import { mapLimit, spotifyTrackArt } from "./sources";

// Import a public playlist or album from a link, with no developer app,
// account connection or API approval. Each service is read from something
// it already serves to anyone:
//   Spotify      the public embed page (open.spotify.com/embed/...), which
//                lists every track with a 30s preview
//   Apple Music  the public web page, which embeds its own track data
//   Deezer       Deezer's open API (no key needed)
//   YouTube      the YouTube Data API, only if YOUTUBE_API_KEY is set (a free
//                key with a daily quota, no review)
// Pages are cached for an hour, so re-importing or many people importing the
// same playlist doesn't hit the service again. Songs without a preview get one
// from Deezer when they're first played (see the player), not here, so an
// import is a single request however long the playlist.

/** Songs read in the first request of an import (a source may give fewer). */
export const MAX_IMPORT_TRACKS = 200;
/** Songs per follow-up batch when a big playlist is read in parts (see readMore). */
export const PAGE_SIZE = 100;
/** Most songs kept per playlist, however long the source is. */
export const MAX_PLAYLIST_TRACKS = 5000;

export interface ImportedTrack {
  sourceId: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  /** milliseconds */
  duration: number | null;
  externalUrl: string | null;
}

export interface ImportedPlaylist {
  provider: MusicProviderType;
  sourceId: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  url: string;
  tracks: ImportedTrack[];
  /**
   * Where to pick up for the next batch (pass to readMore), or null when the
   * whole playlist has been read. Opaque: "kind:position-or-page-token".
   */
  next: string | null;
}

export interface PlaylistLink {
  provider: MusicProviderType;
  kind: "playlist" | "album";
  id: string;
  url: string;
}

export class ImportError extends Error {}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

/** Recognise a supported playlist/album link, or null. */
/**
 * Links to try for a playlist saved earlier (only its service and id are
 * stored). Spotify and Deezer ids don't say whether they're a playlist or an
 * album, so both are offered, playlist first.
 */
export function linksFor(provider: MusicProviderType, id: string): PlaylistLink[] {
  const make = (url: string) => parsePlaylistLink(url);
  const urls: string[] =
    provider === "SPOTIFY"
      ? [`https://open.spotify.com/playlist/${id}`, `https://open.spotify.com/album/${id}`]
      : provider === "DEEZER"
        ? [`https://www.deezer.com/playlist/${id}`, `https://www.deezer.com/album/${id}`]
        : provider === "APPLE_MUSIC"
          ? [id.startsWith("pl.") ? `https://music.apple.com/us/playlist/playlist/${id}` : `https://music.apple.com/us/album/album/${id}`]
          : provider === "YOUTUBE_MUSIC"
            ? [`https://www.youtube.com/playlist?list=${id}`]
            : [];
  return urls.map(make).filter((l): l is PlaylistLink => !!l);
}

export function parsePlaylistLink(raw: string): PlaylistLink | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const parts = u.pathname.split("/").filter(Boolean);

  if (host === "open.spotify.com") {
    // /playlist/ID, /album/ID, also /intl-xx/playlist/ID and /embed/playlist/ID
    const i = parts.findIndex((p) => p === "playlist" || p === "album");
    const id = parts[i + 1];
    if (i >= 0 && id && /^[A-Za-z0-9]{10,40}$/.test(id)) {
      return { provider: "SPOTIFY", kind: parts[i] as "playlist" | "album", id, url: `https://open.spotify.com/${parts[i]}/${id}` };
    }
  }

  if (host === "music.apple.com") {
    // /us/playlist/name/pl.xxxx or /us/album/name/12345
    const i = parts.findIndex((p) => p === "playlist" || p === "album");
    const id = parts[parts.length - 1];
    if (i >= 0 && id && /^(pl\.[A-Za-z0-9-]+|\d+)$/.test(id)) {
      return { provider: "APPLE_MUSIC", kind: parts[i] as "playlist" | "album", id, url: `https://music.apple.com/${parts.join("/")}` };
    }
  }

  if (host === "deezer.com" || host.endsWith(".deezer.com")) {
    const i = parts.findIndex((p) => p === "playlist" || p === "album");
    const id = parts[i + 1];
    if (i >= 0 && id && /^\d+$/.test(id)) {
      return { provider: "DEEZER", kind: parts[i] as "playlist" | "album", id, url: `https://www.deezer.com/${parts[i]}/${id}` };
    }
  }

  if (host === "youtube.com" || host === "music.youtube.com" || host === "m.youtube.com") {
    const id = u.searchParams.get("list");
    if (id && /^[A-Za-z0-9_-]{10,64}$/.test(id)) {
      return { provider: "YOUTUBE_MUSIC", kind: "playlist", id, url: `https://www.youtube.com/playlist?list=${id}` };
    }
  }

  return null;
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, cached(CACHE.playlist, { headers: { "user-agent": UA, "accept-language": "en" } }, 10000));
  if (res.status === 404) throw new ImportError("That playlist couldn't be found. Is it public?");
  if (!res.ok) throw new ImportError(`The music service didn't respond (${res.status}). Try again in a bit.`);
  return res.text();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, cached(CACHE.playlist, {}, 10000));
  if (!res.ok) throw new ImportError(`The music service didn't respond (${res.status}). Try again in a bit.`);
  return res.json() as Promise<T>;
}

const meta = (html: string, prop: string) =>
  html.match(new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]*)"`))?.[1] ?? null;

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// ─── Spotify ────────────────────────────────────────────────────────────────

interface SpotifyEmbedTrack {
  uri: string;
  title: string;
  subtitle: string;
  duration?: number;
  audioPreview?: { url?: string } | null;
}

async function readSpotify(link: PlaylistLink): Promise<ImportedPlaylist> {
  const html = await getText(`https://open.spotify.com/embed/${link.kind}/${link.id}`);
  const raw = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  if (!raw) throw new ImportError("Spotify didn't return the playlist. Is it public?");
  const entity = JSON.parse(raw)?.props?.pageProps?.state?.data?.entity;
  if (!entity?.trackList) throw new ImportError("Spotify didn't return the playlist. Is it public?");

  const cover: string | null =
    entity.coverArt?.sources?.[0]?.url ?? entity.visualIdentity?.image?.[0]?.url ?? null;

  const tracks: ImportedTrack[] = (entity.trackList as SpotifyEmbedTrack[]).slice(0, MAX_IMPORT_TRACKS).map((t) => ({
    sourceId: t.uri.split(":").pop() ?? t.uri,
    title: t.title,
    artist: t.subtitle,
    album: link.kind === "album" ? entity.name ?? null : null,
    albumArtUrl: link.kind === "album" ? cover : null,
    previewUrl: t.audioPreview?.url ?? null,
    duration: t.duration ?? null,
    externalUrl: `https://open.spotify.com/track/${t.uri.split(":").pop()}`,
  }));
  // playlist rows carry no cover of their own; each one comes from Spotify's
  // public oEmbed (cached for a month, so re-imports are free)
  if (link.kind !== "album") {
    const arts = await mapLimit(tracks, 8, (t) => spotifyTrackArt(t.sourceId));
    tracks.forEach((t, i) => (t.albumArtUrl = arts[i]));
  }

  return {
    provider: "SPOTIFY",
    sourceId: link.id,
    name: entity.name ?? entity.title ?? "Spotify playlist",
    description: entity.subtitle ?? null,
    coverImageUrl: cover,
    url: link.url,
    tracks,
    // the embed stops at 100 songs; past that needs a Spotify login (readMore)
    next: tracks.length >= 100 ? `${link.kind}:100` : null,
  };
}

// ─── Apple Music ────────────────────────────────────────────────────────────

interface AppleTrackNode {
  title: string;
  artistName: string;
  duration?: number;
  contentDescriptor?: { kind?: string; identifiers?: { storeAdamID?: string }; url?: string };
  artwork?: { dictionary?: { url?: string } };
  tertiaryLinks?: { title?: string }[];
}

async function readApple(link: PlaylistLink): Promise<ImportedPlaylist> {
  const html = await getText(link.url);
  const raw = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!raw) throw new ImportError("Apple Music didn't return the playlist. Is it public?");
  const data = JSON.parse(raw);

  // every song row on the page: has a title, an artist and a duration
  const tracks: AppleTrackNode[] = [];
  const seen = new Set<string>();
  (function walk(node: unknown) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const o = node as AppleTrackNode;
    if (typeof o.title === "string" && typeof o.artistName === "string" && o.duration !== undefined) {
      const id = o.contentDescriptor?.identifiers?.storeAdamID ?? `${o.title}|${o.artistName}`;
      if (!seen.has(id)) {
        seen.add(id);
        tracks.push(o);
      }
    }
    Object.values(node).forEach(walk);
  })(data);
  if (tracks.length === 0) throw new ImportError("Apple Music didn't return any songs for that link.");

  const art = (url?: string) => url?.replace("{w}x{h}bb.{f}", "300x300bb.jpg") ?? null;
  const ogTitle = meta(html, "og:title");

  return {
    provider: "APPLE_MUSIC",
    sourceId: link.id,
    name: ogTitle ? decodeEntities(ogTitle).replace(/ on Apple Music$/, "") : "Apple Music playlist",
    description: meta(html, "og:description") ? decodeEntities(meta(html, "og:description")!) : null,
    coverImageUrl: meta(html, "og:image"),
    url: link.url,
    tracks: tracks.map((t) => ({
      sourceId: t.contentDescriptor?.identifiers?.storeAdamID ?? `${t.title}|${t.artistName}`,
      title: t.title,
      artist: t.artistName,
      album: t.tertiaryLinks?.[0]?.title ?? null,
      albumArtUrl: art(t.artwork?.dictionary?.url),
      previewUrl: null,
      duration: t.duration ?? null,
      externalUrl: t.contentDescriptor?.url ?? null,
    })),
    next: null, // Apple's public page is all there is without an Apple developer key
  };
}

// ─── Deezer ─────────────────────────────────────────────────────────────────

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview?: string;
  link?: string;
  artist: { name: string };
  album?: { title?: string; cover_medium?: string };
}

const mapDeezer = (t: DeezerTrack, kind: PlaylistLink["kind"], albumTitle: string | null, cover: string | null): ImportedTrack => ({
  sourceId: String(t.id),
  title: t.title,
  artist: t.artist.name,
  album: t.album?.title ?? (kind === "album" ? albumTitle : null),
  albumArtUrl: t.album?.cover_medium ?? (kind === "album" ? cover : null),
  previewUrl: t.preview || null,
  duration: t.duration ? t.duration * 1000 : null,
  externalUrl: t.link ?? null,
});

/** One batch of a Deezer playlist or album, starting at `index`. */
async function deezerPage(kind: PlaylistLink["kind"], id: string, index: number, albumTitle: string | null, cover: string | null) {
  const res = await getJson<{ data?: DeezerTrack[]; next?: string; error?: unknown }>(
    `https://api.deezer.com/${kind}/${id}/tracks?index=${index}&limit=${PAGE_SIZE}`
  );
  const tracks = (res.data ?? []).map((t) => mapDeezer(t, kind, albumTitle, cover));
  return { tracks, next: res.next && tracks.length > 0 ? `${kind}:${index + PAGE_SIZE}` : null };
}

async function readDeezer(link: PlaylistLink): Promise<ImportedPlaylist> {
  const data = await getJson<{
    error?: { message?: string };
    title?: string;
    description?: string;
    picture_medium?: string;
    cover_medium?: string;
  }>(`https://api.deezer.com/${link.kind}/${link.id}`);
  if (data.error) throw new ImportError("Deezer couldn't find that playlist. Is it public?");
  const cover = data.picture_medium ?? data.cover_medium ?? null;
  const first = await deezerPage(link.kind, link.id, 0, data.title ?? null, cover);
  return {
    provider: "DEEZER",
    sourceId: link.id,
    name: data.title ?? "Deezer playlist",
    description: data.description || null,
    coverImageUrl: cover,
    url: link.url,
    tracks: first.tracks,
    next: first.next,
  };
}

// ─── YouTube ────────────────────────────────────────────────────────────────

interface YouTubeItem {
  snippet: {
    title: string;
    videoOwnerChannelTitle?: string;
    resourceId?: { videoId?: string };
    thumbnails?: { medium?: { url?: string } };
  };
}

async function readYouTube(link: PlaylistLink): Promise<ImportedPlaylist> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new ImportError("YouTube links aren't switched on yet. Try a Spotify, Apple Music or Deezer link.");

  const info = await getJson<{ items?: { snippet: { title: string; description?: string; thumbnails?: { medium?: { url?: string } } } }[] }>(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${link.id}&key=${key}`
  );
  const meta = info.items?.[0]?.snippet;
  if (!meta) throw new ImportError("YouTube couldn't find that playlist. Is it public or unlisted?");

  const first = await youtubePage(link.id, "");

  return {
    provider: "YOUTUBE_MUSIC",
    sourceId: link.id,
    name: meta.title,
    description: meta.description || null,
    coverImageUrl: meta.thumbnails?.medium?.url ?? null,
    url: link.url,
    tracks: first.tracks,
    next: first.next,
  };
}

const mapYouTube = (it: YouTubeItem): ImportedTrack => {
  // music videos are usually titled "Artist - Song (Official Video)"
  const clean = it.snippet.title.replace(/\s*[([](official|lyric|audio|music|hd|4k)[^)\]]*[)\]]/gi, "").trim();
  const [a, ...rest] = clean.split(" - ");
  const artist = rest.length ? a : (it.snippet.videoOwnerChannelTitle ?? "").replace(/ - Topic$/, "");
  const title = rest.length ? rest.join(" - ") : clean;
  return {
    sourceId: it.snippet.resourceId!.videoId!,
    title,
    artist: artist || "Unknown artist",
    album: null,
    albumArtUrl: it.snippet.thumbnails?.medium?.url ?? null,
    previewUrl: null,
    duration: null,
    externalUrl: `https://www.youtube.com/watch?v=${it.snippet.resourceId!.videoId}`,
  };
};

/** About PAGE_SIZE videos of a YouTube playlist (50 per call), from a page token. */
async function youtubePage(playlistId: string, pageToken: string) {
  const key = process.env.YOUTUBE_API_KEY!;
  const items: YouTubeItem[] = [];
  let page = pageToken;
  for (let i = 0; i < PAGE_SIZE / 50; i++) {
    const res = await getJson<{ items?: YouTubeItem[]; nextPageToken?: string }>(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${key}${page ? `&pageToken=${page}` : ""}`
    );
    items.push(...(res.items ?? []));
    page = res.nextPageToken ?? "";
    if (!page) break;
  }
  const tracks = items
    .filter((it) => it.snippet.resourceId?.videoId && it.snippet.title !== "Deleted video" && it.snippet.title !== "Private video")
    .map(mapYouTube);
  return { tracks, next: page ? `playlist:${page}` : null };
}

interface SpotifyItem {
  track?: SpotifyApiTrack | null;
  item?: SpotifyApiTrack | null;
}
interface SpotifyApiTrack {
  id?: string;
  type?: string;
  name: string;
  duration_ms?: number;
  preview_url?: string | null;
  artists?: { name: string }[];
  album?: { name?: string; images?: { url: string }[] };
}

export interface MoreTracks {
  tracks: ImportedTrack[];
  next: string | null;
  /** Spotify only lists more than 100 songs to a signed-in Spotify account */
  needsSpotifyLogin?: boolean;
}

/**
 * The next batch of a playlist, from the cursor a previous read returned.
 * Spotify needs the owner's Spotify login for this (`spotifyToken`); Deezer
 * and YouTube don't.
 */
export async function readMore(link: PlaylistLink, cursor: string, spotifyToken?: string | null): Promise<MoreTracks> {
  const sep = cursor.indexOf(":");
  const kind = (cursor.slice(0, sep) === "album" ? "album" : "playlist") as PlaylistLink["kind"];
  const at = cursor.slice(sep + 1);

  if (link.provider === "DEEZER") return deezerPage(kind, link.id, Number(at) || 0, null, null);
  if (link.provider === "YOUTUBE_MUSIC") return at ? youtubePage(link.id, at) : { tracks: [], next: null };
  if (link.provider !== "SPOTIFY") return { tracks: [], next: null };

  if (!spotifyToken) return { tracks: [], next: null, needsSpotifyLogin: true };
  const offset = Number(at) || 0;
  const tracks: ImportedTrack[] = [];
  let more = true;
  for (let o = offset; o < offset + PAGE_SIZE && more; o += 50) {
    const res = await fetch(
      `https://api.spotify.com/v1/${kind === "album" ? "albums" : "playlists"}/${link.id}/${kind === "album" ? "tracks" : "items"}?offset=${o}&limit=50&market=US`,
      { headers: { authorization: `Bearer ${spotifyToken}` }, signal: AbortSignal.timeout(10000) }
    );
    if (res.status === 401 || res.status === 403) return { tracks, next: null, needsSpotifyLogin: true };
    if (!res.ok) throw new ImportError(`Spotify didn't respond (${res.status}). Try again in a bit.`);
    const data = (await res.json()) as { items?: (SpotifyItem & SpotifyApiTrack)[]; next?: string | null };
    for (const it of data.items ?? []) {
      const t = (kind === "album" ? it : it.track ?? it.item) as SpotifyApiTrack | null | undefined;
      if (!t?.id || (t.type && t.type !== "track")) continue;
      tracks.push({
        sourceId: t.id,
        title: t.name,
        artist: (t.artists ?? []).map((a) => a.name).join(", "),
        album: t.album?.name ?? null,
        albumArtUrl: t.album?.images?.[0]?.url ?? null,
        previewUrl: t.preview_url ?? null,
        duration: t.duration_ms ?? null,
        externalUrl: `https://open.spotify.com/track/${t.id}`,
      });
    }
    more = !!data.next;
  }
  return { tracks, next: more ? `${kind}:${offset + PAGE_SIZE}` : null };
}

/** Read a playlist from a supported link. Throws ImportError with a message fit for the user. */
export async function readPlaylist(link: PlaylistLink): Promise<ImportedPlaylist> {
  const reader = { SPOTIFY: readSpotify, APPLE_MUSIC: readApple, DEEZER: readDeezer, YOUTUBE_MUSIC: readYouTube }[
    link.provider as "SPOTIFY" | "APPLE_MUSIC" | "DEEZER" | "YOUTUBE_MUSIC"
  ];
  if (!reader) throw new ImportError("That service isn't supported yet.");
  const playlist = await reader(link);
  if (playlist.tracks.length === 0) throw new ImportError("That playlist is empty.");
  playlist.tracks = playlist.tracks.slice(0, MAX_IMPORT_TRACKS);
  return playlist;
}
