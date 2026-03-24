import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyMusicClient } from "./my-music-client";

export const metadata = { title: "Library — remixd" };

export default async function MyMusicPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [playlists, connections, syncGroups] = await Promise.all([
    db.playlist.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isPinned: "desc" }, { name: "asc" }],
      include: { _count: { select: { tracks: true } } },
    }),
    db.musicConnection.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { id: true, provider: true, providerUsername: true },
    }),
    db.playlistSyncGroup.findMany({
      where: { userId: session.user.id },
      include: {
        playlists: {
          include: { _count: { select: { tracks: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedPlaylists = playlists.map((p: (typeof playlists)[number]) => ({
    ...p,
    importedAt: p.importedAt.toISOString(),
    lastSyncedAt: p.lastSyncedAt.toISOString(),
  }));

  const serializedGroups = syncGroups.map((g: (typeof syncGroups)[number]) => ({
    ...g,
    lastSyncedAt: g.lastSyncedAt.toISOString(),
    createdAt: g.createdAt.toISOString(),
    playlists: g.playlists.map((p: (typeof g.playlists)[number]) => ({
      ...p,
      importedAt: p.importedAt.toISOString(),
      lastSyncedAt: p.lastSyncedAt.toISOString(),
    })),
  }));

  return (
    <MyMusicClient
      playlists={serializedPlaylists}
      connections={connections}
      syncGroups={serializedGroups}
    />
  );
}
