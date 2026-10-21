import type { MusicProviderType } from "@prisma/client";
import { db } from "@/lib/db";
import type { ImportedPlaylist, ImportedTrack } from "./link-import";

// Saving playlists read from a public link (see link-import.ts): the first
// batch replaces whatever the playlist had, later batches are appended.

/** Save new songs in one bulk insert and return every song's id, in order, without repeats. */
async function trackIds(provider: MusicProviderType, tracks: ImportedTrack[]): Promise<string[]> {
  if (tracks.length === 0) return [];
  await db.musicTrack.createMany({
    data: tracks.map((t) => ({
      provider,
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
    where: { provider, providerTrackId: { in: tracks.map((t) => t.sourceId) } },
    select: { id: true, providerTrackId: true, albumArtUrl: true },
  });
  const idFor = new Map(rows.map((r) => [r.providerTrackId, r.id]));

  // songs saved before covers were fetched get theirs now
  const artFor = new Map(tracks.map((t) => [t.sourceId, t.albumArtUrl]));
  const missingArt = rows.filter((r) => !r.albumArtUrl && artFor.get(r.providerTrackId));
  if (missingArt.length > 0) {
    await db.$transaction(
      missingArt.map((r) => db.musicTrack.update({ where: { id: r.id }, data: { albumArtUrl: artFor.get(r.providerTrackId) } }))
    );
  }

  const ordered: string[] = [];
  for (const t of tracks) {
    const id = idFor.get(t.sourceId);
    if (id && !ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}

/** Save (or refresh) a playlist from its first batch, replacing its songs. */
export async function saveImported(userId: string, playlist: ImportedPlaylist) {
  const ordered = await trackIds(playlist.provider, playlist.tracks);
  return db.$transaction(async (tx) => {
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
    return { id: p.id, name: p.name, trackCount: ordered.length };
  });
}

/** Add a later batch to the end of a playlist. Returns the playlist's new song count. */
export async function appendTracks(playlistId: string, provider: MusicProviderType, tracks: ImportedTrack[]): Promise<number> {
  const ordered = await trackIds(provider, tracks);
  const start = await db.playlistTrack.count({ where: { playlistId } });
  await db.playlistTrack.createMany({
    data: ordered.map((trackId, i) => ({ playlistId, trackId, position: start + i })),
    skipDuplicates: true, // a song already in the playlist stays where it is
  });
  const count = await db.playlistTrack.count({ where: { playlistId } });
  await db.playlist.update({ where: { id: playlistId }, data: { trackCount: count, lastSyncedAt: new Date() } });
  return count;
}
