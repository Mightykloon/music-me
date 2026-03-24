import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkSchema } from "@/lib/auth/validation";
import { containsProfanity } from "@/lib/utils/profanity";

// GET - list user's links
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await db.link.findMany({
    where: { userId: session.user.id },
    orderBy: { displayOrder: "asc" },
  });

  return NextResponse.json({ links });
}

// POST - create a new link
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = linkSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  if (containsProfanity(result.data.title)) {
    return NextResponse.json(
      { error: "Link title contains inappropriate content" },
      { status: 400 }
    );
  }

  // Limit to 20 links
  const count = await db.link.count({ where: { userId: session.user.id } });
  if (count >= 20) {
    return NextResponse.json(
      { error: "Maximum 20 links allowed" },
      { status: 400 }
    );
  }

  const link = await db.link.create({
    data: {
      userId: session.user.id,
      title: result.data.title,
      url: result.data.url,
      iconType: result.data.iconType ?? null,
      displayOrder: count,
    },
  });

  return NextResponse.json({ link }, { status: 201 });
}

// PUT - reorder all links
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkIds } = await request.json();
  if (!Array.isArray(linkIds)) {
    return NextResponse.json({ error: "linkIds must be an array" }, { status: 400 });
  }

  // Update order for each link
  await Promise.all(
    linkIds.map((id: string, index: number) =>
      db.link.updateMany({
        where: { id, userId: session.user!.id },
        data: { displayOrder: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
