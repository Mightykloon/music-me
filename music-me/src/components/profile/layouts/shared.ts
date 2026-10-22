import type { ProfileLayoutProps } from "./types";

type Favorites = { books?: string[]; games?: string[]; hobbies?: string[]; interests?: string[]; covers?: Record<string, string> };

export function favoritesOf(user: ProfileLayoutProps["user"]): Favorites | null {
  return (user.profile?.favorites as Favorites) ?? null;
}

/** Whether there's anything to show in "About Me", so layouts don't draw an empty box. */
export function hasFavorites(user: ProfileLayoutProps["user"]): boolean {
  const f = favoritesOf(user);
  return !!f && Object.values(f).some((v) => Array.isArray(v) && v.length > 0);
}

export function vibeItemsOf(user: ProfileLayoutProps["user"]): never[] {
  return ((user.profile?.vibeBoard as never[]) ?? []).filter(Boolean);
}
