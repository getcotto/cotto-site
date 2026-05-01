"use client";

import { useState } from "react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dash/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Login failed");
        setBusy(false);
        return;
      }
      window.location.href = "/dash";
    } catch {
      setError("Network error");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border border-black/10 rounded-2xl p-6 shadow-sm"
      >
        <h1 className="font-display text-2xl text-cotto-red mb-1">dash</h1>
        <p className="text-sm text-cotto-red/70 mb-4">Private to-do list.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-cotto-red placeholder-cotto-red/40 focus:outline-none focus:border-cotto-red"
        />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-cotto-red text-white py-2 font-medium disabled:opacity-50"
        >
          {busy ? "..." : "Open"}
        </button>
      </form>
    </div>
  );
}
