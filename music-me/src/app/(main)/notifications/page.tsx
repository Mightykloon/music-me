import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationsClient } from "./notifications-client";
import { JoinPrompt } from "@/components/auth/join-prompt";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return <JoinPrompt what="get notified when people follow you, reply or react" />;

  const notifications = await db.notification.findMany({
    where: { userId },
    take: 30,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
    },
  });

  // Mark as read
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  const items = notifications.map((n: (typeof notifications)[number]) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return <NotificationsClient initialNotifications={items as never} />;
}
