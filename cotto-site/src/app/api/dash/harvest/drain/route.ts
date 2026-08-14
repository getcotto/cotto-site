import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { claimHarvest } from "@/lib/dash/harvest-requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: the LOCAL in-app listener (cotto-meeting-harvest-listener scheduled task)
// claims a pending capture. Atomically reads + clears the flag, so the harvest runs
// exactly once per button press. Returns { pending, since }; when pending is true the
// listener runs the meeting-harvest. No request body.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const claim = await claimHarvest();
  return NextResponse.json({ ok: true, ...claim });
}
