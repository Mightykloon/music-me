import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface LiveChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  content: string;
  timestamp: string;
}

const MAX_MESSAGES = 100;
const messages: LiveChatMessage[] = [];
let nextId = 1;

export async function GET() {
  try {
    const recent = messages.slice(-50);
    return NextResponse.json({ messages: recent });
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

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length > 500) {
      return NextResponse.json(
        { error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Fetch user details from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        displayName: true,
        profile: { select: { profilePictureUrl: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const message: LiveChatMessage = {
      id: String(nextId++),
      userId,
      username: user.username,
      displayName: user.displayName ?? user.username,
      avatar: user.profile?.profilePictureUrl ?? null,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);

    // Trim to max capacity
    if (messages.length > MAX_MESSAGES) {
      messages.splice(0, messages.length - MAX_MESSAGES);
    }

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
