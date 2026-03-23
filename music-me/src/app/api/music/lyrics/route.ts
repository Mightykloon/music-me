import { NextResponse } from "next/server";
import { getLyrics } from "@/lib/music/lyrics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");
  const duration = searchParams.get("duration");

  if (!title || !artist) {
    return NextResponse.json(
      { error: "title and artist are required" },
      { status: 400 }
    );
  }

  const result = await getLyrics(
    title,
    artist,
    duration ? Number(duration) : undefined
  );

  if (!result) {
    return NextResponse.json(
      { error: "Lyrics not found", lines: [], synced: false },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
