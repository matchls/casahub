import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import type { HouseholdProfile, ShoppingItem } from "@/lib/domain/types";

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

  return (
    <AppShell
      initialProfile={profile}
      initialAccountEmail={user.email ?? ""}
      householdId={household.id}
      initialShoppingItems={initialShoppingItems}
    />
  );
}
