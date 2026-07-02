import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import type { AgendaEvent, HouseholdProfile, Note, ShoppingItem, Task, UsefulLink } from "@/lib/domain/types";
import { mapEventRow } from "@/lib/domain/agenda";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberRows, error: memberError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1);

  if (memberError) {
    console.error("[page] household_members query failed:", memberError.message);
    redirect("/onboarding");
  }

  const memberRow = memberRows?.[0] ?? null;
  if (!memberRow) redirect("/onboarding");

  const { data: household } = await supabase
    .from("households")
    .select("id, name, type, created_at")
    .eq("id", memberRow.household_id)
    .single();

  if (!household) redirect("/onboarding");

  const { data: members } = await supabase
    .from("household_members")
    .select("id, display_name, role, initial, color")
    .eq("household_id", memberRow.household_id);

  const createdAt = new Date(household.created_at);
  const createdAtLabel = `Depuis ${createdAt.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })}`;

  const profile: HouseholdProfile = {
    name: household.name,
    type: household.type as HouseholdProfile["type"],
    createdAtLabel,
    members: (members ?? []).map((m) => ({
      id: m.id,
      name: m.display_name,
      role: m.role as "admin" | "member",
      initial: m.initial,
      color: m.color,
    })),
  };

  const { data: shoppingRows, error: shoppingError } = await supabase
    .from("shopping_items")
    .select("id, label, quantity, done, assigned_to")
    .eq("household_id", household.id)
    .order("created_at", { ascending: false });

  if (shoppingError) {
    console.error("[page] shopping_items query failed:", shoppingError.message);
  }

  const initialShoppingItems: ShoppingItem[] = (shoppingRows ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    quantity: row.quantity ?? undefined,
    done: row.done,
    assignedTo: "lea",
  }));

  const { data: taskRows, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, due_label, due_type, done, assigned_to")
    .eq("household_id", household.id)
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("[page] tasks query failed:", tasksError.message);
  }

  const initialTasks: Task[] = (taskRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    dueLabel: row.due_label ?? "Sans date",
    dueType: (row.due_type as Task["dueType"]) ?? "none",
    done: row.done,
    assignedTo: "lea",
  }));

  const { data: noteRows, error: notesError } = await supabase
    .from("notes")
    .select("id, title, content, category, created_by")
    .eq("household_id", household.id)
    .order("created_at", { ascending: false });

  if (notesError) {
    console.error("[page] notes query failed:", notesError.message);
  }

  const initialNotes: Note[] = (noteRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category as Note["category"],
    createdBy: "lea",
  }));

  const { data: linkRows, error: linksError } = await supabase
    .from("useful_links")
    .select("id, title, url, category, icon, created_by")
    .eq("household_id", household.id)
    .order("created_at", { ascending: false });

  if (linksError) {
    console.error("[page] useful_links query failed:", linksError.message);
  }

  const initialLinks: UsefulLink[] = (linkRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    category: row.category as UsefulLink["category"],
    icon: row.icon,
    createdBy: "lea",
  }));

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data: eventRows, error: eventsError } = await supabase
    .from("events")
    .select("id, title, event_date, event_time, location, assigned_to")
    .eq("household_id", household.id)
    .gte("event_date", todayStr)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: true });

  if (eventsError) {
    console.error("[page] events query failed:", eventsError.message);
  }

  const initialEvents: AgendaEvent[] = (eventRows ?? [])
    .map((row) => mapEventRow(row, today))
    .filter((event): event is AgendaEvent => event !== null);

  return (
    <AppShell
      initialProfile={profile}
      initialAccountEmail={user.email ?? ""}
      householdId={household.id}
      initialShoppingItems={initialShoppingItems}
      initialTasks={initialTasks}
      initialNotes={initialNotes}
      initialLinks={initialLinks}
      initialEvents={initialEvents}
    />
  );
}
