import { createClient } from "./client";
import type { BudgetCategory, BudgetEntry, BudgetEntryKind } from "@/lib/domain/types";

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
}

const BUDGET_ENTRY_COLUMNS =
  "id, title, amount_cents, category_id, entry_date, entry_month, kind, note, created_by";

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
