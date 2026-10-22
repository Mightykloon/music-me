import { db } from "@/lib/db";

// each sub-forum's most recently active thread, with its newest reply,
// for the back of its tile
const latestThread = {
  orderBy: { lastReplyAt: "desc" as const },
  take: 1,
  select: {
    id: true,
    title: true,
    createdAt: true,
    author: { select: { username: true, forumRank: true, forumRankColor: true } },
    replies: {
      orderBy: { createdAt: "desc" as const },
      take: 1,
      select: { content: true, createdAt: true, author: { select: { username: true, forumRank: true, forumRankColor: true } } },
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

/**
 * A reply as one line of plain text for a tile: forum tags (bold, quotes,
 * images, music cards...) are rendered by the thread page, not here.
 */
export function plainPreview(content: string): string {
  return content
    .replace(/\[music[^\]]*?title="([^"]*)"[^\]]*?artist="([^"]*)"[^\]]*\][\s\S]*?\[\/music\]/gi, "♪ $1 by $2 ")
    .replace(/\[music[^\]]*\][\s\S]*?\[\/music\]/gi, "♪ a song ")
    .replace(/\[img[^\]]*\][\s\S]*?\[\/img\]/gi, "(image) ")
    .replace(/\[quote[^\]]*\][\s\S]*?\[\/quote\]/gi, "")
    .replace(/\[\/?[a-z0-9*]+(?:=[^\]]*)?\]/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const findTopLevel = () =>
  db.forumCategory.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, include });

// Forum categories for the tile dashboard: sub-forums with their newest
// activity and an activity score (threads + replies) for sizing the tiles.
// Seeds the default categories the first time the forum is empty.
export async function loadForumCategories() {
  let categories = await findTopLevel();
  if (categories.length === 0) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/forum/seed`, {
      method: "POST",
    }).catch(() => {});
    categories = await findTopLevel();
  }

  // replies per sub-forum
  const replyCounts = await db.$queryRaw<{ categoryId: string; replies: bigint }[]>`
    SELECT t."categoryId", COUNT(r.id) AS replies
    FROM "ForumReply" r JOIN "ForumThread" t ON t.id = r."threadId"
    GROUP BY t."categoryId"`;
  const repliesBy = new Map(replyCounts.map((r) => [r.categoryId, Number(r.replies)]));

  // dates as strings for client components
  return categories.map((c) => ({
    ...c,
    children: c.children.map((sub) => ({
      ...sub,
      activity: sub._count.threads + (repliesBy.get(sub.id) ?? 0),
      threads: sub.threads.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        replies: t.replies.map((r) => ({ ...r, content: plainPreview(r.content), createdAt: r.createdAt.toISOString() })),
      })),
    })),
  }));
}
