import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { optionId } = await request.json();
    if (!optionId) {
      return NextResponse.json(
        { error: "Option ID required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify poll and option
    const poll = await db.poll.findUnique({
      where: { id },
      include: { options: { select: { id: true } } },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (new Date(poll.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Poll has expired" }, { status: 400 });
    }

    if (!poll.options.some((o) => o.id === optionId)) {
      return NextResponse.json(
        { error: "Invalid option" },
        { status: 400 }
      );
    }

    // Check if already voted (if not allowMultiple)
    if (!poll.allowMultiple) {
      const existingVote = await db.pollVote.findFirst({
        where: {
          userId,
          option: { pollId: id },
        },
      });
      if (existingVote) {
        return NextResponse.json(
          { error: "Already voted" },
          { status: 409 }
        );
      }
    }

    // Check duplicate on same option
    const duplicateVote = await db.pollVote.findUnique({
      where: {
        pollOptionId_userId: { pollOptionId: optionId, userId },
      },
    });
    if (duplicateVote) {
      return NextResponse.json(
        { error: "Already voted for this option" },
        { status: 409 }
      );
    }

    await db.pollVote.create({
      data: { pollOptionId: optionId, userId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
