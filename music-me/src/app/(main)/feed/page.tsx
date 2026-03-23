import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeedPageClient } from "./feed-client";

export const metadata = {
  title: "Feed — music.me",
  description: "Your personalized music feed",
};

export default async function FeedPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let user = null;
  if (userId) {
    user = await db.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        displayName: true,
        profile: { select: { profilePictureUrl: true } },
      },
    });
  }

  return <FeedPageClient user={user} />;
}
