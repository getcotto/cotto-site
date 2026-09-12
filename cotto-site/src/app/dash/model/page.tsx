import { redirect } from "next/navigation";

// RETIRED 2026-09-12. /dash/model was a surface nobody opened: the numbers it showed are on /dash/ops
// (on-hand, free-to-promise, cover) and in spine/PLAN_SUMMARY.md, both of which are engine-derived and
// maintained. Kendall's ask was ONE surface; this was the sixth.
//
// Redirect rather than delete so an existing bookmark lands somewhere useful instead of a 404.
export default function RetiredModelPage() {
  redirect("/dash/ops");
}
