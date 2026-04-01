import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { findOrCreateTrack } from "@/lib/music/search";
import type { MusicTrackResult } from "@/lib/music/types";

export const maxDuration = 60;

interface IngestTrack {
  track: MusicTrackResult;
  position: number;
  addedAt: string;
}

/**
 * Accepts track data fetched client-side from Spotify and stores it in the DB.
 * This bypasses Spotify's server-side IP restrictions by letting the browser
 * fetch directly from Spotify, then sending results here for storage.
 *
 * Body: { tracks: IngestTrack[], total: number, hasMore: boolean }
 */
export async function POST(
  request: Request,
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

    const body = await request.json();
    const { tracks, total } = body as {
      tracks: IngestTrack[];
      total: number;
    };

    if (!Array.isArray(tracks)) {
      return NextResponse.json({ error: "Invalid tracks data" }, { status: 400 });
    }

    let synced = 0;
    for (const rt of tracks) {
      try {
        const track = await findOrCreateTrack(rt.track);
        await db.playlistTrack.upsert({
          where: {
            playlistId_trackId: {
              playlistId: playlist.id,
              trackId: track.id,
            },
          },
          update: { position: rt.position, addedAt: new Date(rt.addedAt) },
          create: {
            playlistId: playlist.id,
            trackId: track.id,
            position: rt.position,
            addedAt: new Date(rt.addedAt),
          },
        });
        synced++;
      } catch (err) {
        console.error(`Failed to ingest track at position ${rt.position}:`, err);
      }
    }

    // Update playlist metadata
    await db.playlist.update({
      where: { id: playlist.id },
      data: {
        trackCount: total,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ synced, total });
  } catch (err) {
    console.error("Track ingest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ingest failed" },
      { status: 500 }
    );
  }
}
