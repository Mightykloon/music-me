import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await db.musicConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      providerUsername: true,
      isActive: true,
      isPrimary: true,
      connectedAt: true,
    },
    orderBy: [{ isPrimary: "desc" }, { connectedAt: "desc" }],
  });

  return NextResponse.json({ connections });
}
