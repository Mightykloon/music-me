import { auth } from "@/lib/auth";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// Precautions for routes that call outside services (Deezer, iTunes, lyrics,
// Spotify/Apple pages, book and game APIs). Those calls can be slow, can be
// rate limited by the other side, and could cost money if a provider ever
// starts charging, so every such route:
//   1. is rate limited per signed-in user (or per IP when signed out), and
//   2. caches what it fetches (see `cached` below), so repeat requests for
//      the same thing never leave our servers.

export interface GuardOptions {
  /** requests allowed per window */
  limit: number;
  /** window length in seconds */
  windowSec: number;
  /** reject signed-out visitors outright */
  requireAuth?: boolean;
}

/**
 * Returns a ready-made error Response when the request should be refused
 * (signed out on a members-only route, or over its rate limit), else null.
 *
 *   const blocked = await guard(request, "lyrics", { limit: 30, windowSec: 60 });
 *   if (blocked) return blocked;
 */
export async function guard(request: Request, name: string, opts: GuardOptions): Promise<Response | null> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (opts.requireAuth && !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const who = userId ? `u:${userId}` : `ip:${getClientIp(request)}`;
  const rl = rateLimit(`${who}:${name}`, { limit: opts.limit, windowSec: opts.windowSec });
  return rl.success ? null : rateLimitResponse(rl.retryAfterSec);
}

/** Cache lifetimes for outside data, in seconds. */
export const CACHE = {
  /** search results and song lookups barely change */
  search: 60 * 60 * 24,
  /** lyrics never change */
  lyrics: 60 * 60 * 24 * 7,
  /** a public playlist page: refreshed hourly at most */
  playlist: 60 * 60,
  /** album art and song-to-video matches don't change */
  art: 60 * 60 * 24 * 30,
  /** Deezer's preview links are signed and expire, so only briefly */
  preview: 60 * 30,
} as const;

/**
 * fetch() options that store the response in Next's data cache (shared by
 * every server instance on Vercel) for `seconds`, with a timeout so a slow
 * provider can't hold a request open.
 */
export function cached(seconds: number, init: RequestInit = {}, timeoutMs = 8000): RequestInit {
  return {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
    next: { revalidate: seconds },
  } as RequestInit;
}
