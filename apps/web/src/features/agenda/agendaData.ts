export type ItemType = "event" | "task" | "shopping" | "reminder";
export type MemberId = "lea" | "tom";
export type AgendaGroup = "today" | "tomorrow" | "this_week" | "next_week";

export const MEMBERS: Record<MemberId, { initial: string; color: string; name: string }> = {
  lea: { initial: "L", color: "#C2603F", name: "Léa" },
  tom: { initial: "T", color: "#6E8BA6", name: "Tom" },
};

export const TYPE_META: Record<ItemType, { emoji: string; label: string }> = {
  event:    { emoji: "📅", label: "Agenda" },
  task:     { emoji: "✅", label: "Tâche" },
  shopping: { emoji: "🛒", label: "Course" },
  reminder: { emoji: "🔔", label: "Rappel" },
};

export const GROUP_LABELS: Record<AgendaGroup, string> = {
  today:     "AUJOURD'HUI",
  tomorrow:  "DEMAIN",
  this_week: "CETTE SEMAINE",
  next_week: "LA SEMAINE PROCHAINE",
};

export const GROUP_ORDER: AgendaGroup[] = ["today", "tomorrow", "this_week", "next_week"];

export interface TimelineItem {
  id: number;
  type: ItemType;
  title: string;
  time?: string;
  location?: string;
  assignedTo?: MemberId;
}

export interface AgendaEvent {
  id: number;
  type: ItemType;
  title: string;
  dayAbbr: string;
  dayNum: number;
  time?: string;
  location?: string;
  assignedTo?: MemberId;
  group: AgendaGroup;
}

export const dayTimelineItems: TimelineItem[] = [
  { id: 1, type: "task",     title: "Sortir les poubelles",  time: "08:30" },
  { id: 2, type: "event",    title: "Médecin",               time: "14:00", location: "Cabinet Dr. Roche", assignedTo: "lea" },
  { id: 3, type: "shopping", title: "Acheter du pain",       time: "18:00" },
  { id: 4, type: "event",    title: "Dîner chez Marc",       time: "19:30" },
];

export const agendaEvents: AgendaEvent[] = [
  { id: 1, type: "event",    title: "Médecin — Léa",     dayAbbr: "DIM", dayNum: 29, time: "14:00", location: "Cabinet Dr. Roche", assignedTo: "lea", group: "today" },
  { id: 2, type: "event",    title: "Dîner chez Marc",   dayAbbr: "DIM", dayNum: 29, time: "19:30",                                                   group: "today" },
  { id: 3, type: "task",     title: "Anniversaire maman",dayAbbr: "LUN", dayNum: 30,                                                assignedTo: "lea", group: "tomorrow" },
  { id: 4, type: "reminder", title: "Loyer à payer",     dayAbbr: "LUN", dayNum: 30, time: "Toute la journée",                                         group: "tomorrow" },
  { id: 5, type: "event",    title: "Apéro chez Sarah",  dayAbbr: "MER", dayNum: 1,  time: "19:00", location: "Léa & Tom",                            group: "this_week" },
  { id: 6, type: "event",    title: "Brunch famille",    dayAbbr: "SAM", dayNum: 5,  time: "11:00", location: "chez les parents",                      group: "this_week" },
  { id: 7, type: "event",    title: "Contrôle voiture",  dayAbbr: "VEN", dayNum: 11, time: "10:00",                                                    group: "next_week" },
];
