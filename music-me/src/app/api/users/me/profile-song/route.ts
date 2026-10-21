import { NextResponse } from "next/server";
import { z } from "zod";
import { MusicProviderType } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { httpUrl } from "@/lib/auth/validation";

const track = z.object({
  provider: z.nativeEnum(MusicProviderType),
  providerTrackId: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  album: z.string().max(300).nullable().optional(),
  albumArtUrl: httpUrl.max(1000).nullable().optional(),
  previewUrl: httpUrl.max(1000).nullable().optional(),
  duration: z.number().int().nonnegative().nullable().optional(),
  externalUrl: httpUrl.max(1000).nullable().optional(),
});

/** PUT { track } sets the profile song (saving the track if it's new); { track: null } clears it. */
export async function PUT(request: Request) {
  const blocked = await guard(request, "profile-song", { limit: 20, windowSec: 60, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  const userId = session!.user!.id!;

  const parsed = z.object({ track: track.nullable() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That song couldn't be saved." }, { status: 400 });

  let songId: string | null = null;
  if (parsed.data.track) {
    const { provider, providerTrackId, ...rest } = parsed.data.track;
    const saved = await db.musicTrack.upsert({
      where: { provider_providerTrackId: { provider, providerTrackId } },
      create: { provider, providerTrackId, ...rest },
      update: { previewUrl: rest.previewUrl ?? undefined, albumArtUrl: rest.albumArtUrl ?? undefined },
    });
    songId = saved.id;
  }

  await db.userProfile.upsert({
    where: { userId },
    update: { profileSongId: songId },
    create: { userId, profileSongId: songId },
  });
  const song = songId ? await db.musicTrack.findUnique({ where: { id: songId } }) : null;
  return NextResponse.json({ song });
}
