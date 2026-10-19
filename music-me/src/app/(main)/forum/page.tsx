import { db } from "@/lib/db";
import { ForumHome } from "./forum-home";

export const metadata = {
  title: "Forum",
};

// each sub-forum's most recently active thread, with its newest reply,
// for the back of its tile
const latestThread = {
  orderBy: { lastReplyAt: "desc" as const },
  take: 1,
  select: {
    id: true,
    title: true,
    createdAt: true,
    author: { select: { username: true } },
    replies: {
      orderBy: { createdAt: "desc" as const },
      take: 1,
      select: { content: true, createdAt: true, author: { select: { username: true } } },
    },
  },
};

const include = {
  children: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      _count: { select: { threads: true } },
      threads: latestThread,
    },
  },
  _count: { select: { threads: true } },
};

export default async function ForumPage() {
  let categories = await db.forumCategory.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include,
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
      include,
    });
  }

  // dates as strings for the client component
  // replies per sub-forum, so tiles can be sized by total activity
  const replyCounts = await db.$queryRaw<{ categoryId: string; replies: bigint }[]>`
    SELECT t."categoryId", COUNT(r.id) AS replies
    FROM "ForumReply" r JOIN "ForumThread" t ON t.id = r."threadId"
    GROUP BY t."categoryId"`;
  const repliesBy = new Map(replyCounts.map((r) => [r.categoryId, Number(r.replies)]));

  const data = categories.map((c) => ({
    ...c,
    children: c.children.map((sub) => ({
      ...sub,
      activity: sub._count.threads + (repliesBy.get(sub.id) ?? 0),
      threads: sub.threads.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        replies: t.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      })),
    })),
  }));

  return <ForumHome categories={data} />;
}
