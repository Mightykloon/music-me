import { NextResponse } from "next/server";
import { CACHE, cached, guard } from "@/lib/api-guard";

export const maxDuration = 10;

/**
 * Server-side proxy for Deezer search API.
 * Deezer doesn't support CORS from browsers, so we proxy through our server.
 */
export async function GET(request: Request) {
  // outside API calls: rate limited and cached (see src/lib/api-guard.ts)
  const blocked = await guard(request, "deezer-search", { limit: 60, windowSec: 60 });
  if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  // a player lookup needs a handful of results at most
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 1, 1), 10);

  if (!q) {
    return NextResponse.json({ data: [] });
  }

  try {
    // the same song is looked up by everyone who plays it: cache for a day
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q.slice(0, 200))}&limit=${limit}`,
      cached(CACHE.search, {}, 5000)
    );

    if (!res.ok) {
      return NextResponse.json({ data: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Timeout or network error: return empty results gracefully
    return NextResponse.json({ data: [] });
  }
}
