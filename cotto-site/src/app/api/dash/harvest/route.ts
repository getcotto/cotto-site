import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { requestHarvest, getHarvestState } from "@/lib/dash/harvest-requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: the "capture last meeting" button. Raises the pending flag; the in-app
// meeting-harvest listener picks it up within a few minutes and runs the real
// capture. Auth is the same dash_session-cookie-or-Bearer gate as the rest of the
// dash (the browser sends its cookie automatically).
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { since } = await requestHarvest();
  return NextResponse.json({ ok: true, since }, { status: 201 });
}

// GET: is a capture currently pending? (status/debug)
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const state = await getHarvestState();
  return NextResponse.json(state);
}
