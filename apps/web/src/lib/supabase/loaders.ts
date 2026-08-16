import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgendaEvent,
  BudgetCategory,
  BudgetEntry,
  HouseholdProfile,
  Note,
  ShoppingItem,
  Task,
  UsefulLink,
} from "@/lib/domain/types";
import { mapEventRow, sortEventsChronologically } from "@/lib/domain/agenda";
import { mapShoppingRow } from "./shopping";
import { mapTaskRow } from "./tasks";
import { mapNoteRow } from "./notes";
import { mapLinkRow } from "./links";
import { mapBudgetCategoryRow, mapBudgetEntryRow } from "./budget";
import {
  buildMonthlyEvolution,
  monthRangeEndingAt,
  BUDGET_EVOLUTION_MONTH_COUNT,
  type BudgetMonthlyEvolutionPoint,
} from "@/features/budget/budgetData";

/** Resolves the household the current user belongs to, or null if they have none (caller should redirect to onboarding). */
export async function loadCurrentUserHousehold(
  supabase: SupabaseClient,
  userId: string
): Promise<{ householdId: string } | null> {
  const { data: memberRows, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("[loaders] household_members query failed:", error.message);
    return null;
  }

  const memberRow = memberRows?.[0] ?? null;
  return memberRow ? { householdId: memberRow.household_id } : null;
}

/** Loads the household and its members, mapped to the HouseholdProfile UI shape. Null if the household doesn't exist. */
export async function loadHouseholdProfile(
  supabase: SupabaseClient,
  householdId: string,
  currentUserId: string
): Promise<HouseholdProfile | null> {
  const { data: household } = await supabase
    .from("households")
    .select("id, name, type, created_at, budget_share_count")
    .eq("id", householdId)
    .single();

  if (!household) return null;

  const { data: members } = await supabase
    .from("household_members")
    .select("id, user_id, display_name, role, initial, color")
    .eq("household_id", householdId);

  const createdAt = new Date(household.created_at);
  const createdAtLabel = `Depuis ${createdAt.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })}`;

  const currentUserIsAdmin = (members ?? []).some(
    (m) => m.user_id === currentUserId && m.role === "admin"
  );

  return {
    name: household.name,
    type: household.type as HouseholdProfile["type"],
    createdAtLabel,
    currentUserIsAdmin,
    members: (members ?? []).map((m) => ({
      id: m.id,
      name: m.display_name,
      role: m.role as "admin" | "member",
      initial: m.initial,
      color: m.color,
    })),
    budgetShareCount: household.budget_share_count ?? null,
  };
}

export async function loadShoppingItems(
  supabase: SupabaseClient,
  householdId: string
): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("id, label, quantity, done, assigned_to")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[loaders] shopping_items query failed:", error.message);
  }

  return (data ?? []).map(mapShoppingRow);
}

export async function loadTasks(supabase: SupabaseClient, householdId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_label, due_type, done, assigned_to")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[loaders] tasks query failed:", error.message);
  }

  return (data ?? []).map(mapTaskRow);
}

export async function loadNotes(supabase: SupabaseClient, householdId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, content, category, created_by")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[loaders] notes query failed:", error.message);
  }

  return (data ?? []).map(mapNoteRow);
}

export async function loadUsefulLinks(
  supabase: SupabaseClient,
  householdId: string
): Promise<UsefulLink[]> {
  const { data, error } = await supabase
    .from("useful_links")
    .select("id, title, url, category, icon, created_by")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[loaders] useful_links query failed:", error.message);
  }

  return (data ?? []).map(mapLinkRow);
}

export async function loadEvents(
  supabase: SupabaseClient,
  householdId: string,
  today: Date
): Promise<AgendaEvent[]> {
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_date, event_time, location, assigned_to")
    .eq("household_id", householdId)
    .gte("event_date", todayStr)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("[loaders] events query failed:", error.message);
  }

  const events = (data ?? [])
    .map((row) => mapEventRow(row, today))
    .filter((event): event is AgendaEvent => event !== null);

  return sortEventsChronologically(events);
}

export async function loadBudgetCategories(
  supabase: SupabaseClient,
  householdId: string
): Promise<BudgetCategory[]> {
  const { data, error } = await supabase
    .from("budget_categories")
    .select("id, parent_id, name, icon, sort_order")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[loaders] budget_categories query failed:", error.message);
  }

  return (data ?? []).map(mapBudgetCategoryRow);
}

export async function loadBudgetEntries(
  supabase: SupabaseClient,
  householdId: string,
  entryMonth: string
): Promise<BudgetEntry[]> {
  const { data, error } = await supabase
    .from("budget_entries")
    .select(
      "id, title, amount_cents, category_id, entry_date, entry_month, kind, note, created_by, recurring_expense_id"
    )
    .eq("household_id", householdId)
    .eq("entry_month", entryMonth)
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("[loaders] budget_entries query failed:", error.message);
  }

  return (data ?? []).map(mapBudgetEntryRow);
}

/**
 * Materializes any missing monthly-recurring occurrences for the household
 * across [fromMonth, toMonth] (both "YYYY-MM-01") — must run before
 * loadBudgetEntries/loadBudgetEvolution below, otherwise a month that was
 * never manually opened before would be undercounted (issue #105).
 *
 * Fails closed: if the RPC errors, this throws rather than logging and
 * continuing. Swallowing the error would let the server load proceed as if
 * materialization succeeded, silently rendering an incomplete household
 * budget — a visible load failure here is preferable to that. Matches
 * ensureBudgetRecurringOccurrences() in lib/supabase/budget.ts, which
 * already throws on the client for the same reason.
 */
export async function ensureBudgetRecurringOccurrences(
  supabase: SupabaseClient,
  householdId: string,
  fromMonth: string,
  toMonth: string
): Promise<void> {
  const { error } = await supabase.rpc("ensure_budget_recurring_occurrences", {
    target_household_id: householdId,
    from_month: fromMonth,
    to_month: toMonth,
  });

  if (error) {
    console.error("[loaders] ensure_budget_recurring_occurrences failed:", error.message);
    throw new Error(`Failed to materialize recurring budget occurrences: ${error.message}`);
  }
}

/** Per-month spending totals for the `monthCount` months ending at (and including) `month`, used by the monthly evolution chart. */
export async function loadBudgetEvolution(
  supabase: SupabaseClient,
  householdId: string,
  month: string,
  monthCount: number = BUDGET_EVOLUTION_MONTH_COUNT
): Promise<BudgetMonthlyEvolutionPoint[]> {
  const months = monthRangeEndingAt(month, monthCount);

  const { data, error } = await supabase
    .from("budget_entries")
    .select("entry_month, amount_cents")
    .eq("household_id", householdId)
    .gte("entry_month", months[0])
    .lte("entry_month", months[months.length - 1]);

  if (error) {
    console.error("[loaders] budget_entries range query failed:", error.message);
  }

  const rows = (data ?? []).map((row) => ({
    entryMonth: row.entry_month as string,
    amountCents: row.amount_cents as number,
  }));

  return buildMonthlyEvolution(months, rows);
}
