import type { Prisma } from "@prisma/client";
import { steamCover } from "@/lib/steam-cover";

// Books and games added before covers existed, or typed in instead of picked
// from search, have no cover saved. Look the first match up when the profile
// is shown (cached for a day, so this costs one outside call per title).

const DAY = 60 * 60 * 24;
const MAX_LOOKUPS = 16;

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { next: { revalidate: DAY }, signal: AbortSignal.timeout(4000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function bookCover(title: string): Promise<string | null> {
  const data = (await getJson(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5&fields=cover_i`
  )) as { docs?: { cover_i?: number }[] } | null;
  const id = data?.docs?.find((d) => d.cover_i)?.cover_i;
  return id ? `https://covers.openlibrary.org/b/id/${id}-M.jpg` : null;
}

async function gameCover(title: string): Promise<string | null> {
  const data = (await getJson(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`
  )) as { items?: { id: number }[] } | null;
  const id = data?.items?.[0]?.id;
  return id ? steamCover(id) : null;
}

/** favorites with a cover filled in for every book and game we can find one for */
export async function withCovers(favorites: Prisma.JsonValue | null | undefined): Promise<Prisma.JsonValue | null> {
  if (!favorites || typeof favorites !== "object" || Array.isArray(favorites)) return favorites ?? null;
  const fav = favorites as { books?: unknown; games?: unknown; covers?: unknown };
  const covers: Record<string, string> =
    fav.covers && typeof fav.covers === "object" && !Array.isArray(fav.covers) ? { ...(fav.covers as Record<string, string>) } : {};
  const titles = (v: unknown) => (Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : []);

  // saved Steam box art at the fixed path may be a grey placeholder for newer games
  const savedSteam = (t: string) => covers[t]?.match(/^https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/apps\/(\d+)\/library_600x900\.jpg$/)?.[1];
  const missing = [
    ...titles(fav.books).map((t) => [t, bookCover] as const),
    ...titles(fav.games).map((t) => {
      const id = savedSteam(t);
      return [t, id ? () => steamCover(Number(id)) : gameCover] as const;
    }),
  ]
    .filter(([t]) => !covers[t] || savedSteam(t))
    .slice(0, MAX_LOOKUPS);
  if (missing.length === 0) return favorites;

  const found = await Promise.all(missing.map(async ([t, look]) => [t, await look(t)] as const));
  for (const [t, url] of found) if (url) covers[t] = url;
  return { ...fav, covers } as Prisma.JsonValue;
}
