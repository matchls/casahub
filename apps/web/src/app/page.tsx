import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { currentBudgetMonth, monthRangeEndingAt, BUDGET_EVOLUTION_MONTH_COUNT } from "@/features/budget/budgetData";
import {
  loadCurrentUserHousehold,
  loadHouseholdProfile,
  loadShoppingItems,
  loadTasks,
  loadNotes,
  loadUsefulLinks,
  loadEvents,
  loadBudgetCategories,
  loadBudgetEntries,
  loadBudgetEvolution,
  loadBudgetMonthlyTargets,
  ensureBudgetRecurringOccurrences,
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

  const { error: ensureBudgetCategoriesError } = await supabase.rpc(
    "ensure_default_budget_categories",
    { target_household_id: householdId }
  );
  if (ensureBudgetCategoriesError) {
    console.error(
      "[page] ensure_default_budget_categories failed:",
      ensureBudgetCategoriesError.message
    );
  }

  const budgetMonth = currentBudgetMonth();
  const evolutionMonths = monthRangeEndingAt(budgetMonth, BUDGET_EVOLUTION_MONTH_COUNT);
  // Materialize recurring occurrences for the whole evolution window before
  // reading any totals — otherwise a month that was never manually opened
  // before would be undercounted (issue #105).
  await ensureBudgetRecurringOccurrences(
    supabase,
    householdId,
    evolutionMonths[0],
    evolutionMonths[evolutionMonths.length - 1]
  );

  const initialBudgetCategories = await loadBudgetCategories(supabase, householdId);
  const initialBudgetEntries = await loadBudgetEntries(supabase, householdId, budgetMonth);
  const initialBudgetEvolution = await loadBudgetEvolution(supabase, householdId, budgetMonth);
  const initialBudgetMonthlyTargets = await loadBudgetMonthlyTargets(supabase, householdId, budgetMonth);

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
      initialBudgetCategories={initialBudgetCategories}
      initialBudgetEntries={initialBudgetEntries}
      initialBudgetEvolution={initialBudgetEvolution}
      initialBudgetMonthlyTargets={initialBudgetMonthlyTargets}
    />
  );
}
