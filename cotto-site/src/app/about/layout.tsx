import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — COTTO",
  description: "COTTO elevates cottage cheese dips with clean ingredients, protein-forward recipes, and familiar flavors with a modern twist.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
