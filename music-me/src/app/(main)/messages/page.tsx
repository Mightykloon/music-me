import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessagesClient } from "./messages-client";

export const metadata = {
  title: "Messages — music.me",
};

export default async function MessagesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

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

  const items = conversations.map((c) => {
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

  return <MessagesClient conversations={items} currentUserId={userId} />;
}
