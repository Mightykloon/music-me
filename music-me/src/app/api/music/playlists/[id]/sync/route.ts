import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { syncPlaylistTracks } from "@/lib/music/playlist-sync";

export const maxDuration = 60; // Allow up to 60s for large playlists

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const playlist = await db.playlist.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const trackCount = await syncPlaylistTracks(id);

    return NextResponse.json({ success: true, trackCount });
  } catch (err) {
    console.error("Playlist sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
