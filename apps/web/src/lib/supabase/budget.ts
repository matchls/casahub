import { createClient } from "./client";
import type { BudgetCategory, BudgetEntry, BudgetEntryKind, BudgetEntryRecurrence } from "@/lib/domain/types";

export interface BudgetCategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  icon: string;
  sort_order: number;
}

export function mapBudgetCategoryRow(row: BudgetCategoryRow): BudgetCategory {
  return {
    id: row.id,
    parentId: row.parent_id ?? undefined,
    name: row.name,
    icon: row.icon,
    sortOrder: row.sort_order,
  };
}

export interface BudgetEntryRow {
  id: string;
  title: string;
  amount_cents: number;
  category_id: string | null;
  entry_date: string;
  entry_month: string;
  kind: string;
  note: string | null;
  created_by: string | null;
  recurring_expense_id: string | null;
}

const BUDGET_ENTRY_COLUMNS =
  "id, title, amount_cents, category_id, entry_date, entry_month, kind, note, created_by, recurring_expense_id";

export function mapBudgetEntryRow(row: BudgetEntryRow): BudgetEntry {
  return {
    id: row.id,
    title: row.title,
    amountCents: row.amount_cents,
    categoryId: row.category_id ?? undefined,
    entryDate: row.entry_date,
    entryMonth: row.entry_month,
    kind: row.kind as BudgetEntryKind,
    note: row.note ?? undefined,
    createdBy: row.created_by ?? undefined,
    recurringExpenseId: row.recurring_expense_id ?? undefined,
  };
}

/** First-of-month Postgres `date` string ("YYYY-MM-01") for the given day. */
export function toEntryMonth(entryDate: string): string {
  return `${entryDate.slice(0, 7)}-01`;
}

/**
 * Ensures the household's default budget category tree exists. Safe to call
 * every time the Budget page loads — the underlying RPC is idempotent and
 * becomes a no-op once categories exist.
 */
export async function ensureDefaultBudgetCategories(householdId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("ensure_default_budget_categories", {
    target_household_id: householdId,
  });
  if (error) throw new Error(error.message);
}

/** Re-fetches entries for a given budget month, used when the user switches months client-side. */
export async function fetchBudgetEntriesForMonth(
  householdId: string,
  entryMonth: string
): Promise<BudgetEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budget_entries")
    .select(BUDGET_ENTRY_COLUMNS)
    .eq("household_id", householdId)
    .eq("entry_month", entryMonth)
    .order("entry_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBudgetEntryRow);
}

export interface BudgetMonthTotalRow {
  entryMonth: string;
  amountCents: number;
}

/**
 * Fetches only { entry_month, amount_cents } for entries within an inclusive
 * month range — used to build the monthly evolution chart, which only needs
 * per-month sums, not full entry details. Kept separate from
 * fetchBudgetEntriesForMonth (which returns full BudgetEntry rows for a
 * single month) to avoid pulling title/note/kind/etc. across several months
 * just to add them up.
 */
export async function fetchBudgetEntriesForMonthRange(
  householdId: string,
  startMonth: string,
  endMonth: string
): Promise<BudgetMonthTotalRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budget_entries")
    .select("entry_month, amount_cents")
    .eq("household_id", householdId)
    .gte("entry_month", startMonth)
    .lte("entry_month", endMonth);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ entryMonth: row.entry_month, amountCents: row.amount_cents }));
}

export interface BudgetEntryInput {
  title: string;
  amountCents: number;
  categoryId?: string;
  entryDate: string;
  kind: BudgetEntryKind;
  note?: string;
}

export async function addBudgetEntry(
  householdId: string,
  input: BudgetEntryInput
): Promise<BudgetEntryRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budget_entries")
    .insert({
      household_id: householdId,
      category_id: input.categoryId ?? null,
      title: input.title,
      amount_cents: input.amountCents,
      entry_date: input.entryDate,
      entry_month: toEntryMonth(input.entryDate),
      kind: input.kind,
      note: input.note || null,
    })
    .select(BUDGET_ENTRY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateBudgetEntry(
  id: string,
  input: BudgetEntryInput
): Promise<BudgetEntryRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budget_entries")
    .update({
      category_id: input.categoryId ?? null,
      title: input.title,
      amount_cents: input.amountCents,
      entry_date: input.entryDate,
      entry_month: toEntryMonth(input.entryDate),
      kind: input.kind,
      note: input.note || null,
    })
    .eq("id", id)
    .select(BUDGET_ENTRY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBudgetEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("budget_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Create-only extension of BudgetEntryInput: recurrence ("Ponctuelle" vs
 * "Mensuelle") only ever matters at creation time (issue #105) — editing an
 * existing occurrence never converts it into/out of a recurring series, so
 * updateBudgetEntry() intentionally keeps taking the plain BudgetEntryInput.
 */
export interface CreateBudgetEntryInput extends BudgetEntryInput {
  recurrence: BudgetEntryRecurrence;
}

/**
 * Atomically creates a monthly recurring series and its first occurrence
 * (see create_recurring_budget_expense in supabase/budget_recurring_expenses.sql).
 * The requested day-of-month and start month are both derived from
 * input.entryDate, matching how BudgetEntryForm collects a single date for
 * a "Mensuelle" entry. Returns the created occurrence row so callers can
 * feed it through mapBudgetEntryRow() exactly like addBudgetEntry().
 */
export async function createRecurringBudgetExpense(
  householdId: string,
  input: BudgetEntryInput
): Promise<BudgetEntryRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc("create_recurring_budget_expense", {
      target_household_id: householdId,
      target_category_id: input.categoryId ?? null,
      target_title: input.title,
      target_amount_cents: input.amountCents,
      target_kind: input.kind,
      target_note: input.note || null,
      target_recurrence_day: Number(input.entryDate.slice(8, 10)),
      target_start_month: toEntryMonth(input.entryDate),
    })
    .select(BUDGET_ENTRY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Materializes any missing occurrences for every recurring series in the
 * household across [fromMonth, toMonth] (inclusive, both "YYYY-MM-01").
 * Idempotent and safe to call before every read that depends on recurring
 * occurrences being present — initial load, month switch, and the 6-month
 * evolution range — per issue #105's "materialize before totals are read"
 * requirement.
 */
export async function ensureBudgetRecurringOccurrences(
  householdId: string,
  fromMonth: string,
  toMonth: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("ensure_budget_recurring_occurrences", {
    target_household_id: householdId,
    from_month: fromMonth,
    to_month: toMonth,
  });
  if (error) throw new Error(error.message);
}

/**
 * Deletes a single recurring occurrence and durably marks its (series,
 * month) as skipped, so the next ensureBudgetRecurringOccurrences call never
 * recreates it — future months keep generating normally. Must be used
 * instead of deleteBudgetEntry() for any entry with a recurringExpenseId; a
 * plain delete would leave the month looking merely "not yet generated".
 */
export async function deleteRecurringBudgetOccurrence(entryId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("delete_recurring_budget_occurrence", {
    target_entry_id: entryId,
  });
  if (error) throw new Error(error.message);
}
