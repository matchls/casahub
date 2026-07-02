import { createClient } from "./client";

export interface LinkRow {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: string;
  created_by: string | null;
}

export async function addUsefulLink(
  householdId: string,
  title: string,
  url: string,
  category: string = "ideas",
  icon: string = "🔗"
): Promise<LinkRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("useful_links")
    .insert({ household_id: householdId, title, url, category, icon })
    .select("id, title, url, category, icon, created_by")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
