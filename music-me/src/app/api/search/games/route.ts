import { NextResponse } from "next/server";

// Uses the free RAWG API (no key needed for basic search, but rate-limited)
// Fallback to GiantBomb-style search via Wikipedia/Wikidata if needed
const RAWG_KEY = process.env.RAWG_API_KEY ?? "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Try RAWG first (free tier: 20k requests/month)
    const url = RAWG_KEY
      ? `https://api.rawg.io/api/games?search=${encodeURIComponent(q)}&page_size=8&key=${RAWG_KEY}`
      : `https://api.rawg.io/api/games?search=${encodeURIComponent(q)}&page_size=8`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json();

    const results = (data.results ?? []).map(
      (game: { name: string; background_image?: string; released?: string; platforms?: { platform: { name: string } }[] }) => ({
        title: game.name,
        coverUrl: game.background_image ?? null,
        year: game.released ? new Date(game.released).getFullYear() : null,
        platforms: (game.platforms ?? []).slice(0, 3).map((p: { platform: { name: string } }) => p.platform.name),
      })
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
