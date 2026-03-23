import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createThreadSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(10000),
  mediaUrls: z.array(z.string()).max(4).optional(),
  audioUrl: z.string().nullable().optional(),
  audioTitle: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const where = categorySlug
      ? { category: { slug: categorySlug } }
      : {};

    const threads = await db.forumThread.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
        category: { select: { name: true, slug: true, icon: true, color: true } },
        _count: { select: { replies: true } },
      },
    });

    const hasMore = threads.length > limit;
    const items = hasMore ? threads.slice(0, limit) : threads;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({ items, nextCursor });
  } catch {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createThreadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { categoryId, title, content, mediaUrls, audioUrl, audioTitle } = result.data;

    const thread = await db.forumThread.create({
      data: {
        categoryId,
        authorId: session.user.id,
        title,
        content,
        mediaUrls: mediaUrls ?? [],
        audioUrl: audioUrl ?? null,
        audioTitle: audioTitle ?? null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { profilePictureUrl: true } },
          },
        },
        category: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(thread, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
