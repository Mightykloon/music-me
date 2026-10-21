import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { containsProfanity } from "@/lib/utils/profanity";

// The community live chat room. Messages live in the database so every
// server instance (and so every visitor) sees the same room. Clients poll
// with ?after=<ISO time of their newest message> and only get what's new.

const PAGE = 50;
/** messages older than this are cleared out now and then */
const KEEP_DAYS = 30;

const select = {
  id: true,
  content: true,
  createdAt: true,
  user: {
    select: { id: true, username: true, displayName: true, profile: { select: { profilePictureUrl: true } } },
  },
} as const;

type Row = { id: string; content: string; createdAt: Date; user: { id: string; username: string; displayName: string | null; profile: { profilePictureUrl: string | null } | null } };

const shape = (m: Row) => ({
  id: m.id,
  userId: m.user.id,
  username: m.user.username,
  displayName: m.user.displayName ?? m.user.username,
  avatar: m.user.profile?.profilePictureUrl ?? null,
  content: m.content,
  timestamp: m.createdAt.toISOString(),
});

/** GET: the latest messages, or with ?after=<ISO time> only newer ones. */
export async function GET(request: Request) {
  // a polling tab asks every few seconds; this leaves room for a few tabs per visitor
  const blocked = await guard(request, "live-chat-read", { limit: 60, windowSec: 60 });
  if (blocked) return blocked;

  const afterParam = new URL(request.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : null;

  const rows: Row[] =
    after && !isNaN(after.getTime())
      ? await db.chatMessage.findMany({ where: { createdAt: { gt: after } }, orderBy: { createdAt: "asc" }, take: PAGE, select })
      : (await db.chatMessage.findMany({ orderBy: { createdAt: "desc" }, take: PAGE, select })).reverse();

  return NextResponse.json({ messages: rows.map(shape) });
}

/** POST { content }: say something (signed in only). */
export async function POST(request: Request) {
  const blocked = await guard(request, "live-chat-send", { limit: 8, windowSec: 30, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  const userId = session!.user!.id!;

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
  if (containsProfanity(content)) return NextResponse.json({ error: "Please keep it clean." }, { status: 400 });

  const message = await db.chatMessage.create({ data: { userId, content }, select });

  // occasional tidy-up instead of a scheduled job
  if (Math.random() < 0.02) {
    await db.chatMessage
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_DAYS * 86_400_000) } } })
      .catch(() => {});
  }

  return NextResponse.json(shape(message), { status: 201 });
}
