import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SpotifyProvider, getSpotifyClientToken } from "@/lib/music/providers/spotify";
import { findOrCreateTrack } from "@/lib/music/search";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const playlist = await db.playlist.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    // Use Spotify Client Credentials — no user token needed for public playlists
    if (playlist.provider === "SPOTIFY") {
      const token = await getSpotifyClientToken();
      const spotify = new SpotifyProvider();

      const remoteTracks = await spotify.getPlaylistTracks(
        token,
        playlist.providerPlaylistId
      );

      // Clear old tracks and insert fresh ones
      await db.playlistTrack.deleteMany({
        where: { playlistId: playlist.id },
      });

      for (const rt of remoteTracks) {
        const track = await findOrCreateTrack(rt.track);
        await db.playlistTrack.create({
          data: {
            playlistId: playlist.id,
            trackId: track.id,
            position: rt.position,
            addedAt: rt.addedAt,
          },
        });
      }

      // Update track count
      await db.playlist.update({
        where: { id: playlist.id },
        data: {
          trackCount: remoteTracks.length,
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        trackCount: remoteTracks.length,
      });
    }

    // For non-Spotify providers, fall back to connection-based sync
    const { syncPlaylists } = await import("@/lib/music/playlist-sync");
    const connection = await db.musicConnection.findFirst({
      where: {
        userId: session.user.id,
        provider: playlist.provider,
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No active connection for this provider" },
        { status: 400 }
      );
    }

    await syncPlaylists(connection.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Playlist sync error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
