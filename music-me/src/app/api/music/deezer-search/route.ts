import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Server-side proxy for Deezer search API.
 * Deezer's API doesn't support CORS from browsers, so we proxy through our server.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = searchParams.get("limit") ?? "1";

  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const text = await res.text();
      console.error("Deezer API error:", res.status, text);
      return NextResponse.json(
        { error: `Deezer API: ${res.status}`, data: [] },
        { status: 200 } // return 200 with empty data so client doesn't crash
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600" },
    });
  } catch (err) {
    console.error("Deezer search proxy error:", err);
    return NextResponse.json(
      { error: "Deezer proxy failed", data: [] },
      { status: 200 } // graceful fallback
    );
  }
}
