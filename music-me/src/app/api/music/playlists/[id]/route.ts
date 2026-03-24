import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const playlist = await db.playlist.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
      tracks: {
        orderBy: { position: "asc" },
        include: { track: true },
      },
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!playlist.isPublic) {
    const session = await auth();
    if (session?.user?.id !== playlist.userId) {
      return NextResponse.json({ error: "Private playlist" }, { status: 403 });
    }
  }

  return NextResponse.json(playlist);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const playlist = await db.playlist.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.playlist.update({
    where: { id },
    data: {
      ...(typeof body.isPublic === "boolean" ? { isPublic: body.isPublic } : {}),
      ...(typeof body.isPinned === "boolean" ? { isPinned: body.isPinned } : {}),
    },
  });

  return NextResponse.json(updated);
}
