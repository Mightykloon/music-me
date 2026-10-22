import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fixS3Url } from "@/lib/storage";
import { recentThreads } from "@/lib/profile/threads";
import { withCovers } from "@/lib/profile/favorite-covers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await db.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        pronouns: true,
        location: true,
        website: true,
        isVerified: true,
        role: true,
        forumRank: true,
        forumRankColor: true,
        createdAt: true,
        profile: { include: { profileSong: true } },
        links: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fix broken S3 URLs from old "auto" region config
    if (user.profile) {
      user.profile.profilePictureUrl = fixS3Url(user.profile.profilePictureUrl);
      user.profile.bannerUrl = fixS3Url(user.profile.bannerUrl);
      user.profile.backgroundImageUrl = fixS3Url(user.profile.backgroundImageUrl);
      user.profile.bannerVideoUrl = fixS3Url(user.profile.bannerVideoUrl);
      user.profile.favorites = await withCovers(user.profile.favorites);
    }

    // the profile editor previews the threads block too
    return NextResponse.json({ ...user, threads: await recentThreads(user.id) });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
