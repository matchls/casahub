import { createClient } from "./client";

export interface HouseholdInvitation {
  id: string;
  token: string;
  householdId: string;
  invitedEmail: string;
  expiresAt: string;
}

export async function createHouseholdInvitation(email: string): Promise<HouseholdInvitation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc("create_household_invitation", { invited_email: email })
    .single();
  if (error) throw new Error(error.message);
  const row = data as {
    id: string;
    token: string;
    household_id: string;
    email: string;
    expires_at: string;
  };
  return {
    id: row.id,
    token: row.token,
    householdId: row.household_id,
    invitedEmail: row.email,
    expiresAt: row.expires_at,
  };
}

export async function acceptHouseholdInvitation(token: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_household_invitation", {
    invite_token: token,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
