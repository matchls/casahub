import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgendaEvent,
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
    .select("id, name, type, created_at")
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
