import { createClient } from "./client";
import type { Note } from "@/lib/domain/types";

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  category: string;
  created_by: string | null;
}

export function mapNoteRow(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category as Note["category"],
    createdBy: row.created_by ?? undefined,
  };
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

export interface UpdateNoteInput {
  title: string;
  content: string;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<NoteRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({ title: input.title, content: input.content })
    .eq("id", id)
    .select("id, title, content, category, created_by")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
