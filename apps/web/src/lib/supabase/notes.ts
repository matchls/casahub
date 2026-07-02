import { createClient } from "./client";

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  category: string;
  created_by: string | null;
}

export async function addNote(
  householdId: string,
  title: string,
  category: string,
  content: string = ""
): Promise<NoteRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .insert({ household_id: householdId, title, content, category })
    .select("id, title, content, category, created_by")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
