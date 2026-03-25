import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getMusicProvider } from "@/lib/music";
import { findOrCreateTrack } from "@/lib/music/search";
import { decrypt, encrypt } from "@/lib/utils/encryption";
import type { MusicProviderType } from "@prisma/client";

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

    // Find the playlist and verify ownership
    const playlist = await db.playlist.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Find the user's active connection for this provider
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

    // Get valid access token (refresh if expired)
    let accessToken = decrypt(connection.accessToken);
    if (connection.expiresAt && connection.expiresAt <= new Date()) {
      if (!connection.refreshToken) {
        return NextResponse.json(
          { error: "Token expired and no refresh token" },
          { status: 400 }
        );
      }
      const provider = getMusicProvider(connection.provider);
      const refreshed = await provider.refreshToken(
        decrypt(connection.refreshToken)
      );
      accessToken = refreshed.accessToken;
      await db.musicConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: encrypt(refreshed.accessToken),
          refreshToken: refreshed.refreshToken
            ? encrypt(refreshed.refreshToken)
            : undefined,
          expiresAt: refreshed.expiresAt,
        },
      });
    }

    // Fetch tracks from provider
    const provider = getMusicProvider(playlist.provider as MusicProviderType);
    const remoteTracks = await provider.getPlaylistTracks(
      accessToken,
      playlist.providerPlaylistId
    );

    // Delete existing and re-insert
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

    // Update playlist metadata
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
  } catch (err) {
    console.error("Playlist sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
