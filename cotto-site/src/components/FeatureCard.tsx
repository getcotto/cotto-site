"use client";
import { ReactNode } from "react";

export default function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
        {icon}
      </div>
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-700">{children}</p>
    </div>
  );
}
