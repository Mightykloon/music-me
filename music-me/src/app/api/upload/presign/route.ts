import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  createPresignedUploadUrl,
  getAllowedTypes,
  getMaxSize,
  type UploadCategory,
} from "@/lib/storage";

const presignSchema = z.object({
  category: z.enum(["avatars", "banners", "backgrounds", "posts", "misc"]),
  contentType: z.string(),
  fileSize: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = presignSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { category, contentType, fileSize } = result.data;
    const cat = category as UploadCategory;

    const allowedTypes = getAllowedTypes(cat);
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const maxSize = getMaxSize(cat);
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    const { uploadUrl, publicUrl, key } = await createPresignedUploadUrl(
      cat,
      contentType,
      session.user.id
    );

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
