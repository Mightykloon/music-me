import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMusicProvider, type ProviderName } from "@/lib/music";
import { encrypt } from "@/lib/utils/encryption";
import { importPlaylistsOnConnect } from "@/lib/music/playlist-sync";
import type { MusicProviderType } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const PROVIDER_MAP: Record<string, MusicProviderType> = {
  spotify: "SPOTIFY",
  apple_music: "APPLE_MUSIC",
  soundcloud: "SOUNDCLOUD",
  youtube: "YOUTUBE_MUSIC",
  youtube_music: "YOUTUBE_MUSIC",
  lastfm: "LASTFM",
  deezer: "DEEZER",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", APP_URL));
    }

    const { provider } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/connections?error=${error}`, APP_URL)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings/connections?error=no_code", APP_URL)
      );
    }

    const providerType = PROVIDER_MAP[provider.toLowerCase()];
    if (!providerType) {
      return NextResponse.redirect(
        new URL("/settings/connections?error=unknown_provider", APP_URL)
      );
    }

    const musicProvider = getMusicProvider(providerType as ProviderName);
    const redirectUri = `${APP_URL}/api/auth/connect/${provider}/callback`;

    // Exchange code for tokens
    const result = await musicProvider.connect(code, redirectUri);

    // Check if this is the first connection
    const existingConnections = await db.musicConnection.count({
      where: { userId: session.user.id, isActive: true },
    });

    // Upsert the connection with encrypted tokens
    await db.musicConnection.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: providerType,
        },
      },
      update: {
        accessToken: encrypt(result.accessToken),
        refreshToken: result.refreshToken
          ? encrypt(result.refreshToken)
          : null,
        expiresAt: result.expiresAt,
        providerUserId: result.providerUserId,
        providerUsername: result.providerUsername,
        scopes: result.scopes,
        isActive: true,
        isPrimary: existingConnections === 0,
        connectedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        provider: providerType,
        accessToken: encrypt(result.accessToken),
        refreshToken: result.refreshToken
          ? encrypt(result.refreshToken)
          : null,
        expiresAt: result.expiresAt,
        providerUserId: result.providerUserId,
        providerUsername: result.providerUsername,
        scopes: result.scopes,
        isPrimary: existingConnections === 0,
      },
    });

    // Import playlists in background (fire and forget)
    importPlaylistsOnConnect(
      session.user.id,
      providerType,
      result.accessToken
    ).catch(() => {
      // Silently fail - playlists will sync later
    });

    return NextResponse.redirect(
      new URL("/settings/connections?success=true", APP_URL)
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/settings/connections?error=connection_failed", APP_URL)
    );
  }
}
