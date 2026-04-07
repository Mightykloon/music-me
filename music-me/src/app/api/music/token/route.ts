import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getValidToken } from "@/lib/music/playlist-sync";

/**
 * Returns a fresh Spotify access token for client-side API calls.
 * This allows the browser to call Spotify directly, bypassing
 * Vercel server IP restrictions in Development Mode.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await db.musicConnection.findFirst({
      where: {
        userId: session.user.id,
        provider: "SPOTIFY",
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No active Spotify connection" },
        { status: 404 }
      );
    }

    const accessToken = await getValidToken(connection);

    return NextResponse.json({ accessToken, provider: "SPOTIFY" });
  } catch (err) {
    console.error("Token fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get token" },
      { status: 500 }
    );
  }
}
