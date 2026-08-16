/** A household member's id (matches `household_members.id` in Supabase). */
export type MemberId = string;

export interface ShoppingItem {
  id: string;
  label: string;
  quantity?: number;
  done: boolean;
  assignedTo?: MemberId;
}

/** Alias matching the issue's domain language. */
export type CourseItem = ShoppingItem;

export type DueType = "date" | "recurrence" | "none";

export interface Task {
  id: string;
  title: string;
  dueLabel: string;
  dueType: DueType;
  done: boolean;
  assignedTo?: MemberId;
}

export type ItemType = "event" | "task" | "shopping" | "reminder";
export type AgendaGroup = "today" | "tomorrow" | "this_week" | "next_week" | "later";

export interface TimelineItem {
  id: string;
  type: ItemType;
  title: string;
  time?: string;
  location?: string;
  assignedTo?: MemberId;
}

export interface AgendaEvent {
  id: string;
  type: ItemType;
  title: string;
  /** Raw Postgres `date` string ("YYYY-MM-DD") — dayAbbr/dayNum are derived display values that drop month/year, so this is the only field that can round-trip into a date input. */
  eventDate: string;
  dayAbbr: string;
  dayNum: number;
  time?: string;
  location?: string;
  assignedTo?: MemberId;
  group: AgendaGroup;
}

export type NoteCategory = "wifi" | "codes" | "numbers" | "ideas";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdBy?: MemberId;
}

export type LinkCategory = "home" | "health" | "documents" | "admin" | "services" | "ideas";

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  category: LinkCategory;
  icon: string;
  createdBy?: MemberId;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: "admin" | "member";
  initial: string;
  color: string;
}

export interface BudgetCategory {
  id: string;
  /** Undefined for main categories; set to the parent's id for subcategories. */
  parentId?: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export type BudgetEntryKind = "fixed" | "variable";

/** "Ponctuelle" (once) vs "Mensuelle" (monthly) — independent of BudgetEntryKind (Fixe/Variable). */
export type BudgetEntryRecurrence = "once" | "monthly";

export interface BudgetEntry {
  id: string;
  title: string;
  /** Stored as an integer (cents), never a float, to avoid rounding drift when summing. */
  amountCents: number;
  /** Undefined if the entry's category was deleted (FK is ON DELETE SET NULL). */
  categoryId?: string;
  /** Raw Postgres `date` string ("YYYY-MM-DD"). */
  entryDate: string;
  /** First-of-month Postgres `date` string ("YYYY-MM-01") used to scope the entry to a budget month. */
  entryMonth: string;
  kind: BudgetEntryKind;
  note?: string;
  createdBy?: MemberId;
  /** Set when this entry was generated from a monthly recurring series ("Mensuelle"); undefined for a one-off ("Ponctuelle") entry. */
  recurringExpenseId?: string;
}

/**
 * A household's planned spending for one MAIN Budget category in one month
 * (issue #113). Never exists for a subcategory — the DB enforces that via
 * budget_main_category_in_household(). Absence of a target for a given
 * category/month (no BudgetMonthlyTarget in the loaded list) means "no plan
 * defined", not "planned to spend 0" — a target row is never created for a
 * zero amount (see upsertBudgetMonthlyTarget in lib/supabase/budget.ts).
 */
export interface BudgetMonthlyTarget {
  id: string;
  categoryId: string;
  /** First-of-month Postgres `date` string ("YYYY-MM-01"), same convention as BudgetEntry.entryMonth. */
  targetMonth: string;
  amountCents: number;
}

export interface HouseholdProfile {
  name: string;
  type: "Couple" | "Colocation" | "Famille";
  createdAtLabel: string;
  /** Whether the currently signed-in user is an admin of this household. */
  currentUserIsAdmin: boolean;
  members: HouseholdMember[];
  /**
   * Explicitly configured Budget share count ("parts"), or null if the
   * household has never set one — callers should fall back to the active
   * member count in that case (issue #109). See resolveBudgetShareCount().
   */
  budgetShareCount: number | null;
}
