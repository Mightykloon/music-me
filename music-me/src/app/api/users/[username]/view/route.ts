import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";

// One view per visitor per profile every 12 hours, remembered in a cookie,
// so refreshing doesn't pump the counter (and doesn't write to the database).
const WINDOW_SEC = 12 * 60 * 60;

/** POST: count a profile view. Returns the current total either way. */
export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const blocked = await guard(request, "profile-view", { limit: 30, windowSec: 60 });
  if (blocked) return blocked;

  const user = await db.user.findUnique({
    where: { username: (await params).username.toLowerCase() },
    select: { id: true, profile: { select: { profileViews: true } } },
  });
  if (!user?.profile) return NextResponse.json({ views: 0 });

  const session = await auth();
  const jar = await cookies();
  const key = `rv_${user.id}`;
  if (session?.user?.id === user.id || jar.get(key)) {
    return NextResponse.json({ views: user.profile.profileViews });
  }

  const updated = await db.userProfile.update({
    where: { userId: user.id },
    data: { profileViews: { increment: 1 } },
    select: { profileViews: true },
  });
  jar.set(key, "1", { maxAge: WINDOW_SEC, httpOnly: true, sameSite: "lax", path: "/" });
  return NextResponse.json({ views: updated.profileViews });
}
