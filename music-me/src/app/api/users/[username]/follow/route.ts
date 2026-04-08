import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(session.user.id + ":follow", { limit: 60, windowSec: 60 });
    if (!rl.success) return rateLimitResponse(rl.retryAfterSec);

    const { username } = await params;
    const target = await db.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: target.id,
        },
      },
    });

    if (existing) {
      // Unfollow
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: target.id,
          },
        },
      });
      return NextResponse.json({ action: "unfollowed" });
    }

    // Follow
    await db.follow.create({
      data: {
        followerId: session.user.id,
        followingId: target.id,
      },
    });

    // Create FOLLOW notification
    await db.notification.create({
      data: {
        userId: target.id,
        actorId: session.user.id,
        type: "FOLLOW",
        referenceId: session.user.id,
        referenceType: "user",
      },
    });

    // Check if this creates a mutual follow (friendship)
    const reverseFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: target.id,
          followingId: session.user.id,
        },
      },
    });

    let isFriend = false;
    if (reverseFollow) {
      isFriend = true;
      // Notify both users about the new friendship
      await db.notification.createMany({
        data: [
          {
            userId: session.user.id,
            actorId: target.id,
            type: "FRIEND",
            referenceId: target.id,
            referenceType: "user",
          },
          {
            userId: target.id,
            actorId: session.user.id,
            type: "FRIEND",
            referenceId: session.user.id,
            referenceType: "user",
          },
        ],
      });
    }

    return NextResponse.json({ action: "followed", isFriend });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    const { username } = await params;

    const target = await db.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false, isFriend: false });
    }

    const [meToThem, themToMe] = await Promise.all([
      db.follow.findUnique({
        where: { followerId_followingId: { followerId: session.user.id, followingId: target.id } },
      }),
      db.follow.findUnique({
        where: { followerId_followingId: { followerId: target.id, followingId: session.user.id } },
      }),
    ]);

    return NextResponse.json({
      isFollowing: !!meToThem,
      isFriend: !!meToThem && !!themToMe,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
