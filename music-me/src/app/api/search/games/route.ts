import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Try RAWG if API key is set
  const rawgKey = process.env.RAWG_API_KEY;
  if (rawgKey) {
    try {
      const res = await fetch(
        `https://api.rawg.io/api/games?search=${encodeURIComponent(q)}&page_size=8&key=${rawgKey}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
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
      }
    } catch { /* fall through to Wikipedia */ }
  }

  // Fallback: Wikipedia API search (always free, no key, has images)
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q + " video game")}&srnamespace=0&srlimit=8&format=json&origin=*`,
      { next: { revalidate: 3600 } }
    );
    if (!wikiRes.ok) return NextResponse.json({ results: [] });
    const wikiData = await wikiRes.json();
    const pages = wikiData.query?.search ?? [];

    // Fetch thumbnails for each result
    const pageIds = pages.map((p: { pageid: number }) => p.pageid).join("|");
    if (!pageIds) return NextResponse.json({ results: [] });

    const thumbRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=pageimages|description&piprop=thumbnail&pithumbsize=200&format=json&origin=*`,
      { next: { revalidate: 3600 } }
    );
    const thumbData = await thumbRes.json();
    const pageInfo = thumbData.query?.pages ?? {};

    const results = pages.map((p: { pageid: number; title: string; snippet: string }) => {
      const info = pageInfo[String(p.pageid)];
      // Extract year from snippet if present
      const yearMatch = p.snippet.match(/\b(19|20)\d{2}\b/);
      return {
        title: p.title.replace(/ \(video game\)/i, "").replace(/ \(\d{4}.*?\)/i, ""),
        coverUrl: info?.thumbnail?.source ?? null,
        year: yearMatch ? parseInt(yearMatch[0]) : null,
        platforms: [] as string[],
      };
    }).filter((r: { title: string; coverUrl: string | null }) => r.coverUrl !== null);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
