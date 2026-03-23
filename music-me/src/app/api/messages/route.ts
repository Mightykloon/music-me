import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const conversations = await db.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { profilePictureUrl: true } },
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { profilePictureUrl: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            read: true,
          },
        },
      },
    });

    const items = conversations.map((c) => {
      const other = c.user1Id === userId ? c.user2 : c.user1;
      const lastMessage = c.messages[0] ?? null;
      return {
        id: c.id,
        other,
        lastMessage,
        updatedAt: c.updatedAt,
      };
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId, content } = await request.json();
    if (!recipientId || !content?.trim()) {
      return NextResponse.json(
        { error: "Recipient and content required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    if (recipientId === userId) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    // Find or create conversation
    const [u1, u2] =
      userId < recipientId
        ? [userId, recipientId]
        : [recipientId, userId];

    let conversation = await db.conversation.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: { user1Id: u1, user2Id: u2 },
      });
    }

    const message = await db.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: content.trim(),
      },
    });

    // Touch conversation updatedAt
    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
