import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const POST_INCLUDE = {
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
  attachedPlaylist: {
    select: {
      id: true,
      name: true,
      coverImageUrl: true,
      trackCount: true,
      provider: true,
    },
  },
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
  repostOf: {
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
      _count: { select: { comments: true, reactions: { where: { type: "HEART" } }, reposts: true } },
    },
  },
  _count: { select: { comments: true, reactions: { where: { type: "HEART" } }, reposts: true } },
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    const post = await db.post.findUnique({
      where: { id },
      include: POST_INCLUDE,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check visibility
    if (post.visibility !== "PUBLIC" && post.authorId !== userId) {
      if (post.visibility === "PRIVATE") {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      if (post.visibility === "FOLLOWERS" && userId) {
        const isFollowing = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: post.authorId,
            },
          },
        });
        if (!isFollowing) {
          return NextResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        }
      }
    }

    // Attach user reactions
    let userReactions: string[] = [];
    if (userId) {
      const reactions = await db.reaction.findMany({
        where: { userId, postId: id },
        select: { type: true },
      });
      userReactions = reactions.map((r) => r.type);
    }

    return NextResponse.json({ ...post, userReactions });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true, pollId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete associated poll if exists
    if (post.pollId) {
      await db.poll.delete({ where: { id: post.pollId } });
    }

    await db.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const content = body.content;
    if (typeof content !== "string" || content.length === 0 || content.length > 5000) {
      return NextResponse.json({ error: "Content must be 1-5000 characters" }, { status: 400 });
    }

    const updated = await db.post.update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
      },
      include: POST_INCLUDE,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
