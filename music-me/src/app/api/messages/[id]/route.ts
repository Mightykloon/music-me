import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? 30), 50);

    // Verify user is part of conversation
    const conversation = await db.conversation.findUnique({
      where: { id },
      select: { user1Id: true, user2Id: true },
    });

    if (
      !conversation ||
      (conversation.user1Id !== userId && conversation.user2Id !== userId)
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await db.directMessage.findMany({
      where: { conversationId: id },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { profilePictureUrl: true } },
          },
        },
      },
    });

    // Mark unread messages as read
    await db.directMessage.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({ items: items.reverse(), nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
