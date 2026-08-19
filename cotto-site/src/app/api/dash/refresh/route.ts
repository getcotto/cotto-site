import { NextResponse } from "next/server";

// POST /api/dash/refresh — on-demand dashboard refresh. Dispatches the cotto-spine "capture sweep"
// GitHub Action, which re-runs the engines against the canonical spine and republishes the ops
// snapshot. So the "Refresh" button regenerates from source, not just a page reload of the last publish.
//
// Needs GH_DISPATCH_TOKEN in the Vercel env (a fine-grained PAT with Actions:write on getcotto/cotto-spine
// — the SAME token the Telegram webhook uses). Without it, returns 503 with a clear message so the button
// can say "not wired yet" instead of failing silently.
export async function POST() {
  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "GH_DISPATCH_TOKEN not set — add it in Vercel to enable on-demand refresh." },
      { status: 503 },
    );
  }
  try {
    const res = await fetch(
      "https://api.github.com/repos/getcotto/cotto-spine/actions/workflows/capture-sweep.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: "main" }),
      },
    );
    if (res.status === 204) {
      // The sweep takes ~1-2 min to regenerate + republish. The client polls updatedAt to know when it lands.
      return NextResponse.json({ ok: true, message: "Refresh started — regenerating from canonical, ~1-2 min." });
    }
    const body = await res.text();
    return NextResponse.json({ ok: false, error: `GitHub dispatch failed (${res.status}): ${body.slice(0, 200)}` }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
