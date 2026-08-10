export const CATEGORIES = ["ops", "sales", "samples", "marketing", "finance", "admin"] as const;
export type Category = (typeof CATEGORIES)[number];

export const SOURCES = ["kendall", "claude", "digest"] as const;
export type Source = (typeof SOURCES)[number];

export type TodoItem = {
  id: string;
  text: string;
  category: Category;
  priority: boolean;
  done: boolean;
  createdAt: string;
  doneAt?: string;
  note?: string;
  source: Source;
  // Optional link back to the email thread this to-do was captured from on the Focus
  // board. All optional so existing to-dos deserialize unchanged.
  threadId?: string;
  threadUrl?: string;
  who?: string;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  ops: "Ops",
  sales: "Sales",
  samples: "Samples",
  marketing: "Marketing",
  finance: "Finance",
  admin: "Admin",
};
