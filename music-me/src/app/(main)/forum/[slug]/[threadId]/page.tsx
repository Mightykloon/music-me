import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { ThreadView } from "./thread-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = await db.forumThread.findUnique({
    where: { id: threadId },
    select: { title: true },
  });
  return { title: thread ? `${thread.title} — Forum — music.me` : "Thread" };
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const thread = await db.forumThread.update({
    where: { id: threadId },
    data: { viewCount: { increment: 1 } },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          isVerified: true,
          bio: true,
          createdAt: true,
          profile: { select: { profilePictureUrl: true } },
          _count: { select: { posts: true, forumThreads: true } },
        },
      },
      category: { select: { name: true, slug: true, icon: true, color: true } },
      reactions: {
        select: { emoji: true, userId: true },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profile: { select: { profilePictureUrl: true } },
              _count: { select: { forumReplies: true } },
            },
          },
          reactions: {
            select: { emoji: true, userId: true },
          },
        },
      },
      _count: { select: { replies: true } },
    },
  }).catch(() => null);

  if (!thread) notFound();

  const serialized = {
    ...thread,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    lastReplyAt: thread.lastReplyAt.toISOString(),
    author: {
      ...thread.author,
      createdAt: thread.author.createdAt.toISOString(),
    },
    replies: thread.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      editedAt: r.editedAt?.toISOString() ?? null,
    })),
  };

  return (
    <ThreadView
      thread={serialized as never}
      categorySlug={slug}
      currentUserId={currentUserId}
    />
  );
}
