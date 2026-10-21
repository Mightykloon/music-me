import type { MusicProviderType } from "@prisma/client";
import { CACHE, cached } from "@/lib/api-guard";

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

export const MAX_IMPORT_TRACKS = 200;

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

  return {
    provider: "SPOTIFY",
    sourceId: link.id,
    name: entity.name ?? entity.title ?? "Spotify playlist",
    description: entity.subtitle ?? null,
    coverImageUrl: cover,
    url: link.url,
    tracks: (entity.trackList as SpotifyEmbedTrack[]).map((t) => ({
      sourceId: t.uri.split(":").pop() ?? t.uri,
      title: t.title,
      artist: t.subtitle,
      album: link.kind === "album" ? entity.name ?? null : null,
      albumArtUrl: link.kind === "album" ? cover : null,
      previewUrl: t.audioPreview?.url ?? null,
      duration: t.duration ?? null,
      externalUrl: `https://open.spotify.com/track/${t.uri.split(":").pop()}`,
    })),
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

async function readDeezer(link: PlaylistLink): Promise<ImportedPlaylist> {
  const data = await getJson<{
    error?: { message?: string };
    title?: string;
    description?: string;
    picture_medium?: string;
    cover_medium?: string;
    tracks?: { data?: DeezerTrack[] };
  }>(`https://api.deezer.com/${link.kind}/${link.id}?limit=${MAX_IMPORT_TRACKS}`);
  if (data.error) throw new ImportError("Deezer couldn't find that playlist. Is it public?");
  const cover = data.picture_medium ?? data.cover_medium ?? null;
  return {
    provider: "DEEZER",
    sourceId: link.id,
    name: data.title ?? "Deezer playlist",
    description: data.description || null,
    coverImageUrl: cover,
    url: link.url,
    tracks: (data.tracks?.data ?? []).map((t) => ({
      sourceId: String(t.id),
      title: t.title,
      artist: t.artist.name,
      album: t.album?.title ?? (link.kind === "album" ? data.title ?? null : null),
      albumArtUrl: t.album?.cover_medium ?? (link.kind === "album" ? cover : null),
      previewUrl: t.preview || null,
      duration: t.duration ? t.duration * 1000 : null,
      externalUrl: t.link ?? null,
    })),
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

  const items: YouTubeItem[] = [];
  let page = "";
  // 50 per page; stop at the import cap
  for (let i = 0; i < Math.ceil(MAX_IMPORT_TRACKS / 50); i++) {
    const res = await getJson<{ items?: YouTubeItem[]; nextPageToken?: string }>(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${link.id}&key=${key}${page ? `&pageToken=${page}` : ""}`
    );
    items.push(...(res.items ?? []));
    if (!res.nextPageToken) break;
    page = res.nextPageToken;
  }

  return {
    provider: "YOUTUBE_MUSIC",
    sourceId: link.id,
    name: meta.title,
    description: meta.description || null,
    coverImageUrl: meta.thumbnails?.medium?.url ?? null,
    url: link.url,
    tracks: items
      .filter((it) => it.snippet.resourceId?.videoId && it.snippet.title !== "Deleted video" && it.snippet.title !== "Private video")
      .map((it) => {
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
      }),
  };
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
