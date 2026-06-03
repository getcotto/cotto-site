import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dilution/auth";
import { CALCULATOR_HTML } from "@/lib/dilution/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves the self-contained calculator document, but only to a request that
// carries the dilution_session cookie. Kept out of /public so the file itself
// is never directly reachable without the gate.
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return new NextResponse(CALCULATOR_HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
