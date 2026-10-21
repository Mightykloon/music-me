import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { httpUrl } from "@/lib/auth/validation";
import { ImportError, parsePlaylistLink, readPlaylist } from "@/lib/music/link-import";
import { saveImported } from "@/lib/music/playlist-store";

export const maxDuration = 30;

const body = z.object({ url: httpUrl.max(500) });

// Import (or refresh) a public playlist or album from a Spotify, Apple Music,
// Deezer or YouTube link. No account connection needed; see link-import.ts.
// Big playlists come in batches: the response's `next` is passed to
// /api/music/playlists/[id]/more until it comes back null.
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
    const saved = await saveImported(userId, playlist);
    return NextResponse.json({ ...saved, provider: playlist.provider, next: playlist.next });
  } catch (err) {
    if (err instanceof ImportError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("Playlist import failed:", err);
    return NextResponse.json({ error: "Import failed. Try again in a bit." }, { status: 500 });
  }
}
