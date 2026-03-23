import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const replySchema = z.object({
  content: z.string().min(1).max(10000),
  mediaUrls: z.array(z.string()).max(4).optional(),
  audioUrl: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

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
    const result = replySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const reply = await db.forumReply.create({
      data: {
        threadId: id,
        authorId: session.user.id,
        content: result.data.content,
        mediaUrls: result.data.mediaUrls ?? [],
        audioUrl: result.data.audioUrl ?? null,
        parentId: result.data.parentId ?? null,
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
      },
    });

    // Update thread's lastReplyAt
    await db.forumThread.update({
      where: { id },
      data: { lastReplyAt: new Date() },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to reply" }, { status: 500 });
  }
}
