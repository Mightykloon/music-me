import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { readCustomization } from "@/lib/profile/customization";
import { containsProfanity } from "@/lib/utils/profanity";
import { createNotification } from "@/lib/notifications";

const PAGE = 20;

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  profile: { select: { profilePictureUrl: true } },
} as const;

async function findOwner(username: string) {
  return db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, profile: { select: { customization: true } } },
  });
}

/** GET: a page of comments on someone's wall (newest first, ?cursor=<id>). */
export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const blocked = await guard(request, "wall-read", { limit: 60, windowSec: 60 });
  if (blocked) return blocked;
  const owner = await findOwner((await params).username);
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cursor = new URL(request.url).searchParams.get("cursor");
  const rows = await db.wallComment.findMany({
    where: { profileUserId: owner.id },
    orderBy: { createdAt: "desc" },
    take: PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { author: { select: authorSelect } },
  });
  const more = rows.length > PAGE;
  return NextResponse.json({
    comments: rows.slice(0, PAGE),
    nextCursor: more ? rows[PAGE - 1].id : null,
  });
}

const body = z.object({ content: z.string().trim().min(1, "Write something first.").max(500) });

/** POST: leave a comment on someone's wall. */
export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const blocked = await guard(request, "wall-post", { limit: 10, windowSec: 10 * 60, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  const authorId = session!.user!.id!;

  const owner = await findOwner((await params).username);
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!readCustomization(owner.profile?.customization).showWall) {
    return NextResponse.json({ error: "This wall is closed." }, { status: 403 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  if (containsProfanity(parsed.data.content)) {
    return NextResponse.json({ error: "Please keep it clean." }, { status: 400 });
  }

  const comment = await db.wallComment.create({
    data: { profileUserId: owner.id, authorId, content: parsed.data.content },
    include: { author: { select: authorSelect } },
  });
  await createNotification({
    userId: owner.id,
    actorId: authorId,
    type: "WALL_COMMENT",
    referenceId: owner.username,
    referenceType: "wall",
  });
  return NextResponse.json(comment, { status: 201 });
}

/** DELETE ?id=<commentId>: the author or the wall's owner can remove a comment. */
export async function DELETE(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const blocked = await guard(request, "wall-delete", { limit: 30, windowSec: 60, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  const me = session!.user!.id!;

  const id = new URL(request.url).searchParams.get("id");
  const owner = await findOwner((await params).username);
  if (!id || !owner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await db.wallComment.findUnique({ where: { id }, select: { authorId: true, profileUserId: true } });
  if (!comment || comment.profileUserId !== owner.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.authorId !== me && comment.profileUserId !== me) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.wallComment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
