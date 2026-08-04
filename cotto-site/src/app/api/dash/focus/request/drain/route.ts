import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { drainRequests } from "@/lib/dash/focus-requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: the LOCAL worker claims the whole pending backlog. drainRequests() LPOPs
// every request off dash:focus:requests (FIFO) and flips each to "working" in the
// results hash, so the UI immediately reflects that the worker picked it up. Returns
// the claimed requests for the worker to process. There is no request body.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const requests = await drainRequests();
  return NextResponse.json({ ok: true, requests });
}
