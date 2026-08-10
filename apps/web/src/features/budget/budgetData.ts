import type { BudgetCategory, BudgetEntryKind } from "@/lib/domain/types";

/** Today's date, as the first-of-month Postgres `date` string ("YYYY-MM-01"). */
export function currentBudgetMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Today's date as an ISO "YYYY-MM-DD" string, for date-input defaults. */
export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Shifts a "YYYY-MM-01" month string by `delta` months (can be negative). */
export function shiftBudgetMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const shifted = new Date(year, monthIndex - 1 + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-01`;
}

/** "2026-08-01" -> "août 2026" */
export function formatBudgetMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1, 1);
  const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const CENTS_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatCents(amountCents: number): string {
  return CENTS_FORMATTER.format(amountCents / 100);
}

export const KIND_LABELS: Record<BudgetEntryKind, string> = {
  fixed: "Fixe",
  variable: "Variable",
};

export interface BudgetCategoryGroup {
  main: BudgetCategory;
  subcategories: BudgetCategory[];
}

/**
 * Groups the flat category list into main categories + their subcategories.
 * Grouping is done by parentId rather than relying on query order, since
 * main and subcategory sort_order values are independent sequences (both
 * start at 0) and would otherwise interleave when sorted as one flat list.
 */
export function groupBudgetCategories(categories: BudgetCategory[]): BudgetCategoryGroup[] {
  const mains = categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  return mains.map((main) => ({
    main,
    subcategories: categories
      .filter((c) => c.parentId === main.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

/**
 * Maps every category id (main or sub) to its main category id, so an
 * entry attached to a subcategory still counts toward its main category's
 * total. Main categories map to themselves.
 */
export function buildMainCategoryLookup(categories: BudgetCategory[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const category of categories) {
    map.set(category.id, category.parentId ?? category.id);
  }
  return map;
}
