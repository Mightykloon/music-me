import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Create notification
    await db.notification.create({
      data: {
        userId: target.id,
        actorId: session.user.id,
        type: "FOLLOW",
        referenceId: session.user.id,
        referenceType: "user",
      },
    });

    return NextResponse.json({ action: "followed" });
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

    const isFollowing = session?.user?.id
      ? !!(await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: target.id,
            },
          },
        }))
      : false;

    return NextResponse.json({ isFollowing });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
