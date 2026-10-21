import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { canViewPost } from "@/lib/posts/visibility";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const blocked = await guard(request, "react", { limit: 60, windowSec: 60, requireAuth: true });
    if (blocked) return blocked;
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const target = await db.post.findUnique({ where: { id }, select: { visibility: true, authorId: true } });
    if (!target || !(await canViewPost(target, session.user.id))) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { type } = await request.json();
    if (type !== "HEART") {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Toggle reaction
    const existing = await db.reaction.findUnique({
      where: {
        userId_postId_type: { userId, postId: id, type },
      },
    });

    if (existing) {
      await db.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed", type });
    }

    await db.reaction.create({
      data: { userId, postId: id, type },
    });

    // Send notification to post author
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (post) {
      void createNotification({
        userId: post.authorId,
        actorId: userId,
        type: "REACTION",
        referenceId: id,
        referenceType: "post",
      });
    }

    return NextResponse.json({ action: "added", type });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
