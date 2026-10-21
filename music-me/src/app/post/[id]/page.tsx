import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canViewPost } from "@/lib/posts/visibility";
import { auth } from "@/lib/auth";
import { PostDetailClient } from "./post-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { username: true, displayName: true } },
    },
  });

  // titles and link previews are public, so only public posts get their text in them
  if (!post || post.visibility !== "PUBLIC") return { title: "Post not found" };

  const name = post.author.displayName ?? post.author.username;
  const snippet = post.content?.slice(0, 100) ?? "Post";

  return {
    title: `${name}: "${snippet}"`,
    description: post.content?.slice(0, 200) ?? `Post by ${name} on remixd`,
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const post = await db.post.findUnique({
    where: { id },
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
          _count: {
            select: { comments: true, reactions: { where: { type: "HEART" } }, reposts: true },
          },
        },
      },
      _count: {
        select: { comments: true, reactions: { where: { type: "HEART" } }, reposts: true },
      },
    },
  });

  if (!post) notFound();

  if (!(await canViewPost(post, userId))) notFound();

  // Get user reactions
  let userReactions: string[] = [];
  if (userId) {
    const reactions = await db.reaction.findMany({
      where: { userId, postId: id },
      select: { type: true },
    });
    userReactions = reactions.map((r) => r.type);
  }

  // Get top-level comments
  const comments = await db.comment.findMany({
    where: { postId: id, parentId: null },
    take: 20,
    orderBy: { createdAt: "asc" },
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
      _count: { select: { replies: true, reactions: true } },
    },
  });

  const postData = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    editedAt: post.editedAt?.toISOString() ?? null,
    userReactions,
    poll: post.poll
      ? {
          ...post.poll,
          expiresAt: post.poll.expiresAt.toISOString(),
          createdAt: post.poll.createdAt.toISOString(),
        }
      : null,
    repostOf: post.repostOf
      ? {
          ...post.repostOf,
          createdAt: post.repostOf.createdAt.toISOString(),
          updatedAt: post.repostOf.updatedAt.toISOString(),
          editedAt: post.repostOf.editedAt?.toISOString() ?? null,
        }
      : null,
  };

  const commentsData = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    editedAt: c.editedAt?.toISOString() ?? null,
  }));

  return (
    <PostDetailClient
      post={postData as never}
      initialComments={commentsData as never}
      currentUserId={userId ?? null}
    />
  );
}
