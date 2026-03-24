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
    } catch { /* fall through */ }
  }

  // Fallback: Steam store search (free, no key, has cover art)
  try {
    const steamRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`,
      { next: { revalidate: 3600 } }
    );
    if (!steamRes.ok) return NextResponse.json({ results: [] });
    const steamData = await steamRes.json();

    const results = (steamData.items ?? []).slice(0, 8).map(
      (item: { name: string; id: number; tiny_image?: string; metascore?: string }) => ({
        title: item.name,
        coverUrl: item.tiny_image
          ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`
          : null,
        year: null,
        platforms: [] as string[],
      })
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
