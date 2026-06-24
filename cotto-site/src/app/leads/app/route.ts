import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dilution/auth";
import { LEADS_HTML } from "@/lib/leads/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves the self-contained booth tool, but only to a request carrying the
// session cookie. Kept out of /public so the file is never reachable ungated.
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return new NextResponse(LEADS_HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
