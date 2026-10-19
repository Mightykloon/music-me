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
  const data = categories.map((c) => ({
    ...c,
    children: c.children.map((sub) => ({
      ...sub,
      threads: sub.threads.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        replies: t.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      })),
    })),
  }));

  return <ForumHome categories={data} />;
}
