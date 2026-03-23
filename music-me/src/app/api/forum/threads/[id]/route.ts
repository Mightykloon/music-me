import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const thread = await db.forumThread.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            isVerified: true,
            profile: { select: { profilePictureUrl: true } },
          },
        },
        category: { select: { name: true, slug: true, icon: true, color: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profile: { select: { profilePictureUrl: true } },
              },
            },
          },
        },
        _count: { select: { replies: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
