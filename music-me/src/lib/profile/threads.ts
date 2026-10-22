import { db } from "@/lib/db";
import type { ThreadInfo } from "@/components/profile/layouts/types";

/** The newest forum threads someone started, for the "forum threads" profile block. */
export async function recentThreads(userId: string, take = 6): Promise<ThreadInfo[]> {
  const rows = await db.forumThread.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      createdAt: true,
      category: { select: { slug: true, name: true } },
      _count: { select: { replies: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    createdAt: t.createdAt.toISOString(),
    categorySlug: t.category.slug,
    categoryName: t.category.name,
    replies: t._count.replies,
  }));
}
