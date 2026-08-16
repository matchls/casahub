import { createClient } from "./client";

export async function createHouseholdWithMember(params: {
  householdName: string;
  householdType: string;
  displayName: string;
  initial: string;
  color: string;
}): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_household_with_member", {
    household_name: params.householdName,
    household_type: params.householdType,
    member_display_name: params.displayName,
    member_initial: params.initial,
    member_color: params.color,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function updateHouseholdName(householdId: string, name: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("households")
    .update({ name })
    .eq("id", householdId);
  if (error) throw new Error(error.message);
}

/**
 * Persists the household's explicit Budget share count ("parts", issue
 * #109). Goes through the set_household_budget_share_count RPC rather than a
 * direct table update: the households UPDATE RLS policy only allows admins,
 * but any household member should be able to set this value — see
 * supabase/budget_shares.sql for the narrowly-scoped SECURITY DEFINER
 * function that makes that possible without widening households RLS/grants.
 */
export async function updateHouseholdBudgetShareCount(
  householdId: string,
  shareCount: number
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_household_budget_share_count", {
    target_household_id: householdId,
    target_share_count: shareCount,
  });
  if (error) throw new Error(error.message);
}
