import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createNotification } from "@/lib/notifications";

/** GET: list best friends. POST: toggle best friend status. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bestFriends = await db.bestFriend.findMany({
    where: { userId: session.user.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    take: 8,
    include: {
      friend: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
    },
  });

  return NextResponse.json(bestFriends.map((bf) => bf.friend));
}

/** PUT { friendIds }: set the Top 8, in order. Everyone in it must be a mutual follow. */
export async function PUT(request: Request) {
  const blocked = await guard(request, "top8", { limit: 20, windowSec: 60, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  const me = session!.user!.id!;

  const parsed = z
    .object({ friendIds: z.array(z.string().min(1).max(40)).max(8) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick up to 8 friends." }, { status: 400 });
  const friendIds = Array.from(new Set(parsed.data.friendIds)).filter((id) => id !== me);

  const [iFollow, followMe] = await Promise.all([
    db.follow.findMany({ where: { followerId: me, followingId: { in: friendIds } }, select: { followingId: true } }),
    db.follow.findMany({ where: { followingId: me, followerId: { in: friendIds } }, select: { followerId: true } }),
  ]);
  const back = new Set(followMe.map((f) => f.followerId));
  const ok = new Set(iFollow.map((f) => f.followingId).filter((id) => back.has(id)));
  if (friendIds.some((id) => !ok.has(id))) {
    return NextResponse.json({ error: "Your Top 8 can only include friends (people who follow you back)." }, { status: 400 });
  }

  const before = await db.bestFriend.findMany({ where: { userId: me }, select: { friendId: true } });
  const had = new Set(before.map((b) => b.friendId));
  await db.$transaction([
    db.bestFriend.deleteMany({ where: { userId: me } }),
    db.bestFriend.createMany({ data: friendIds.map((friendId, position) => ({ userId: me, friendId, position })) }),
  ]);
  for (const id of friendIds) {
    if (!had.has(id)) await createNotification({ userId: id, actorId: me, type: "BEST_FRIEND_ADD" });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendId } = await request.json();
  if (!friendId) return NextResponse.json({ error: "friendId required" }, { status: 400 });

  // Verify mutual follow (must be friends first)
  const [theyFollowMe, iFollowThem] = await Promise.all([
    db.follow.findUnique({
      where: { followerId_followingId: { followerId: friendId, followingId: session.user.id } },
    }),
    db.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: friendId } },
    }),
  ]);

  if (!theyFollowMe || !iFollowThem) {
    return NextResponse.json({ error: "Must be mutual followers (friends) first" }, { status: 400 });
  }

  // Toggle
  const existing = await db.bestFriend.findUnique({
    where: { userId_friendId: { userId: session.user.id, friendId } },
  });

  if (existing) {
    await db.bestFriend.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  await db.bestFriend.create({
    data: { userId: session.user.id, friendId },
  });

  return NextResponse.json({ action: "added" });
}
