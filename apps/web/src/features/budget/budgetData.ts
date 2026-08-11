import type { BudgetCategory, BudgetEntry, BudgetEntryKind } from "@/lib/domain/types";

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

/**
 * Default date for a new entry in the given budget month: today, if today
 * falls within that month, otherwise the first day of that month. Keeps
 * "add entry" defaulting to today while viewing the current month, but
 * defaulting into the selected month (not today) when browsing a past or
 * future month — otherwise a new entry added while viewing July would
 * silently land in whatever month today actually is.
 */
export function defaultBudgetEntryDate(month: string): string {
  const today = todayIsoDate();
  return today.slice(0, 7) === month.slice(0, 7) ? today : month;
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

/** "2026-08-01" -> "Août" — compact label for chart axes, unambiguous within any 6-month window. */
export function formatShortBudgetMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1, 1);
  const label = date.toLocaleDateString("fr-FR", { month: "short" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Returns `count` consecutive "YYYY-MM-01" month strings ending at (and
 * including) `month`, oldest first — e.g. monthRangeEndingAt("2026-08-01", 6)
 * covers March through August 2026.
 */
export function monthRangeEndingAt(month: string, count: number): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(shiftBudgetMonth(month, -i));
  }
  return months;
}

const CENTS_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatCents(amountCents: number): string {
  return CENTS_FORMATTER.format(amountCents / 100);
}

const CENTS_FORMATTER_COMPACT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Whole-euro formatting for tight spaces (chart bar labels) — display only, never used for stored amounts. */
export function formatCentsCompact(amountCents: number): string {
  return CENTS_FORMATTER_COMPACT.format(amountCents / 100);
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

export interface BudgetBreakdownSlice {
  category: BudgetCategory;
  amountCents: number;
  sharePercent: number;
}

/**
 * Per-main-category totals + share for a set of entries (typically one
 * month), one slice per main category in sortOrder — including categories
 * with zero spending, so callers can decide whether to render or skip them.
 * Uses the exact same rounding as the category cards
 * (Math.round(amount/total*100)) so displayed percentages always agree.
 * Entries with no category (or a deleted category) are excluded, matching
 * how the category cards only ever total actual main categories.
 */
export function buildBudgetBreakdown(
  entries: BudgetEntry[],
  categories: BudgetCategory[]
): BudgetBreakdownSlice[] {
  const lookup = buildMainCategoryLookup(categories);
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.categoryId) continue;
    const mainId = lookup.get(entry.categoryId);
    if (!mainId) continue;
    totals.set(mainId, (totals.get(mainId) ?? 0) + entry.amountCents);
  }

  const totalCents = entries.reduce((sum, entry) => sum + entry.amountCents, 0);
  const mains = categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  return mains.map((category) => {
    const amountCents = totals.get(category.id) ?? 0;
    const sharePercent = totalCents > 0 ? Math.round((amountCents / totalCents) * 100) : 0;
    return { category, amountCents, sharePercent };
  });
}

export interface BudgetMonthlyEvolutionPoint {
  month: string;
  amountCents: number;
}

/**
 * Sums arbitrary { entryMonth, amountCents } rows into one total per month
 * in `months`, defaulting to 0 for months with no entries. Takes a loose
 * row shape (not BudgetEntry) so both full month loads and the lighter
 * month-range fetch (entry_month + amount_cents only) can feed it directly.
 */
export function buildMonthlyEvolution(
  months: string[],
  entries: { entryMonth: string; amountCents: number }[]
): BudgetMonthlyEvolutionPoint[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.entryMonth, (totals.get(entry.entryMonth) ?? 0) + entry.amountCents);
  }
  return months.map((month) => ({ month, amountCents: totals.get(month) ?? 0 }));
}
