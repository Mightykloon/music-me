import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const following = await db.follow.findMany({
    where: { followerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
    },
  });

  return NextResponse.json(following.map((f) => f.following));
}
