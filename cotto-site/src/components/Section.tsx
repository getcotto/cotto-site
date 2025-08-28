"use client";
import { ReactNode } from "react";

export default function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`mx-auto w-full max-w-[68rem] px-6 sm:px-8 ${className}`}>
      {children}
    </section>
  );
}
