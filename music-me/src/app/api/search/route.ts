import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") ?? "all";
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);

    if (!q || q.length < 1) {
      return NextResponse.json({ users: [], posts: [], tracks: [], playlists: [] });
    }

    const results: Record<string, unknown[]> = {};

    if (type === "all" || type === "users") {
      const users = await db.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          isVerified: true,
          bio: true,
          profile: { select: { profilePictureUrl: true } },
          _count: { select: { followers: true } },
        },
      });
      results.users = users;
    }

    if (type === "all" || type === "posts") {
      const posts = await db.post.findMany({
        where: {
          content: { contains: q, mode: "insensitive" },
          visibility: "PUBLIC",
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              isVerified: true,
              profile: { select: { profilePictureUrl: true } },
            },
          },
          attachedTrack: true,
          _count: {
            select: { comments: true, reactions: true, reposts: true },
          },
        },
      });
      results.posts = posts;
    }

    if (type === "all" || type === "tracks") {
      const tracks = await db.musicTrack.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { artist: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
      });
      results.tracks = tracks;
    }

    if (type === "all" || type === "playlists") {
      const playlists = await db.playlist.findMany({
        where: {
          isPublic: true,
          name: { contains: q, mode: "insensitive" },
        },
        take: limit,
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              profile: { select: { profilePictureUrl: true } },
            },
          },
        },
      });
      results.playlists = playlists;
    }

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
