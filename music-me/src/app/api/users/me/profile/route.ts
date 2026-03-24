import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/auth/validation";
import { containsProfanity } from "@/lib/utils/profanity";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = profileUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Server-side profanity check
    const textToCheck = [
      result.data.displayName,
      result.data.bio,
      ...(result.data.favorites?.interests ?? []),
      ...(result.data.favorites?.hobbies ?? []),
      ...(result.data.favorites?.books ?? []),
      ...(result.data.favorites?.games ?? []),
    ].filter(Boolean).join(" ");

    if (containsProfanity(textToCheck)) {
      return NextResponse.json(
        { error: "Profile contains inappropriate language" },
        { status: 400 }
      );
    }

    const {
      displayName,
      bio,
      pronouns,
      location,
      website,
      profileSongId,
      ...restProfile
    } = result.data;

    // Update user fields
    const userUpdate: Prisma.UserUpdateInput = {};
    if (displayName !== undefined) userUpdate.displayName = displayName;
    if (bio !== undefined) userUpdate.bio = bio;
    if (pronouns !== undefined) userUpdate.pronouns = pronouns;
    if (location !== undefined) userUpdate.location = location;
    if (website !== undefined) userUpdate.website = website || null;

    if (Object.keys(userUpdate).length > 0) {
      await db.user.update({
        where: { id: session.user.id },
        data: userUpdate,
      });
    }

    // Build profile update data
    const profileFields = Object.keys(restProfile);
    const hasProfileSong = profileSongId !== undefined;

    if (profileFields.length > 0 || hasProfileSong) {
      // Zod-validated data is safe; cast to satisfy Prisma's strict JSON types
      const profilePayload = { ...restProfile } as Record<string, unknown>;
      if (hasProfileSong) {
        profilePayload.profileSongId = profileSongId || null;
      }

      await db.userProfile.upsert({
        where: { userId: session.user.id },
        update: profilePayload as Prisma.UserProfileUncheckedUpdateInput,
        create: {
          userId: session.user.id,
          ...profilePayload,
        } as Prisma.UserProfileUncheckedCreateInput,
      });
    }

    const updated = await db.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
