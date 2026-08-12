import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import {
  enqueueRequest,
  getQueueState,
  getResult,
  type FocusRequestType,
  type FocusEventInput,
} from "@/lib/dash/focus-requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_TYPES: FocusRequestType[] = ["refresh", "regenerate", "push_to_gmail", "create_calendar_event"];

// Validate + normalize the event payload for a create_calendar_event request. Returns
// null if the essentials are missing.
function parseEvent(raw: unknown): FocusEventInput | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const title = typeof e.title === "string" ? e.title.trim() : "";
  const startISO = typeof e.startISO === "string" ? e.startISO.trim() : "";
  if (!title || !startISO || Number.isNaN(Date.parse(startISO))) return null;
  const durationMin = Number.isFinite(e.durationMin) ? Math.max(5, Math.min(480, Number(e.durationMin))) : 30;
  const attendees = Array.isArray(e.attendees)
    ? e.attendees.filter((a): a is string => typeof a === "string" && a.includes("@")).slice(0, 50)
    : [];
  return { title, startISO, durationMin, attendees, addZoom: !!e.addZoom };
}

// POST: enqueue a Focus workbench request (refresh / regenerate / push_to_gmail).
// Auth is the same session-cookie-or-Bearer gate as the rest of the dash — the
// browser sends its dash_session cookie automatically. Returns the request id so the
// UI can poll GET for its status.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { type?: string; itemId?: string; feedback?: string; event?: unknown };
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
  if ((type === "regenerate" || type === "push_to_gmail" || type === "create_calendar_event") && !body.itemId) {
    return NextResponse.json({ error: `${type} requires itemId` }, { status: 400 });
  }
  let event: FocusEventInput | undefined;
  if (type === "create_calendar_event") {
    const parsed = parseEvent(body.event);
    if (!parsed) return NextResponse.json({ error: "create_calendar_event requires a valid event (title, startISO)" }, { status: 400 });
    event = parsed;
  }
  const feedback = typeof body.feedback === "string" ? body.feedback.slice(0, 4000) : undefined;
  const request = await enqueueRequest({ type, itemId: body.itemId, feedback, event });
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
