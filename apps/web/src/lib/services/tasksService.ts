import type { Task } from "@/lib/domain/types";

/**
 * Tasks service — currently backed by in-memory mock data via useCasaHubState.
 * Replace these stubs with Supabase calls once the `tasks` table is live.
 *
 * Target table: tasks
 *   id          uuid primary key
 *   household_id uuid references households(id)
 *   title       text not null
 *   due_label   text
 *   due_type    text check (due_type in ('date','recurrence','none'))
 *   done        boolean default false
 *   assigned_to text references household_members(id)
 *   created_at  timestamptz default now()
 */

export interface TasksService {
  getTasks(householdId: string): Promise<Task[]>;
  toggleTask(id: number): Promise<void>;
  addTask(title: string, assignedTo: string): Promise<Task>;
}
