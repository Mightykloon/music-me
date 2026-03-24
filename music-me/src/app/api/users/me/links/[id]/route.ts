import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkSchema } from "@/lib/auth/validation";
import { containsProfanity } from "@/lib/utils/profanity";

// PATCH - update a link
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const result = linkSchema.partial().safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  if (result.data.title && containsProfanity(result.data.title)) {
    return NextResponse.json(
      { error: "Link title contains inappropriate content" },
      { status: 400 }
    );
  }

  const link = await db.link.updateMany({
    where: { id, userId: session.user.id },
    data: result.data,
  });

  if (link.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// DELETE - remove a link
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const link = await db.link.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (link.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
