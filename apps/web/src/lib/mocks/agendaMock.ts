import type { TimelineItem, AgendaEvent } from "@/lib/domain/types";

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
