import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      isVerified: true,
      profile: { select: { profilePictureUrl: true } },
    },
  },
  attachedTrack: true,
  attachedPlaylist: {
    select: {
      id: true,
      name: true,
      coverImageUrl: true,
      trackCount: true,
      provider: true,
    },
  },
  poll: {
    include: {
      options: {
        include: {
          attachedTrack: true,
          _count: { select: { votes: true } },
        },
      },
      _count: { select: { options: true } },
    },
  },
  repostOf: {
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          isVerified: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
      attachedTrack: true,
      attachedPlaylist: {
        select: {
          id: true,
          name: true,
          coverImageUrl: true,
          trackCount: true,
          provider: true,
        },
      },
      _count: { select: { comments: true, reactions: { where: { type: "HEART" } }, reposts: true } },
    },
  },
  _count: { select: { comments: true, reactions: { where: { type: "HEART" } }, reposts: true } },
} as const;

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") ?? "foryou";
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    let posts;

    if (source === "following" && userId) {
      // Following feed: posts from people the user follows
      const following = await db.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);

      posts = await db.post.findMany({
        where: {
          authorId: { in: [...followingIds, userId] },
          visibility: "PUBLIC",
          scheduledFor: null,
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: POST_INCLUDE,
      });
    } else if (source === "discover") {
      // Discover: trending / high-engagement posts from anyone
      posts = await db.post.findMany({
        where: {
          visibility: "PUBLIC",
          scheduledFor: null,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [
          { reactions: { _count: "desc" } },
          { createdAt: "desc" },
        ],
        include: POST_INCLUDE,
      });
    } else {
      // For You: mix of following + popular
      const followingIds: string[] = [];
      if (userId) {
        const following = await db.follow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });
        followingIds.push(...following.map((f) => f.followingId));
      }

      posts = await db.post.findMany({
        where: {
          visibility: "PUBLIC",
          scheduledFor: null,
          ...(followingIds.length > 0
            ? {}
            : {}),
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: POST_INCLUDE,
      });
    }

    // Attach user reactions if logged in
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    let enrichedItems = items;
    if (userId) {
      const postIds = items.map((p) => p.id);
      const userReactions = await db.reaction.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true, type: true },
      });

      const reactionMap = new Map<string, string[]>();
      for (const r of userReactions) {
        if (!r.postId) continue;
        const arr = reactionMap.get(r.postId) ?? [];
        arr.push(r.type);
        reactionMap.set(r.postId, arr);
      }

      enrichedItems = items.map((p) => ({
        ...p,
        userReactions: reactionMap.get(p.id) ?? [],
      }));
    }

    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({ items: enrichedItems, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
