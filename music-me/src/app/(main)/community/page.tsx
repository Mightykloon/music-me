import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommunityClient } from "./community-client";
import { loadForumCategories } from "../forum/load-forum";

export const metadata = {
  title: "Community",
};

export default async function CommunityPage() {
  const session = await auth();
  // guests (no account) see the forum and live chat but have no conversations
  const userId = session?.user?.id ?? null;

  // Forum categories for the tile dashboard (with newest activity per sub-forum)
  const categories = await loadForumCategories();

  // Fetch conversations
  const conversations = !userId ? [] : await db.conversation.findMany({
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
    where: userId ? { id: { not: userId } } : undefined,
    select: {
      id: true,
      username: true,
      displayName: true,
      profile: { select: { profilePictureUrl: true } },
    },
  });

  return (
    <CommunityClient
      categories={categories}
      conversations={conversationItems}
      currentUserId={userId ?? ""}
      onlineUsers={recentUsers}
    />
  );
}
