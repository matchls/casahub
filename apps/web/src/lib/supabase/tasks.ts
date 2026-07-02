import { createClient } from "./client";

export interface TaskRow {
  id: string;
  title: string;
  due_label: string | null;
  due_type: string | null;
  done: boolean;
  assigned_to: string | null;
}

export async function addTask(householdId: string, title: string): Promise<TaskRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ household_id: householdId, title, done: false })
    .select("id, title, due_label, due_type, done, assigned_to")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ done })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
