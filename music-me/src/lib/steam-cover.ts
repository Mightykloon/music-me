// Cover art for a Steam app. Older games have tall box art at a fixed path;
// newer ones keep their art at hashed URLs, and the fixed path then serves a
// small grey placeholder (a 200, not an error), so check its size and use
// the store's own header image instead.

const DAY = 60 * 60 * 24;
const PLACEHOLDER_MAX_BYTES = 8000;

export async function steamCover(appId: number): Promise<string> {
  const tall = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
  try {
    const head = await fetch(tall, { method: "HEAD", next: { revalidate: DAY }, signal: AbortSignal.timeout(3000) });
    const size = Number(head.headers.get("content-length") ?? 0);
    if (head.ok && size > PLACEHOLDER_MAX_BYTES) return tall;

    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`, {
      next: { revalidate: DAY },
      signal: AbortSignal.timeout(3000),
    });
    const data = res.ok ? await res.json() : null;
    const header: unknown = data?.[appId]?.data?.header_image;
    if (typeof header === "string" && header.startsWith("https://")) return header;
  } catch {
    // fall through to the fixed path; the profile swaps a failed tall cover for the header
  }
  return tall;
}
