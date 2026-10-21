import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { ImportError, parsePlaylistLink, readPlaylist } from "@/lib/music/link-import";

export const maxDuration = 30;

const body = z.object({ url: z.string().url().max(500) });

// Import (or refresh) a public playlist or album from a Spotify, Apple Music,
// Deezer or YouTube link. No account connection needed; see link-import.ts.
export async function POST(request: Request) {
  const blocked = await guard(request, "playlist-import", { limit: 10, windowSec: 60 * 60, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  const userId = session!.user!.id!;

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Paste a playlist link." }, { status: 400 });

  const link = parsePlaylistLink(parsed.data.url);
  if (!link) {
    return NextResponse.json(
      { error: "That isn't a playlist or album link from Spotify, Apple Music, Deezer or YouTube." },
      { status: 400 }
    );
  }

  try {
    const playlist = await readPlaylist(link);

    // songs: one bulk insert for new ones, then look all of them up for ids
    await db.musicTrack.createMany({
      data: playlist.tracks.map((t) => ({
        provider: playlist.provider,
        providerTrackId: t.sourceId,
        title: t.title.slice(0, 300),
        artist: t.artist.slice(0, 300),
        album: t.album?.slice(0, 300) ?? null,
        albumArtUrl: t.albumArtUrl,
        previewUrl: t.previewUrl,
        duration: t.duration,
        externalUrl: t.externalUrl,
      })),
      skipDuplicates: true,
    });
    const rows = await db.musicTrack.findMany({
      where: { provider: playlist.provider, providerTrackId: { in: playlist.tracks.map((t) => t.sourceId) } },
      select: { id: true, providerTrackId: true },
    });
    const idFor = new Map(rows.map((r) => [r.providerTrackId, r.id]));

    // a song can appear twice in a source playlist; keep its first position
    const ordered: string[] = [];
    for (const t of playlist.tracks) {
      const id = idFor.get(t.sourceId);
      if (id && !ordered.includes(id)) ordered.push(id);
    }

    const saved = await db.$transaction(async (tx) => {
      const p = await tx.playlist.upsert({
        where: { userId_provider_providerPlaylistId: { userId, provider: playlist.provider, providerPlaylistId: playlist.sourceId } },
        create: {
          userId,
          provider: playlist.provider,
          providerPlaylistId: playlist.sourceId,
          name: playlist.name.slice(0, 200),
          description: playlist.description,
          coverImageUrl: playlist.coverImageUrl,
          trackCount: ordered.length,
        },
        update: {
          name: playlist.name.slice(0, 200),
          description: playlist.description,
          coverImageUrl: playlist.coverImageUrl,
          trackCount: ordered.length,
          lastSyncedAt: new Date(),
        },
      });
      await tx.playlistTrack.deleteMany({ where: { playlistId: p.id } });
      await tx.playlistTrack.createMany({
        data: ordered.map((trackId, position) => ({ playlistId: p.id, trackId, position })),
      });
      return p;
    });

    return NextResponse.json({ id: saved.id, name: saved.name, trackCount: ordered.length, provider: playlist.provider });
  } catch (err) {
    if (err instanceof ImportError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("Playlist import failed:", err);
    return NextResponse.json({ error: "Import failed. Try again in a bit." }, { status: 500 });
  }
}
