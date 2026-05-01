export const CATEGORIES = ["ops", "sales", "marketing", "finance", "admin"] as const;
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
};

export const CATEGORY_LABEL: Record<Category, string> = {
  ops: "Ops",
  sales: "Sales",
  marketing: "Marketing",
  finance: "Finance",
  admin: "Admin",
};
