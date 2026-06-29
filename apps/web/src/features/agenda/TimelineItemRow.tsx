import { cn } from "@/lib/utils";
import type { TimelineItem, ItemType } from "./agendaData";
import { MEMBERS, TYPE_META } from "./agendaData";

const TYPE_BADGE_STYLES: Record<ItemType, string> = {
  event:    "bg-[var(--agenda-bg)] text-[var(--agenda-text)]",
  task:     "bg-[var(--tasks-bg)] text-[var(--tasks-text)]",
  shopping: "bg-[var(--shopping-bg)] text-[var(--shopping-text)]",
  reminder: "bg-[var(--notes-bg)] text-[var(--notes-text)]",
};

const DOT_COLORS: Record<ItemType, string> = {
  event:    "bg-[var(--agenda-accent)]",
  task:     "bg-[var(--tasks-accent)]",
  shopping: "bg-[var(--shopping-accent)]",
  reminder: "bg-[var(--notes-accent)]",
};

interface TimelineItemRowProps {
  item: TimelineItem;
  isLast: boolean;
}

export function TimelineItemRow({ item, isLast }: TimelineItemRowProps) {
  const meta = TYPE_META[item.type];
  const member = item.assignedTo ? MEMBERS[item.assignedTo] : null;

  return (
    <div className="flex gap-4">
      {/* Time column — fixed width so dots align */}
      <div className="w-[46px] shrink-0 text-right pt-[3px]">
        {item.time && (
          <span className="text-[12px] font-semibold text-[var(--text-muted)] tabular-nums">
            {item.time}
          </span>
        )}
      </div>

      {/* Dot + vertical connector */}
      <div className="flex flex-col items-center pt-[3px]">
        <div
          className={cn(
            "w-[10px] h-[10px] rounded-full shrink-0",
            DOT_COLORS[item.type]
          )}
        />
        {!isLast && (
          <div className="w-[2px] flex-1 mt-[4px] min-h-[32px] bg-[var(--border)]" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isLast ? "pb-2" : "pb-5")}>
        {/* Type badge + optional member */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px]",
              "text-[11px] font-bold",
              TYPE_BADGE_STYLES[item.type]
            )}
          >
            <span className="text-[10px]">{meta.emoji}</span>
            <span>{meta.label}</span>
          </span>

          {member && (
            <div
              className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ backgroundColor: member.color }}
              title={member.name}
            >
              {member.initial}
            </div>
          )}
        </div>

        <p className="text-[15px] font-semibold text-[var(--text-primary)] mt-[5px] leading-snug">
          {item.title}
        </p>

        {item.location && (
          <p className="text-[12px] text-[var(--text-muted)] mt-[2px] flex items-center gap-[5px]">
            <span>📍</span>
            <span>{item.location}</span>
          </p>
        )}
      </div>
    </div>
  );
}
