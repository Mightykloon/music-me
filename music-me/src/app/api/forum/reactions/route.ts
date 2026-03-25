import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const ALLOWED_EMOJIS = ["👍", "👎", "❤️", "😂", "🔥", "🎵", "🎸", "🤘", "👏", "💯", "😮", "😢"];

const reactSchema = z.object({
  emoji: z.string().refine((e) => ALLOWED_EMOJIS.includes(e), "Invalid emoji"),
  threadId: z.string().optional(),
  replyId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = reactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { emoji, threadId, replyId } = result.data;
    if (!threadId && !replyId) {
      return NextResponse.json(
        { error: "Must provide threadId or replyId" },
        { status: 400 }
      );
    }

    // Check if user already reacted with this SAME emoji (toggle off)
    const existingSame = await db.forumReaction.findFirst({
      where: {
        userId: session.user.id,
        emoji,
        ...(threadId ? { threadId } : { replyId }),
      },
    });

    if (existingSame) {
      await db.forumReaction.delete({ where: { id: existingSame.id } });
      return NextResponse.json({ action: "removed" });
    }

    // Limit: 1 reaction total per user per thread/reply — remove any existing reaction first
    const existingAny = await db.forumReaction.findFirst({
      where: {
        userId: session.user.id,
        ...(threadId ? { threadId } : { replyId }),
      },
    });

    if (existingAny) {
      // Replace existing reaction with new emoji
      await db.forumReaction.update({
        where: { id: existingAny.id },
        data: { emoji },
      });
      return NextResponse.json({ action: "changed", emoji }, { status: 200 });
    }

    // Add new reaction
    await db.forumReaction.create({
      data: {
        userId: session.user.id,
        emoji,
        threadId: threadId ?? null,
        replyId: replyId ?? null,
      },
    });

    // Notify the thread/reply author
    if (threadId) {
      const thread = await db.forumThread.findUnique({
        where: { id: threadId },
        select: { authorId: true },
      });
      if (thread) {
        void createNotification({
          userId: thread.authorId,
          actorId: session.user.id,
          type: "REACTION",
          referenceId: threadId,
          referenceType: "thread",
        });
      }
    } else if (replyId) {
      const reply = await db.forumReply.findUnique({
        where: { id: replyId },
        select: { authorId: true },
      });
      if (reply) {
        void createNotification({
          userId: reply.authorId,
          actorId: session.user.id,
          type: "REACTION",
          referenceId: replyId,
          referenceType: "reply",
        });
      }
    }

    return NextResponse.json({ action: "added" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
