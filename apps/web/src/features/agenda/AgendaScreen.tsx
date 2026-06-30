import { cn } from "@/lib/utils";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  MEMBERS,
  TYPE_META,
} from "./agendaData";
import type { AgendaEvent, AgendaGroup } from "@/lib/domain/types";

interface AgendaScreenProps {
  events: AgendaEvent[];
}

export function AgendaScreen({ events }: AgendaScreenProps) {
  return (
    <div className="max-w-[720px] flex flex-col gap-8">
      {GROUP_ORDER.map((group) => {
        const groupEvents = events.filter((e) => e.group === group);
        if (groupEvents.length === 0) return null;

        return (
          <section key={group}>
            <h2 className="text-[11px] font-bold uppercase tracking-[.06em] text-[var(--text-muted)] mb-3 px-1">
              {GROUP_LABELS[group]}
            </h2>
            <div className="rounded-[16px] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden">
              {groupEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={index > 0 ? "border-t border-[rgba(44,38,34,0.06)]" : ""}
                >
                  <AgendaEventRow event={event} group={group} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AgendaEventRow({ event, group }: { event: AgendaEvent; group: AgendaGroup }) {
  const member = event.assignedTo ? MEMBERS[event.assignedTo] : null;
  const typeMeta = TYPE_META[event.type];

  return (
    <div className="flex items-stretch gap-0 px-4 py-[14px]">
      {/* Date column */}
      <div className="flex flex-col items-center justify-center w-[44px] shrink-0 mr-4">
        <span className="text-[11px] font-bold uppercase text-[var(--text-muted)] leading-none">
          {event.dayAbbr}
        </span>
        <span
          className="text-[26px] font-extrabold leading-tight tabular-nums"
          style={{
            color: group === "today" ? "var(--primary)" : "var(--agenda-text)",
            fontFamily: "var(--font-display)",
          }}
        >
          {event.dayNum}
        </span>
      </div>

      {/* Vertical separator */}
      <div
        className="w-[3px] rounded-full mr-4 shrink-0"
        style={{ background: "var(--agenda-bg)", minHeight: "40px" }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-[3px]">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug truncate">
            {event.title}
          </p>

          {/* Reminder badge */}
          {event.type === "reminder" && (
            <span className="shrink-0 inline-flex items-center gap-[4px] rounded-full px-[8px] py-[2px] text-[10px] font-bold bg-[var(--notes-bg)] text-[var(--notes-text)]">
              <span>{typeMeta.emoji}</span>
              <span>{typeMeta.label}</span>
            </span>
          )}
        </div>

        {(event.time || event.location) && (
          <p className="text-[12px] text-[var(--text-muted)] flex items-center gap-1 flex-wrap">
            {event.time && <span>{event.time}</span>}
            {event.time && event.location && <span>·</span>}
            {event.location && <span>{event.location}</span>}
          </p>
        )}
      </div>

      {/* Member avatar */}
      {member && (
        <div
          className={cn(
            "shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center",
            "text-white text-[11px] font-bold ml-3 self-center"
          )}
          style={{ backgroundColor: member.color }}
          title={member.name}
        >
          {member.initial}
        </div>
      )}
    </div>
  );
}
