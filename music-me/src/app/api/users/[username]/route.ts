import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fixS3Url } from "@/lib/storage";

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
        createdAt: true,
        profile: true,
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
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
