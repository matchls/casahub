import type { Note, NoteCategory } from "@/lib/domain/types";

/**
 * Notes service — currently backed by in-memory mock data via useCasaHubState.
 * Replace these stubs with Supabase calls once the `notes` table is live.
 *
 * Target table: notes
 *   id          uuid primary key
 *   household_id uuid references households(id)
 *   title       text not null
 *   content     text default ''
 *   category    text check (category in ('wifi','codes','numbers','ideas'))
 *   created_by  text references household_members(id)
 *   created_at  timestamptz default now()
 */

export interface NotesService {
  getNotes(householdId: string): Promise<Note[]>;
  addNote(title: string, category: NoteCategory, createdBy: string): Promise<Note>;
}
