import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
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
