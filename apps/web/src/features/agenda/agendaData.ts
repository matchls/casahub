import type { ItemType, AgendaGroup, TimelineItem, AgendaEvent } from "@/lib/domain/types";
export type { ItemType, AgendaGroup, TimelineItem, AgendaEvent };
export { GROUP_ORDER } from "@/lib/domain/agenda";

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
  later:     "PLUS TARD",
};
