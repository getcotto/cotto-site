"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setStatus("Thanks! We received your message.");
      }}
    >
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 bg-white" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input type="email" className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 bg-white" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Message (optional)</label>
        <textarea className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 bg-white" rows={4} />
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md bg-[color:var(--cotto-red)] text-white px-6 py-3 text-base font-medium hover:opacity-90"
        data-analytics="cta_click"
      >
        Send
      </button>
      {status && <p className="text-sm text-black/70">{status}</p>}
    </form>
  );
}
