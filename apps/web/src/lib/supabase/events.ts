import { createClient } from "./client";
import type { EventRow } from "@/lib/domain/agenda";

export async function addEvent(
  householdId: string,
  title: string,
  eventDate: string,
  eventTime?: string,
  location?: string
): Promise<EventRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      household_id: householdId,
      title,
      event_date: eventDate,
      event_time: eventTime || null,
      location: location || null,
    })
    .select("id, title, event_date, event_time, location, assigned_to")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
