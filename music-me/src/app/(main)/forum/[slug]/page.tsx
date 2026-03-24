import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CategoryView } from "./category-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await db.forumCategory.findUnique({
    where: { slug },
    select: { name: true },
  });
  return { title: category ? `${category.name} — Forum — music.me` : "Forum" };
}

export default async function ForumCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await db.forumCategory.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true } },
    },
  });

  if (!category) notFound();

  const threads = await db.forumThread.findMany({
    where: { categoryId: category.id },
    take: 30,
    orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
      _count: { select: { replies: true } },
    },
  });

  const serialized = threads.map((t: (typeof threads)[number]) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    lastReplyAt: t.lastReplyAt.toISOString(),
  }));

  return (
    <CategoryView
      category={{
        ...category,
        parent: category.parent
          ? { name: category.parent.name, slug: category.parent.slug }
          : null,
      }}
      threads={serialized}
    />
  );
}
