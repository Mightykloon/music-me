import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSpotifyClientToken } from "@/lib/music/providers/spotify";

// Cache artist images in memory to avoid repeated Spotify lookups
const artistImageCache = new Map<string, string | null>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
let cacheTimestamp = 0;

async function fetchArtistImages(names: string[]): Promise<Record<string, string | null>> {
  const now = Date.now();
  if (now - cacheTimestamp > CACHE_TTL) {
    artistImageCache.clear();
    cacheTimestamp = now;
  }

  const uncached = names.filter((n) => !artistImageCache.has(n.toLowerCase()));
  if (uncached.length > 0) {
    try {
      const token = await getSpotifyClientToken();
      // Fetch in parallel, max 6 at a time
      const batches = [];
      for (let i = 0; i < uncached.length; i += 6) {
        batches.push(uncached.slice(i, i + 6));
      }
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map(async (name) => {
            const res = await fetch(
              `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return { name, imageUrl: null };
            const data = await res.json();
            const artist = data?.artists?.items?.[0];
            // Pick the medium-sized image (usually 320x320) for good quality without being huge
            const images = artist?.images ?? [];
            const image = images.find((img: { width: number }) => img.width >= 160 && img.width <= 640)
              ?? images[0]
              ?? null;
            return { name, imageUrl: image?.url ?? null };
          })
        );
        for (const r of results) {
          if (r.status === "fulfilled") {
            artistImageCache.set(r.value.name.toLowerCase(), r.value.imageUrl);
          }
        }
      }
    } catch {
      // If Spotify lookup fails, proceed without images
    }
  }

  const result: Record<string, string | null> = {};
  for (const name of names) {
    result[name] = artistImageCache.get(name.toLowerCase()) ?? null;
  }
  return result;
}

export async function GET() {
  try {
    // Trending artists: most-appearing artists across all playlist tracks
    const artistRows = await db.$queryRaw<{ artist: string; count: bigint }[]>`
      SELECT mt.artist, COUNT(DISTINCT pt."playlistId") as count
      FROM "PlaylistTrack" pt
      JOIN "MusicTrack" mt ON mt.id = pt."trackId"
      JOIN "Playlist" p ON p.id = pt."playlistId" AND p."isPublic" = true
      GROUP BY mt.artist
      ORDER BY count DESC
      LIMIT 10
    `;

    // Trending albums: most tracks appearing across playlists
    const albumRows = await db.$queryRaw<{ album: string; artist: string; albumArtUrl: string | null; count: bigint }[]>`
      SELECT mt.album, mt.artist, MIN(mt."albumArtUrl") as "albumArtUrl", COUNT(*) as count
      FROM "PlaylistTrack" pt
      JOIN "MusicTrack" mt ON mt.id = pt."trackId"
      JOIN "Playlist" p ON p.id = pt."playlistId" AND p."isPublic" = true
      WHERE mt.album IS NOT NULL AND mt.album != ''
      GROUP BY mt.album, mt.artist
      ORDER BY count DESC
      LIMIT 8
    `;

    // Trending playlists: most tracks + public
    const trendingPlaylists = await db.playlist.findMany({
      where: { isPublic: true },
      orderBy: { trackCount: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        coverImageUrl: true,
        trackCount: true,
        provider: true,
        user: { select: { username: true, displayName: true } },
        _count: { select: { tracks: true } },
      },
    });

    // Extract unique first-artists for trending display
    const trendingArtists = artistRows.map((r) => ({
      name: r.artist.split(",")[0].trim(),
      playlists: Number(r.count),
    }));

    // Deduplicate artists by name
    const seenArtists = new Set<string>();
    const uniqueArtists = trendingArtists.filter((a) => {
      const key = a.name.toLowerCase();
      if (seenArtists.has(key)) return false;
      seenArtists.add(key);
      return true;
    }).slice(0, 8);

    // Fetch artist images from Spotify
    const artistNames = uniqueArtists.map((a) => a.name);
    const artistImages = await fetchArtistImages(artistNames);

    const genres = [
      "Hip-Hop", "R&B", "Pop", "Rock", "Electronic",
      "Indie", "Latin", "Jazz",
    ];

    return NextResponse.json({
      artists: uniqueArtists.map((a) => ({
        ...a,
        imageUrl: artistImages[a.name] ?? null,
      })),
      albums: albumRows.map((r) => ({
        name: r.album,
        artist: r.artist.split(",")[0].trim(),
        artUrl: r.albumArtUrl,
        tracks: Number(r.count),
      })),
      playlists: trendingPlaylists,
      genres,
    });
  } catch (err) {
    console.error("Trending error:", err);
    return NextResponse.json({ artists: [], albums: [], playlists: [], genres: [] });
  }
}
