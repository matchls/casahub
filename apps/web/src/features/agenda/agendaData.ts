import type { MemberId, ItemType, AgendaGroup, TimelineItem, AgendaEvent } from "@/lib/domain/types";
export type { MemberId, ItemType, AgendaGroup, TimelineItem, AgendaEvent };

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
