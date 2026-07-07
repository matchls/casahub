"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  TYPE_META,
} from "./agendaData";
import type { AgendaEvent, AgendaGroup, HouseholdMember } from "@/lib/domain/types";

interface AgendaScreenProps {
  events: AgendaEvent[];
  members: HouseholdMember[];
  onUpdate: (id: string, title: string, eventDate: string, eventTime?: string, location?: string) => Promise<void>;
  onDelete: (id: string) => void;
}

export function AgendaScreen({ events, members, onUpdate, onDelete }: AgendaScreenProps) {
  function handleDelete(id: string) {
    if (confirm("Supprimer cet événement ?")) {
      onDelete(id);
    }
  }

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
                  <AgendaEventRow event={event} group={group} members={members} onUpdate={onUpdate} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AgendaEventRow({
  event,
  group,
  members,
  onUpdate,
  onDelete,
}: {
  event: AgendaEvent;
  group: AgendaGroup;
  members: HouseholdMember[];
  onUpdate: (id: string, title: string, eventDate: string, eventTime?: string, location?: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [eventDate, setEventDate] = useState(event.eventDate);
  const [eventTime, setEventTime] = useState(event.time && event.time !== "Toute la journée" ? event.time : "");
  const [location, setLocation] = useState(event.location ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const member = event.assignedTo ? members.find((m) => m.id === event.assignedTo) : undefined;
  const typeMeta = TYPE_META[event.type];

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setTitle(event.title);
    setEventDate(event.eventDate);
    setEventTime(event.time && event.time !== "Toute la journée" ? event.time : "");
    setLocation(event.location ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (!eventDate) {
      setError("La date est obligatoire.");
      return;
    }
    const trimmedLocation = location.trim();
    const originalTime = event.time && event.time !== "Toute la journée" ? event.time : "";
    if (
      trimmedTitle === event.title &&
      eventDate === event.eventDate &&
      eventTime === originalTime &&
      trimmedLocation === (event.location ?? "")
    ) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onUpdate(event.id, trimmedTitle, eventDate, eventTime || undefined, trimmedLocation || undefined);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    const inputClass =
      "min-w-0 rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] px-3 py-[7px] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--agenda-text)] transition-colors";

    return (
      <form onSubmit={handleSave} className="flex flex-col gap-2 px-4 py-[14px]">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          placeholder="Titre"
          className={cn(inputClass, "w-full font-semibold")}
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={saving}
            className={cn(inputClass, "flex-1")}
          />
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            disabled={saving}
            className={cn(inputClass, "flex-1")}
          />
        </div>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={saving}
          placeholder="Lieu (optionnel)"
          className={cn(inputClass, "w-full")}
        />
        <div className="flex items-center gap-3 mt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-[var(--primary)] text-white font-semibold text-[13px] px-3 py-[6px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
          >
            Annuler
          </button>
        </div>
        {error && <p className="text-[13px] text-red-500">{error}</p>}
      </form>
    );
  }

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

      {/* Edit */}
      <button
        type="button"
        onClick={startEditing}
        aria-label="Modifier l'événement"
        className="shrink-0 w-6 h-6 ml-2 self-center rounded-full flex items-center justify-center text-[13px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--agenda-text)] cursor-pointer transition-opacity"
      >
        ✎
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(event.id);
        }}
        aria-label="Supprimer l'événement"
        className="shrink-0 w-6 h-6 ml-2 self-center rounded-full flex items-center justify-center text-[15px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
