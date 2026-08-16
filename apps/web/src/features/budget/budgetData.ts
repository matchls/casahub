import type { BudgetCategory, BudgetEntry, BudgetEntryKind, BudgetEntryRecurrence } from "@/lib/domain/types";

/** Width of the monthly evolution window — shared so the server loader (loaders.ts) and the recurring-occurrence materialization range it depends on can never silently drift apart. */
export const BUDGET_EVOLUTION_MONTH_COUNT = 6;

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

/** Last calendar day of the month containing `entryDate` ("YYYY-MM-DD"), as an ISO date string — used to bound the date input when editing a recurring occurrence (issue #105: it may move within its month, never to another one). */
export function lastDayOfBudgetMonth(entryDate: string): string {
  const [year, monthIndex] = entryDate.slice(0, 7).split("-").map(Number);
  const lastDay = new Date(year, monthIndex, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
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

/**
 * Equal share of a total across `shareCount` Budget shares, in cents.
 * Informational only — it does not track who actually paid. `shareCount` is
 * the household's effective Budget share count (issue #109): either an
 * explicitly configured "parts" value, or (by default) the active household
 * member count — see resolveBudgetShareCount(). Returns null (rather than
 * NaN/Infinity) when `shareCount` is missing or invalid, so callers can omit
 * the "Par personne" line entirely instead of rendering a bogus figure.
 */
export function calculatePerPersonCents(totalCents: number, shareCount: number): number | null {
  if (!Number.isFinite(totalCents) || !Number.isInteger(shareCount) || shareCount <= 0) {
    return null;
  }
  return Math.round(totalCents / shareCount);
}

/**
 * Resolves the household's effective Budget share count ("parts", issue
 * #109): the explicitly saved value if one has ever been set, otherwise the
 * active household member count — so a household that never touches the
 * setting keeps behaving exactly as before (e.g. an existing couple
 * automatically behaves as 2 parts). Floors at 1 so a household with zero
 * active members (edge case, never expected in steady state) still yields a
 * usable divisor. This is the single source of truth for the fallback — call
 * it once and thread the result through, rather than re-deriving it in every
 * component that needs a "Par personne" figure.
 */
export function resolveBudgetShareCount(
  explicitShareCount: number | null | undefined,
  activeMemberCount: number
): number {
  if (Number.isInteger(explicitShareCount) && (explicitShareCount as number) >= 1) {
    return explicitShareCount as number;
  }
  return Math.max(1, activeMemberCount);
}

export const KIND_LABELS: Record<BudgetEntryKind, string> = {
  fixed: "Fixe",
  variable: "Variable",
};

export const RECURRENCE_LABELS: Record<BudgetEntryRecurrence, string> = {
  once: "Ponctuelle",
  monthly: "Mensuelle",
};

/**
 * Scope a member picks when editing or deleting a recurring occurrence
 * (issue #110): "occurrence" reuses the existing issue #105 single-month
 * behaviour exactly; "series" reaches the whole series from the selected
 * month onward. Shared between edit and delete since both mutations are
 * anchored the same way (on the occurrence the member started from) even
 * though their server-side effects differ (edit rewrites values, delete
 * stops future generation).
 */
export type BudgetSeriesScope = "occurrence" | "series";

export const EDIT_SCOPE_LABELS: Record<BudgetSeriesScope, string> = {
  occurrence: "Ce mois uniquement",
  series: "Ce mois et les suivants",
};

export const DELETE_SCOPE_LABELS: Record<BudgetSeriesScope, string> = {
  occurrence: "Ce mois uniquement",
  series: "Arrêter à partir de ce mois",
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
 * Turns per-category totals into display slices against a shared
 * denominator, rounding each share with Math.round(amount/total*100).
 * Shared by buildBudgetBreakdown and buildSubcategoryBreakdown so both the
 * monthly overview donut and the category drill-down donut always round
 * percentages identically instead of risking two copies drifting apart.
 */
function toBreakdownSlices(
  targets: BudgetCategory[],
  totals: Map<string, number>,
  totalCents: number
): BudgetBreakdownSlice[] {
  return targets.map((category) => {
    const amountCents = totals.get(category.id) ?? 0;
    const sharePercent = totalCents > 0 ? Math.round((amountCents / totalCents) * 100) : 0;
    return { category, amountCents, sharePercent };
  });
}

/**
 * Per-main-category totals + share for a set of entries (typically one
 * month), one slice per main category in sortOrder — including categories
 * with zero spending, so callers can decide whether to render or skip them.
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

  return toBreakdownSlices(mains, totals, totalCents);
}

/**
 * Per-subcategory totals + share within a single main category — used by
 * the category drill-down donut (issue #100). `entries` must already be
 * scoped to the selected main category (its subcategories AND any entries
 * attached directly to the main category itself, e.g. via BudgetScreen's
 * `visibleEntries`), so `totalCents` here is the same "total spending of
 * the selected main category" figure already shown in the drill-down
 * header — not the whole month's budget. That keeps percentages as
 * subcategory / category-total, per issue #100, never subcategory /
 * month-total.
 *
 * Entries attached directly to the main category (the "(général)" option
 * in BudgetEntryForm) share the main category's own id as their
 * categoryId. Those are represented as a synthetic "Général" slice
 * appended after the real subcategories — purely client-derived, never
 * persisted — so every cent counted in `totalCents` is also represented
 * by a slice: donut geometry, legend amounts and percentages always sum
 * to the full category total, and a category with only direct-to-main
 * spending renders that slice instead of the empty state.
 */
export function buildSubcategoryBreakdown(
  entries: BudgetEntry[],
  mainCategory: BudgetCategory,
  subcategories: BudgetCategory[]
): BudgetBreakdownSlice[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.categoryId) continue;
    totals.set(entry.categoryId, (totals.get(entry.categoryId) ?? 0) + entry.amountCents);
  }

  const totalCents = entries.reduce((sum, entry) => sum + entry.amountCents, 0);
  const generalSlice: BudgetCategory = {
    id: mainCategory.id,
    parentId: mainCategory.id,
    name: "Général",
    icon: "•",
    sortOrder: Number.MAX_SAFE_INTEGER,
  };
  const targets = [...subcategories].sort((a, b) => a.sortOrder - b.sortOrder);
  targets.push(generalSlice);

  return toBreakdownSlices(targets, totals, totalCents);
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
