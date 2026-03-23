import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createPostSchema = z.object({
  type: z.enum([
    "TEXT",
    "IMAGE",
    "VIDEO",
    "POLL",
    "LYRIC_CARD",
    "PLAYLIST_DROP",
    "NOW_PLAYING",
    "REPOST",
  ]),
  content: z.string().max(5000).nullable().optional(),
  mediaUrls: z.array(z.string()).max(4).optional(),
  videoUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  attachedTrackId: z.string().nullable().optional(),
  attachedPlaylistId: z.string().nullable().optional(),
  lyricCardData: z.record(z.string(), z.unknown()).nullable().optional(),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  repostOfId: z.string().nullable().optional(),
  scheduledFor: z.string().nullable().optional(),
  track: z
    .object({
      provider: z.string(),
      providerTrackId: z.string(),
      title: z.string(),
      artist: z.string(),
      album: z.string().nullable().optional(),
      albumArtUrl: z.string().nullable().optional(),
      previewUrl: z.string().nullable().optional(),
      duration: z.number().nullable().optional(),
      isrc: z.string().nullable().optional(),
      externalUrl: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  poll: z
    .object({
      question: z.string().min(1).max(300),
      options: z
        .array(
          z.object({
            text: z.string().min(1).max(100),
            attachedTrackId: z.string().nullable().optional(),
          })
        )
        .min(2)
        .max(6),
      allowMultiple: z.boolean().optional(),
      expiresInHours: z.number().min(1).max(168).optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createPostSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;
    const userId = session.user.id;

    // Handle repost
    if (data.type === "REPOST" && data.repostOfId) {
      const existing = await db.post.findFirst({
        where: {
          authorId: userId,
          type: "REPOST",
          repostOfId: data.repostOfId,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Already reposted" },
          { status: 409 }
        );
      }
    }

    // Resolve track to DB record if provided
    let attachedTrackId = data.attachedTrackId ?? null;
    if (!attachedTrackId && data.track) {
      const t = data.track;
      const existing = await db.musicTrack.findUnique({
        where: {
          provider_providerTrackId: {
            provider: t.provider as never,
            providerTrackId: t.providerTrackId,
          },
        },
      });
      if (existing) {
        attachedTrackId = existing.id;
      } else {
        const created = await db.musicTrack.create({
          data: {
            provider: t.provider as never,
            providerTrackId: t.providerTrackId,
            title: t.title,
            artist: t.artist,
            album: t.album ?? null,
            albumArtUrl: t.albumArtUrl ?? null,
            previewUrl: t.previewUrl ?? null,
            duration: t.duration ?? null,
            isrc: t.isrc ?? null,
            externalUrl: t.externalUrl ?? null,
          },
        });
        attachedTrackId = created.id;
      }
    }

    // Create poll if present
    let pollId: string | undefined;
    if (data.type === "POLL" && data.poll) {
      const poll = await db.poll.create({
        data: {
          question: data.poll.question,
          allowMultiple: data.poll.allowMultiple ?? false,
          expiresAt: new Date(
            Date.now() + (data.poll.expiresInHours ?? 24) * 60 * 60 * 1000
          ),
          options: {
            create: data.poll.options.map((opt) => ({
              text: opt.text,
              attachedTrackId: opt.attachedTrackId ?? undefined,
            })),
          },
        },
      });
      pollId = poll.id;
    }

    const post = await db.post.create({
      data: {
        authorId: userId,
        type: data.type,
        content: data.content ?? null,
        mediaUrls: data.mediaUrls ?? [],
        videoUrl: data.videoUrl ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        attachedTrackId,
        attachedPlaylistId: data.attachedPlaylistId ?? null,
        lyricCardData: (data.lyricCardData ?? undefined) as unknown as undefined,
        visibility: data.visibility ?? "PUBLIC",
        repostOfId: data.repostOfId ?? null,
        pollId: pollId ?? null,
        scheduledFor: data.scheduledFor
          ? new Date(data.scheduledFor)
          : null,
      },
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
        poll: {
          include: {
            options: {
              include: {
                attachedTrack: true,
                _count: { select: { votes: true } },
              },
            },
            _count: { select: { options: true } },
          },
        },
        _count: { select: { comments: true, reactions: true, reposts: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
