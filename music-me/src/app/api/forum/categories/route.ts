import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.forumCategory.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { threads: true } },
          },
        },
        _count: { select: { threads: true } },
      },
    });

    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
