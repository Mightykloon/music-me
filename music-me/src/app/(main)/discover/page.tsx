import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DiscoverClient } from "./discover-client";

export const metadata = {
  title: "Discover — music.me",
};

export default async function DiscoverPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Trending posts (most reactions in last 7 days)
  const trendingPosts = await db.post.findMany({
    where: {
      visibility: "PUBLIC",
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    take: 10,
    orderBy: { reactions: { _count: "desc" } },
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
      _count: { select: { comments: true, reactions: true, reposts: true } },
    },
  });

  // Suggested users (most followers, excluding self)
  const suggestedUsers = await db.user.findMany({
    where: {
      ...(userId ? { id: { not: userId } } : {}),
    },
    take: 6,
    orderBy: { followers: { _count: "desc" } },
    select: {
      id: true,
      username: true,
      displayName: true,
      isVerified: true,
      bio: true,
      profile: { select: { profilePictureUrl: true } },
      _count: { select: { followers: true, posts: true } },
    },
  });

  // Serialize dates
  const serializedPosts = trendingPosts.map((p: (typeof trendingPosts)[number]) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    editedAt: p.editedAt?.toISOString() ?? null,
    poll: p.poll
      ? {
          ...p.poll,
          expiresAt: p.poll.expiresAt.toISOString(),
          createdAt: p.poll.createdAt.toISOString(),
        }
      : null,
  }));

  return (
    <DiscoverClient
      trendingPosts={serializedPosts as never}
      suggestedUsers={suggestedUsers}
    />
  );
}
