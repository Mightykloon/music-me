import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("public") === "true";
    const userId = searchParams.get("userId");

    // Public browse mode
    if (publicOnly || userId) {
      const playlists = await db.playlist.findMany({
        where: {
          isPublic: true,
          ...(userId ? { userId } : {}),
        },
        orderBy: [{ isPinned: "desc" }, { name: "asc" }],
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              profile: { select: { profilePictureUrl: true } },
            },
          },
          _count: { select: { tracks: true } },
        },
      });
      return NextResponse.json(playlists);
    }

    // Authenticated user's own playlists
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const playlists = await db.playlist.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isPinned: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { tracks: true } },
      },
    });

    return NextResponse.json(playlists);
  } catch (err) {
    console.error("Playlists fetch error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
