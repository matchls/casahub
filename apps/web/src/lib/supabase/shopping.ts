import { createClient } from "./client";

export interface ShoppingRow {
  id: string;
  label: string;
  quantity: number | null;
  done: boolean;
  assigned_to: string | null;
}

export async function addShoppingItem(
  householdId: string,
  label: string
): Promise<ShoppingRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({ household_id: householdId, label, done: false })
    .select("id, label, quantity, done, assigned_to")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function toggleShoppingItem(id: string, done: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("shopping_items")
    .update({ done })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
