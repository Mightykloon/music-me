import { NextResponse } from "next/server";

export const maxDuration = 10;

/**
 * Server-side proxy for Deezer search API.
 * Deezer doesn't support CORS from browsers, so we proxy through our server.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = searchParams.get("limit") ?? "1";

  if (!q) {
    return NextResponse.json({ data: [] });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ data: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Timeout or network error — return empty results gracefully
    return NextResponse.json({ data: [] });
  }
}
