import { db } from "@/lib/db";

/**
 * Whether `viewerId` (null when signed out or a guest) may see a post:
 * PUBLIC to everyone, FOLLOWERS to the author and people following them,
 * PRIVATE to the author only. Use this everywhere a post (or anything hanging
 * off it: comments, reactions) is read or written.
 */
export async function canViewPost(
  post: { visibility: string; authorId: string },
  viewerId: string | null | undefined
): Promise<boolean> {
  if (post.visibility === "PUBLIC") return true;
  if (!viewerId) return false;
  if (post.authorId === viewerId) return true;
  if (post.visibility !== "FOLLOWERS") return false;
  const follow = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: post.authorId } },
    select: { followerId: true },
  });
  return !!follow;
}
