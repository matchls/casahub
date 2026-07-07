import { createClient } from "./client";
import type { UsefulLink } from "@/lib/domain/types";

export interface LinkRow {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: string;
  created_by: string | null;
}

export function mapLinkRow(row: LinkRow): UsefulLink {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    category: row.category as UsefulLink["category"],
    icon: row.icon,
    createdBy: row.created_by ?? undefined,
  };
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

export async function deleteUsefulLink(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("useful_links").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
