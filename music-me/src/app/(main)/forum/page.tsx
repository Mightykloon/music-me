import { db } from "@/lib/db";
import { ForumHome } from "./forum-home";

export const metadata = {
  title: "Forum — music.me",
};

export default async function ForumPage() {
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

  return <ForumHome categories={categories as never} />;
}
