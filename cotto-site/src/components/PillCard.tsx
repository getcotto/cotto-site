"use client";
import { ReactNode } from "react";

export default function PillCard({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      {icon ? <span className="text-neutral-600">{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}
