import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import {
  loadCurrentUserHousehold,
  loadHouseholdProfile,
  loadShoppingItems,
  loadTasks,
  loadNotes,
  loadUsefulLinks,
  loadEvents,
} from "@/lib/supabase/loaders";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await loadCurrentUserHousehold(supabase, user.id);
  if (!membership) redirect("/onboarding");

  const { householdId } = membership;

  const profile = await loadHouseholdProfile(supabase, householdId, user.id);
  if (!profile) redirect("/onboarding");

  const initialShoppingItems = await loadShoppingItems(supabase, householdId);
  const initialTasks = await loadTasks(supabase, householdId);
  const initialNotes = await loadNotes(supabase, householdId);
  const initialLinks = await loadUsefulLinks(supabase, householdId);
  const initialEvents = await loadEvents(supabase, householdId, new Date());

  return (
    <AppShell
      initialProfile={profile}
      initialAccountEmail={user.email ?? ""}
      householdId={householdId}
      initialShoppingItems={initialShoppingItems}
      initialTasks={initialTasks}
      initialNotes={initialNotes}
      initialLinks={initialLinks}
      initialEvents={initialEvents}
    />
  );
}
