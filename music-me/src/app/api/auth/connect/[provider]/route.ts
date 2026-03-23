import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { getSpotifyConnectUrl } from "@/lib/music/providers/spotify";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  const { provider } = await params;
  const state = nanoid();
  const redirectUri = `${APP_URL}/api/auth/connect/${provider}/callback`;

  let authUrl: string;

  switch (provider.toLowerCase()) {
    case "spotify":
      authUrl = getSpotifyConnectUrl(redirectUri, state);
      break;

    case "youtube":
    case "youtube_music": {
      const ytParams = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/youtube.readonly",
        access_type: "offline",
        prompt: "consent",
        state,
      });
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${ytParams}`;
      break;
    }

    case "deezer": {
      const dzParams = new URLSearchParams({
        app_id: process.env.DEEZER_APP_ID ?? "",
        redirect_uri: redirectUri,
        perms: "basic_access,email,offline_access,manage_library,listening_history",
      });
      authUrl = `https://connect.deezer.com/oauth/auth.php?${dzParams}`;
      break;
    }

    case "soundcloud": {
      const scParams = new URLSearchParams({
        client_id: process.env.SOUNDCLOUD_CLIENT_ID ?? "",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "non-expiring",
        state,
      });
      authUrl = `https://soundcloud.com/connect?${scParams}`;
      break;
    }

    default:
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
  }

  // Store state in a cookie for CSRF protection
  const response = NextResponse.redirect(authUrl);
  response.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    sameSite: "lax",
  });

  return response;
}
