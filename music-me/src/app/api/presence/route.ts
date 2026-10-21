import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { guard } from "@/lib/api-guard";
import { touchPresence } from "@/lib/presence";

/** POST: heartbeat from an open tab, marking the signed-in user as online. */
export async function POST(request: Request) {
  const blocked = await guard(request, "presence", { limit: 10, windowSec: 60, requireAuth: true });
  if (blocked) return blocked;
  const session = await auth();
  await touchPresence(session!.user!.id!);
  return new NextResponse(null, { status: 204 });
}
