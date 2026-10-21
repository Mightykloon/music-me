import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { ImportError, linksFor, readPlaylist } from "@/lib/music/link-import";
import { saveImported } from "@/lib/music/playlist-store";

export const maxDuration = 30;

/**
 * POST: re-read one of your playlists from its public page (no Spotify login
 * needed) and replace its songs with the first batch. Like an import, the
 * response's `next` continues through /more for big playlists.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard(request, "playlist-refresh", { limit: 60, windowSec: 60 * 60, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  const userId = session!.user!.id!;

  const { id } = await params;
  const playlist = await db.playlist.findFirst({ where: { id, userId }, select: { provider: true, providerPlaylistId: true } });
  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let lastError = "That playlist couldn't be read. Is it still public?";
  for (const link of linksFor(playlist.provider, playlist.providerPlaylistId)) {
    try {
      const read = await readPlaylist(link);
      const saved = await saveImported(userId, read);
      return NextResponse.json({ ...saved, provider: read.provider, next: read.next });
    } catch (err) {
      if (!(err instanceof ImportError)) {
        console.error("Playlist refresh failed:", err);
        return NextResponse.json({ error: "Re-sync failed. Try again in a bit." }, { status: 500 });
      }
      lastError = err.message; // try the next kind of link (playlist, then album)
    }
  }
  return NextResponse.json({ error: lastError }, { status: 422 });
}
