import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSpotifyClientToken } from "@/lib/music/providers/spotify";
import { getValidAccessToken } from "@/lib/music/playlist-sync";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // Test 1: Client credentials token
  try {
    const clientToken = await getSpotifyClientToken();
    results.clientToken = "OK (got token)";

    // Test 1a: Simple playlist metadata (no tracks)
    try {
      const r = await fetch("https://api.spotify.com/v1/playlists/75Hvk0vv3Q0pQnuwBFu7oG?fields=id,name,tracks.total", {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      results.clientPlaylistMeta = `${r.status} ${r.ok ? (await r.json()).name : await r.text()}`;
    } catch (e) { results.clientPlaylistMeta = `Error: ${e}`; }

    // Test 1b: Tracks with client token (minimal)
    try {
      const r = await fetch("https://api.spotify.com/v1/playlists/75Hvk0vv3Q0pQnuwBFu7oG/tracks?limit=2&fields=total,items(track(id,name))", {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      results.clientTracks = `${r.status} ${await r.text()}`;
    } catch (e) { results.clientTracks = `Error: ${e}`; }

    // Test 1c: Tracks with additional_types
    try {
      const r = await fetch("https://api.spotify.com/v1/playlists/75Hvk0vv3Q0pQnuwBFu7oG/tracks?limit=2&additional_types=track&market=US", {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      results.clientTracksAdditional = `${r.status}`;
    } catch (e) { results.clientTracksAdditional = `Error: ${e}`; }

  } catch (e) { results.clientToken = `FAILED: ${e}`; }

  // Test 2: User token
  const connection = await db.musicConnection.findFirst({
    where: { userId: session.user.id, provider: "SPOTIFY", isActive: true },
  });

  if (connection) {
    try {
      const userToken = await getValidAccessToken(connection, true);
      results.userToken = "OK (refreshed)";

      // Test 2a: Tracks with user token
      try {
        const r = await fetch("https://api.spotify.com/v1/playlists/75Hvk0vv3Q0pQnuwBFu7oG/tracks?limit=2", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        results.userTracks = `${r.status} ${r.ok ? "OK" : await r.text()}`;
      } catch (e) { results.userTracks = `Error: ${e}`; }

      // Test 2b: Tracks with user token + additional_types
      try {
        const r = await fetch("https://api.spotify.com/v1/playlists/75Hvk0vv3Q0pQnuwBFu7oG/tracks?limit=2&additional_types=track&market=US", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        results.userTracksAdditional = `${r.status} ${r.ok ? "OK" : await r.text()}`;
      } catch (e) { results.userTracksAdditional = `Error: ${e}`; }

    } catch (e) { results.userToken = `FAILED: ${e}`; }
  } else {
    results.userToken = "No connection found";
  }

  results.envCheck = {
    hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
    hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    clientIdPrefix: process.env.SPOTIFY_CLIENT_ID?.substring(0, 6) ?? "missing",
  };

  return NextResponse.json(results);
}
