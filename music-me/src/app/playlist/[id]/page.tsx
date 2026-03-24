import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PlaylistDetail } from "./playlist-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playlist = await db.playlist.findUnique({
    where: { id },
    select: { name: true, description: true, user: { select: { username: true } } },
  });
  if (!playlist) return { title: "Playlist not found" };
  return {
    title: `${playlist.name} by @${playlist.user.username} — remixd`,
    description: playlist.description ?? `Listen to ${playlist.name} on remixd`,
  };
}

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const playlist = await db.playlist.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
      tracks: {
        orderBy: { position: "asc" },
        include: { track: true },
      },
    },
  });

  if (!playlist) notFound();

  if (!playlist.isPublic) {
    const session = await auth();
    if (session?.user?.id !== playlist.userId) notFound();
  }

  const serialized = {
    ...playlist,
    importedAt: playlist.importedAt.toISOString(),
    lastSyncedAt: playlist.lastSyncedAt?.toISOString() ?? null,
    tracks: playlist.tracks.map((pt) => ({
      position: pt.position,
      addedAt: pt.addedAt?.toISOString() ?? null,
      track: {
        id: pt.track.id,
        title: pt.track.title,
        artist: pt.track.artist,
        album: pt.track.album,
        albumArtUrl: pt.track.albumArtUrl,
        previewUrl: pt.track.previewUrl,
        duration: pt.track.duration,
        externalUrl: pt.track.externalUrl,
        provider: pt.track.provider,
      },
    })),
  };

  return <PlaylistDetail playlist={serialized as never} />;
}
