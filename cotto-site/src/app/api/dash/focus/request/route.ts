import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import {
  enqueueRequest,
  getQueueState,
  getResult,
  type FocusRequestType,
} from "@/lib/dash/focus-requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_TYPES: FocusRequestType[] = ["refresh", "regenerate", "push_to_gmail"];

// POST: enqueue a Focus workbench request (refresh / regenerate / push_to_gmail).
// Auth is the same session-cookie-or-Bearer gate as the rest of the dash — the
// browser sends its dash_session cookie automatically. Returns the request id so the
// UI can poll GET for its status.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { type?: string; itemId?: string; feedback?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const type = body?.type as FocusRequestType | undefined;
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  // Item-scoped requests need an itemId; refresh is global.
  if ((type === "regenerate" || type === "push_to_gmail") && !body.itemId) {
    return NextResponse.json({ error: `${type} requires itemId` }, { status: 400 });
  }
  const feedback = typeof body.feedback === "string" ? body.feedback.slice(0, 4000) : undefined;
  const request = await enqueueRequest({ type, itemId: body.itemId, feedback });
  return NextResponse.json({ ok: true, request }, { status: 201 });
}

// GET: poll status. With ?id=<requestId> returns that request's status; otherwise
// returns the whole queue state (pending depth + recent statuses).
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const status = await getResult(id);
    if (!status) return NextResponse.json({ status: null }, { status: 200 });
    return NextResponse.json({ status });
  }
  const state = await getQueueState();
  return NextResponse.json(state);
}
