// Guest mode: someone who chose "continue as guest" can browse the site
// (feed, discover, forum, profiles, playlists, music, themes) without an
// account. It's only a cookie that opens the door; anything that writes data
// still needs a real session, which every API route checks on its own.

export const GUEST_COOKIE = "remixd_guest";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Server: did this visitor choose to look around as a guest? */
export async function isGuest(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  return (await cookies()).get(GUEST_COOKIE)?.value === "1";
}

/** Browser: start a guest visit. */
export function startGuestVisit() {
  document.cookie = `${GUEST_COOKIE}=1; path=/; max-age=${THIRTY_DAYS}; samesite=lax`;
}
