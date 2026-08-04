import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { completeResult } from "@/lib/dash/focus-requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: the LOCAL worker reports the fate of a request it drained. Body:
//   { id, status: "done" | "error", message? }
// Marks that request's results row so the UI's poller can stop spinning and (on
// "done") re-pull the snapshot. The worker must have already written the item's new
// draft state into dash:focus:v1 BEFORE calling this with "done" (see contract).
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { id?: string; status?: string; message?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (body.status !== "done" && body.status !== "error") {
    return NextResponse.json({ error: 'status must be "done" or "error"' }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.slice(0, 4000) : undefined;
  await completeResult(id, body.status, message);
  return NextResponse.json({ ok: true });
}
