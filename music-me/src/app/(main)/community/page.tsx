import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommunityClient } from "./community-client";

export const metadata = {
  title: "Community — remixd",
};

export default async function CommunityPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  // Fetch forum categories
  let categories = await db.forumCategory.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { threads: true } },
        },
      },
      _count: { select: { threads: true } },
    },
  });

  // Auto-seed if empty
  if (categories.length === 0) {
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/forum/seed`,
      { method: "POST" }
    ).catch(() => {});
    categories = await db.forumCategory.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { threads: true } },
          },
        },
        _count: { select: { threads: true } },
      },
    });
  }

  // Fetch conversations
  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      user1: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
      user2: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          content: true,
          createdAt: true,
          senderId: true,
          read: true,
        },
      },
    },
  });

  const conversationItems = conversations.map((c: (typeof conversations)[number]) => {
    const other = c.user1Id === userId ? c.user2 : c.user1;
    const lastMessage = c.messages[0]
      ? {
          ...c.messages[0],
          createdAt: c.messages[0].createdAt.toISOString(),
        }
      : null;
    return {
      id: c.id,
      other,
      lastMessage,
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  // Fetch some recent active users for online sidebar
  const recentUsers = await db.user.findMany({
    take: 20,
    orderBy: { updatedAt: "desc" },
    where: { id: { not: userId } },
    select: {
      id: true,
      username: true,
      displayName: true,
      profile: { select: { profilePictureUrl: true } },
    },
  });

  return (
    <CommunityClient
      categories={categories as never}
      conversations={conversationItems}
      currentUserId={userId}
      onlineUsers={recentUsers}
    />
  );
}
