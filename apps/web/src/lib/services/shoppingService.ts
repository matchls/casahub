import type { ShoppingItem } from "@/lib/domain/types";

/**
 * Shopping service — currently backed by in-memory mock data via useCasaHubState.
 * Replace these stubs with Supabase calls once the `shopping_items` table is live.
 *
 * Target table: shopping_items
 *   id          uuid primary key
 *   household_id uuid references households(id)
 *   label       text not null
 *   quantity    int
 *   done        boolean default false
 *   assigned_to text references household_members(id)
 *   created_at  timestamptz default now()
 */

export interface ShoppingService {
  getItems(householdId: string): Promise<ShoppingItem[]>;
  toggleItem(id: number): Promise<void>;
  addItem(label: string, assignedTo: string): Promise<ShoppingItem>;
}
