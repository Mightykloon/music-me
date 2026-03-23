import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unifiedSearch } from "@/lib/music/search";
import { freeSearch } from "@/lib/music/free-search";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check if user has any connected music services
    let connectionCount = 0;
    try {
      connectionCount = await db.musicConnection.count({
        where: { userId: session.user.id, isActive: true },
      });
    } catch {
      // If db query fails, fall through to free search
    }

    // Use connected services if available, otherwise fall back to free iTunes search
    const results =
      connectionCount > 0
        ? await unifiedSearch(session.user.id, query, limit)
        : await freeSearch(query, limit);

    return NextResponse.json(results);
  } catch (err) {
    console.error("Music search error:", err);
    // Fall back to free search even if auth/db fails
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get("q") ?? "";
      const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
      if (query.length >= 2) {
        const results = await freeSearch(query, limit);
        return NextResponse.json(results);
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
