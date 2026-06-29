import { cn } from "@/lib/utils";
import type { Note, NoteCategory } from "./notesData";
import { CATEGORY_META } from "./notesData";

interface NoteCardProps {
  category: NoteCategory;
  notes: Note[];
}

export function NoteCard({ category, notes }: NoteCardProps) {
  const meta = CATEGORY_META[category];
  const isWifi = category === "wifi";
  const isIdeas = category === "ideas";
  const isNumbers = category === "numbers";

  return (
    <div
      className={cn(
        "rounded-[16px] p-[18px] shadow-[var(--shadow-card)]",
        isWifi ? "bg-[var(--notes-bg)]" : "bg-[var(--surface)]"
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-[10px] mb-[14px]">
        <span className="text-[20px] leading-none">{meta.emoji}</span>
        <h3
          className="font-extrabold text-[17px] text-[var(--text-primary)] tracking-[-0.02em] leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {meta.label}
        </h3>
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <p className="text-[13px] text-[var(--text-muted)] italic">Aucune note</p>
      )}

      {/* Ideas: chip tags */}
      {notes.length > 0 && isIdeas && (
        <div className="flex flex-wrap gap-2">
          {notes.map((note) => (
            <span
              key={note.id}
              className="inline-flex items-center px-[12px] py-[6px] rounded-full text-[13px] font-semibold bg-[var(--notes-bg)] text-[var(--notes-text)]"
            >
              {note.title}
            </span>
          ))}
        </div>
      )}

      {/* Numbers: "title · value" rows */}
      {notes.length > 0 && isNumbers && (
        <ul className="flex flex-col gap-[8px]">
          {notes.map((note) => (
            <li key={note.id} className="text-[13.5px] text-[var(--text-secondary)]">
              {note.title}
              <span className="mx-[6px] text-[var(--text-muted)]">·</span>
              <span className="font-semibold text-[var(--text-primary)]">{note.content}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Wifi / Codes: "title : value" rows */}
      {notes.length > 0 && !isIdeas && !isNumbers && (
        <ul className="flex flex-col gap-[8px]">
          {notes.map((note) => (
            <li key={note.id} className="text-[13.5px] text-[var(--text-secondary)]">
              {note.title}
              <span className="mx-[4px] text-[var(--text-muted)]">:</span>
              <span className="font-bold text-[var(--notes-text)]">{note.content}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
