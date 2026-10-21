import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { resolveSources } from "@/lib/music/sources";

/** GET: where this track can be played (YouTube, Spotify, preview) plus its cover. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // profile songs play for signed-out visitors too, so this is limited per IP for them
  const blocked = await guard(request, "track-sources", { limit: 60, windowSec: 60 });
  if (blocked) return blocked;

  const { id } = await params;
  const track = await db.musicTrack.findUnique({ where: { id } });
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(await resolveSources(track), {
    // the answer only changes when a preview link expires; let browsers reuse it briefly
    headers: { "cache-control": "private, max-age=600" },
  });
}
