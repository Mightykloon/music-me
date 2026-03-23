import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  playlistIds: z.array(z.string()).min(2, "Need at least 2 playlists to sync"),
  parityPlaylistId: z.string(),
});

// Create a sync group
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createGroupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, playlistIds, parityPlaylistId } = result.data;

    // Verify all playlists belong to the user
    const playlists = await db.playlist.findMany({
      where: { id: { in: playlistIds }, userId: session.user.id },
    });

    if (playlists.length !== playlistIds.length) {
      return NextResponse.json({ error: "Invalid playlist selection" }, { status: 400 });
    }

    // Verify parity playlist is in the selection
    if (!playlistIds.includes(parityPlaylistId)) {
      return NextResponse.json({ error: "Parity playlist must be in the selection" }, { status: 400 });
    }

    // Remove playlists from any existing sync groups
    await db.playlist.updateMany({
      where: { id: { in: playlistIds } },
      data: { syncGroupId: null },
    });

    // Create the sync group
    const group = await db.playlistSyncGroup.create({
      data: {
        userId: session.user.id,
        name,
        parityPlaylistId,
      },
    });

    // Add playlists to the group
    await db.playlist.updateMany({
      where: { id: { in: playlistIds } },
      data: { syncGroupId: group.id },
    });

    const created = await db.playlistSyncGroup.findUnique({
      where: { id: group.id },
      include: {
        playlists: {
          include: { _count: { select: { tracks: true } } },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Sync group create error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Get all sync groups
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await db.playlistSyncGroup.findMany({
      where: { userId: session.user.id },
      include: {
        playlists: {
          include: { _count: { select: { tracks: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(groups);
  } catch (err) {
    console.error("Sync groups fetch error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Delete a sync group
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("id");
    if (!groupId) {
      return NextResponse.json({ error: "Missing group id" }, { status: 400 });
    }

    // Verify ownership
    const group = await db.playlistSyncGroup.findFirst({
      where: { id: groupId, userId: session.user.id },
    });
    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Unlink playlists
    await db.playlist.updateMany({
      where: { syncGroupId: groupId },
      data: { syncGroupId: null },
    });

    // Delete the group
    await db.playlistSyncGroup.delete({ where: { id: groupId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Sync group delete error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
