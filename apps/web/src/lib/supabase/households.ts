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
