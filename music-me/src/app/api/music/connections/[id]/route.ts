import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const connection = await db.musicConnection.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.musicConnection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
