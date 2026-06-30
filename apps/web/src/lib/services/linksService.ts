import type { UsefulLink, LinkCategory } from "@/lib/domain/types";

/**
 * Links service — currently backed by in-memory mock data via useCasaHubState.
 * Replace these stubs with Supabase calls once the `useful_links` table is live.
 *
 * Target table: useful_links
 *   id          uuid primary key
 *   household_id uuid references households(id)
 *   title       text not null
 *   url         text not null
 *   category    text check (category in ('home','health','documents','admin','services','ideas'))
 *   icon        text
 *   created_by  text references household_members(id)
 *   created_at  timestamptz default now()
 */

export interface LinksService {
  getLinks(householdId: string): Promise<UsefulLink[]>;
  addLink(title: string, url: string, category: LinkCategory, createdBy: string): Promise<UsefulLink>;
}
