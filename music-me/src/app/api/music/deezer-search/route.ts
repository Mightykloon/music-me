import { NextResponse } from "next/server";

/**
 * Server-side proxy for Deezer search API.
 * Deezer's API doesn't support CORS from browsers, so we proxy through our server.
 *
 * Query params:
 *   q — search query (e.g. "artist title")
 *   limit — max results (default 1)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = searchParams.get("limit") ?? "1";

  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { next: { revalidate: 3600 } } // cache for 1 hour
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Deezer API: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Deezer search proxy error:", err);
    return NextResponse.json(
      { error: "Deezer search failed" },
      { status: 502 }
    );
  }
}
