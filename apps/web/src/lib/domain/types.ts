/** A household member's id (matches `household_members.id` in Supabase). */
export type MemberId = string;

export interface ShoppingItem {
  id: string;
  label: string;
  quantity?: number;
  done: boolean;
  assignedTo?: MemberId;
}

/** Alias matching the issue's domain language. */
export type CourseItem = ShoppingItem;

export type DueType = "date" | "recurrence" | "none";

export interface Task {
  id: string;
  title: string;
  dueLabel: string;
  dueType: DueType;
  done: boolean;
  assignedTo?: MemberId;
}

export type ItemType = "event" | "task" | "shopping" | "reminder";
export type AgendaGroup = "today" | "tomorrow" | "this_week" | "next_week" | "later";

export interface TimelineItem {
  id: string;
  type: ItemType;
  title: string;
  time?: string;
  location?: string;
  assignedTo?: MemberId;
}

export interface AgendaEvent {
  id: string;
  type: ItemType;
  title: string;
  /** Raw Postgres `date` string ("YYYY-MM-DD") — dayAbbr/dayNum are derived display values that drop month/year, so this is the only field that can round-trip into a date input. */
  eventDate: string;
  dayAbbr: string;
  dayNum: number;
  time?: string;
  location?: string;
  assignedTo?: MemberId;
  group: AgendaGroup;
}

export type NoteCategory = "wifi" | "codes" | "numbers" | "ideas";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdBy?: MemberId;
}

export type LinkCategory = "home" | "health" | "documents" | "admin" | "services" | "ideas";

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  category: LinkCategory;
  icon: string;
  createdBy?: MemberId;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: "admin" | "member";
  initial: string;
  color: string;
}

export interface HouseholdProfile {
  name: string;
  type: "Couple" | "Colocation" | "Famille";
  createdAtLabel: string;
  /** Whether the currently signed-in user is an admin of this household. */
  currentUserIsAdmin: boolean;
  members: HouseholdMember[];
}
