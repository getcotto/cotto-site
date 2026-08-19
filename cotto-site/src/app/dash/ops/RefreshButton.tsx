"use client";

import { useState } from "react";

// On-demand refresh: POSTs to /api/dash/refresh (dispatches the capture sweep to regenerate from canonical),
// then reloads the page after the sweep has had time to republish. Honest states — never a fake "done".
export default function RefreshButton() {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function refresh() {
    setState("working");
    setMsg("");
    try {
      const res = await fetch("/api/dash/refresh", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        // Regenerate dispatched; the sweep republishes in ~1-2 min, then reload to render the new snapshot.
        setMsg("Regenerating from canonical — reloading in ~90s…");
        setTimeout(() => window.location.reload(), 90_000);
        return;
      }
      // Dispatch couldn't run (token missing/misscoped). Still USEFUL: reload to show the latest publish
      // (the sweep already refreshes 4×/day). Say plainly why a full regenerate didn't fire.
      setState("error");
      setMsg(
        res.status === 503
          ? "Showing latest — on-demand regenerate needs GH_DISPATCH_TOKEN in Vercel. Reloading…"
          : "Showing latest — regenerate token needs Actions:write on cotto-spine. Reloading…",
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      // Network/endpoint error — fall back to a plain reload so the button always does something.
      setMsg("Reloading latest…");
      setTimeout(() => window.location.reload(), 800);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={refresh}
        disabled={state === "working"}
        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
      >
        {state === "working" ? "Refreshing…" : "↻ Refresh"}
      </button>
      {msg && <span className={`text-xs ${state === "error" ? "text-red-600" : "text-neutral-500"}`}>{msg}</span>}
    </span>
  );
}
