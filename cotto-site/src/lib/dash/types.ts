/**
 * To-do schema for /dash.
 *
 * Rebuilt 2026-09-12 to match the list Kendall actually keeps and trusts (OneNote,
 * headed "w/o 9/14"). Her format, which this now mirrors:
 *   - grouped by AREA OF THE BUSINESS, not by urgency lane
 *   - items are 3 to 8 words ("Order new labels", "Chase FK credit")
 *   - parent items nest children ("Follow ups:" -> FD, Wegmans, Citarella)
 *   - bold marks the one or two that matter this week
 *   - NO system/automation flags. Her words: those "have been clouding the dash."
 *
 * The old shape grouped by ops/sales/samples/marketing/finance/admin and let the
 * harvesters write multi-sentence memos with parenthetical sourcing, e.g. a 300-char
 * item whose actual action was its first six words. `why` exists to hold that tail so
 * the lede can be the task.
 */

// Kendall's own sections, in her own order. `admin` is not one of hers; it is the
// landing bucket for legacy items and anything genuinely uncategorisable.
export const CATEGORIES = [
  "hiring",
  "ops",
  "formulation",
  "sales",
  "events",
  "marketing",
  "finance",
  "legal",
  "investors",
  "admin",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  hiring: "Hiring",
  ops: "Ops",
  formulation: "Formulation",
  sales: "Sales",
  events: "Events",
  marketing: "Marketing & Socials",
  finance: "Finance",
  legal: "Legal",
  investors: "Investors",
  admin: "Admin",
};

/** Retired categories -> where their items land now. Applied on read, see migrateTodo. */
export const LEGACY_CATEGORY_MAP: Record<string, Category> = {
  samples: "sales",
};

export const SOURCES = ["kendall", "claude", "digest"] as const;
export type Source = (typeof SOURCES)[number];

/**
 * "task"   = Kendall's work. This is the list.
 * "system" = automation plumbing (reconcile hints, fix:X3 flags, stuck-run notices).
 *            Real, but it is not her to-do list and must not share a surface with it.
 */
export const KINDS = ["task", "system"] as const;
export type Kind = (typeof KINDS)[number];

export type TodoItem = {
  id: string;
  /** The action, and only the action. Short enough to scan. */
  text: string;
  /** The reasoning, sourcing, and context that used to be jammed into `text`. */
  why?: string;
  category: Category;
  priority: boolean;
  done: boolean;
  createdAt: string;
  doneAt?: string;
  note?: string;
  source: Source;
  kind?: Kind;
  /** Parent item id, for nested follow-up lists. One level only, on purpose. */
  parentId?: string;
  // Optional link back to the email thread this to-do was captured from on the Focus
  // board. All optional so existing to-dos deserialize unchanged.
  threadId?: string;
  threadUrl?: string;
  who?: string;
};

/** Past this, an item has stopped being a task and started being a memo. */
export const TEXT_SOFT_LIMIT = 90;

/**
 * Split a memo-shaped item into an action and its reasoning.
 *
 * The harvesters write things like:
 *   "Send or kill the 8/4 draft to brad.cuthbert@kemps.com (...) - it has sat unsent
 *    for 5+ weeks, ... (from the 9/11 Eric catch-up)"
 * where the task is the first six words and the remaining fifty are the harvester
 * justifying itself. Splitting on the first " - " / " — " recovers the lede without
 * losing anything: the tail moves to `why`, it does not get deleted.
 *
 * Only fires above TEXT_SOFT_LIMIT so genuinely short items with a hyphen are left alone.
 */
export function splitLede(text: string): { text: string; why?: string } {
  const t = text.trim();
  if (t.length <= TEXT_SOFT_LIMIT) return { text: t };

  // Separators the writers actually use, in the order they appear. " - " and the
  // dashes introduce reasoning; ":" and ";" introduce a detail list or an aside.
  // Earliest qualifying split wins, so the lede stays the action.
  const SEPARATORS = [/\s[-–—]\s/, /:\s/, /;\s/];
  let best: { lede: string; why: string } | null = null;
  for (const re of SEPARATORS) {
    const m = t.match(re);
    if (!m || m.index === undefined) continue;
    const lede = t.slice(0, m.index).trim();
    const why = t.slice(m.index + m[0].length).trim();
    // A very short lede is a fragment, not a task. 15 is calibrated to Kendall's own
    // list, where "Order new labels" (16) and "Chase FK credit" (15) are complete
    // items — a higher floor rejects perfectly good tasks like "Run R&D bench tests".
    // A lede still far over the limit has not been helped; an empty tail means there
    // was nothing to move.
    if (lede.length < 15 || !why || lede.length > TEXT_SOFT_LIMIT * 2) continue;
    if (!best || lede.length < best.lede.length) best = { lede, why };
  }
  return best ? { text: best.lede, why: best.why } : { text: t };
}

/**
 * Bring a stored item up to the current shape. Applied on every read so no
 * migration job has to run and nothing breaks if one is missed.
 */
export function migrateTodo(raw: TodoItem): TodoItem {
  const it: TodoItem = { ...raw };

  const mapped = LEGACY_CATEGORY_MAP[it.category as string];
  if (mapped) it.category = mapped;
  if (!CATEGORIES.includes(it.category)) it.category = "admin";

  // System plumbing was never tagged, so recognise it by the shape the writers use:
  // a "[fix:...]" note, or a note telling her to run a script.
  if (!it.kind) {
    const note = it.note ?? "";
    it.kind = /^\[fix:/.test(note) || /·\s*run:\s*node /.test(note) ? "system" : "task";
  }

  if (!it.why) {
    const split = splitLede(it.text);
    it.text = split.text;
    if (split.why) it.why = split.why;
  }

  return it;
}
