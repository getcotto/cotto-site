import { redirect } from "next/navigation";

// RETIRED 2026-09-12. /dash/week rendered the SAME cadence the daily Telegram push sends -- its own
// store header said so: "the SAME computed cadence the daily Telegram push sends, rendered on the dash
// as a read-only view." Two surfaces for one artifact is one more place to check and one more place to
// wonder whether you are looking at the current version. The push already reaches her phone, which is
// where she actually reads it.
//
// Redirect rather than delete so an existing bookmark lands somewhere useful instead of a 404.
export default function RetiredWeekPage() {
  redirect("/dash");
}
