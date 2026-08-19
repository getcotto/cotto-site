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
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState("error");
        setMsg(data.error || "Refresh failed.");
        return;
      }
      // The sweep regenerates + republishes in ~1-2 min; reload then so the new snapshot renders.
      setMsg("Regenerating from canonical…");
      setTimeout(() => window.location.reload(), 90_000);
    } catch (e) {
      setState("error");
      setMsg((e as Error).message);
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
