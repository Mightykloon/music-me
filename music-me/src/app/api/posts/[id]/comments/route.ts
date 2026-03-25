import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
    const parentId = searchParams.get("parentId") ?? null;

    const comments = await db.comment.findMany({
      where: {
        postId: id,
        parentId,
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "asc" },
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
        attachedTrack: true,
        _count: { select: { replies: true, reactions: true } },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({ items, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, parentId, attachedTrackId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment too long" },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await db.post.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify parent comment if replying
    if (parentId) {
      const parent = await db.comment.findUnique({
        where: { id: parentId },
        select: { postId: true },
      });
      if (!parent || parent.postId !== id) {
        return NextResponse.json(
          { error: "Invalid parent comment" },
          { status: 400 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        postId: id,
        authorId: session.user.id,
        content: content.trim(),
        parentId: parentId ?? null,
        attachedTrackId: attachedTrackId ?? null,
      },
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
        attachedTrack: true,
        _count: { select: { replies: true, reactions: true } },
      },
    });

    // Notify post author about the comment
    const postForNotif = await db.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (postForNotif) {
      void createNotification({
        userId: postForNotif.authorId,
        actorId: session.user.id,
        type: "COMMENT",
        referenceId: id,
        referenceType: "post",
      });
    }

    // If replying to a comment, also notify the parent comment author
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (parentComment && parentComment.authorId !== postForNotif?.authorId) {
        void createNotification({
          userId: parentComment.authorId,
          actorId: session.user.id,
          type: "COMMENT",
          referenceId: id,
          referenceType: "post",
        });
      }
    }

    // Check for @mentions in content
    const mentionMatches = content.match(/@(\w+)/g);
    if (mentionMatches) {
      for (const mention of mentionMatches) {
        const mentionedUsername = mention.slice(1);
        const mentionedUser = await db.user.findUnique({
          where: { username: mentionedUsername },
          select: { id: true },
        });
        if (mentionedUser) {
          void createNotification({
            userId: mentionedUser.id,
            actorId: session.user.id,
            type: "MENTION",
            referenceId: id,
            referenceType: "post",
          });
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
