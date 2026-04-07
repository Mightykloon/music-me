import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Friends = mutual follows (you follow them AND they follow you) */
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

  // Find all mutual follows via raw SQL for efficiency
  const friends = await db.$queryRaw<
    { id: string; username: string; displayName: string | null; profilePictureUrl: string | null }[]
  >`
    SELECT u.id, u.username, u."displayName", up."profilePictureUrl"
    FROM "Follow" f1
    JOIN "Follow" f2 ON f1."followerId" = f2."followingId" AND f1."followingId" = f2."followerId"
    JOIN "User" u ON u.id = f1."followingId"
    LEFT JOIN "UserProfile" up ON up."userId" = u.id
    WHERE f1."followerId" = ${user.id}
    ORDER BY f1."createdAt" DESC
  `;

  return NextResponse.json(friends);
}
