import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

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

    // Check if user already reacted with this emoji
    const existing = await db.forumReaction.findFirst({
      where: {
        userId: session.user.id,
        emoji,
        ...(threadId ? { threadId } : { replyId }),
      },
    });

    if (existing) {
      // Remove reaction (toggle off)
      await db.forumReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed" });
    }

    // Add reaction
    await db.forumReaction.create({
      data: {
        userId: session.user.id,
        emoji,
        threadId: threadId ?? null,
        replyId: replyId ?? null,
      },
    });

    return NextResponse.json({ action: "added" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
