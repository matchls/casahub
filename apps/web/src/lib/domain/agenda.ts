import type { AgendaEvent, AgendaGroup } from "./types";

export const GROUP_ORDER: AgendaGroup[] = ["today", "tomorrow", "this_week", "next_week", "later"];

const DAY_ABBRS = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses a Postgres `date` string ("YYYY-MM-DD") as a local calendar date, avoiding the UTC shift `new Date(str)` would apply. */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeekMonday(date: Date): Date {
  const day = date.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = startOfDay(date);
  monday.setDate(monday.getDate() + diffToMonday);
  return monday;
}

/**
 * Buckets an event date relative to today into the groups the agenda UI renders.
 * "this_week"/"next_week" are the ISO (Monday-start) weeks following tomorrow, not today's own
 * week — mirrors the original mock data's grouping. Anything past next week falls into "later"
 * so no future event is ever dropped from the view. Returns null only for past events, which the
 * agenda view doesn't have a section for.
 */
export function deriveAgendaGroup(eventDate: Date, today: Date): AgendaGroup | null {
  const todayStart = startOfDay(today);
  const eventStart = startOfDay(eventDate);
  const diffDays = Math.round((eventStart.getTime() - todayStart.getTime()) / MS_PER_DAY);

  if (diffDays < 0) return null;
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";

  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisWeekStart = startOfWeekMonday(tomorrow);
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(thisWeekStart.getDate() + 7);
  const afterNextWeekStart = new Date(nextWeekStart);
  afterNextWeekStart.setDate(nextWeekStart.getDate() + 7);

  if (eventStart >= thisWeekStart && eventStart < nextWeekStart) return "this_week";
  if (eventStart >= nextWeekStart && eventStart < afterNextWeekStart) return "next_week";
  return "later";
}

export interface EventRow {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  assigned_to: string | null;
}

/** Maps a Supabase `events` row to the UI shape, or null if the event is in the past. */
export function mapEventRow(row: EventRow, today: Date): AgendaEvent | null {
  const eventDate = parseDateOnly(row.event_date);
  const group = deriveAgendaGroup(eventDate, today);
  if (!group) return null;
  return {
    id: row.id,
    type: "event",
    title: row.title,
    eventDate: row.event_date,
    dayAbbr: DAY_ABBRS[eventDate.getDay()],
    dayNum: eventDate.getDate(),
    time: row.event_time ? row.event_time.slice(0, 5) : "Toute la journée",
    location: row.location ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    group,
  };
}

/**
 * Inserts a newly-added event into an already date-sorted events array, keeping it grouped
 * with same-group events and ahead of any strictly-later group — without needing the full
 * original Date (AgendaEvent only carries day-of-month, not month/year).
 */
export function insertEventSorted(events: AgendaEvent[], newEvent: AgendaEvent): AgendaEvent[] {
  const newGroupIndex = GROUP_ORDER.indexOf(newEvent.group);
  const insertAt = events.findIndex((e) => GROUP_ORDER.indexOf(e.group) > newGroupIndex);
  if (insertAt === -1) return [...events, newEvent];
  return [...events.slice(0, insertAt), newEvent, ...events.slice(insertAt)];
}
