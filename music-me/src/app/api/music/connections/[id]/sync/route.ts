import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncPlaylists } from "@/lib/music/playlist-sync";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // outside API calls: rate limited and cached (see src/lib/api-guard.ts)
  const blocked = await guard(request, "connection-sync", { limit: 5, windowSec: 600, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const connection = await db.musicConnection.findFirst({
    where: { id, userId: session.user.id, isActive: true },
  });

  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await syncPlaylists(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
