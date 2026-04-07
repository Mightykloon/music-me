import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/** GET: list best friends. POST: toggle best friend status. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bestFriends = await db.bestFriend.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
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
