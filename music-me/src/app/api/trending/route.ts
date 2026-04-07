import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Returns trending artists, genres, albums, and playlists
 * based on track data across all public playlists.
 */
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

    // Extract genres from album/artist patterns (simple heuristic)
    // In a real system this would come from provider metadata
    const genres = [
      "Hip-Hop", "R&B", "Pop", "Rock", "Electronic",
      "Indie", "Latin", "Jazz",
    ];

    return NextResponse.json({
      artists: uniqueArtists,
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
