import { cn } from "@/lib/utils";
import type { Note, NoteCategory } from "./notesData";
import { CATEGORY_META } from "./notesData";

interface NoteCardProps {
  category: NoteCategory;
  notes: Note[];
  onDelete: (id: string) => void;
}

const deleteButtonClass =
  "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[13px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer transition-opacity";

export function NoteCard({ category, notes, onDelete }: NoteCardProps) {
  const meta = CATEGORY_META[category];
  const isWifi = category === "wifi";
  const isIdeas = category === "ideas";
  const isNumbers = category === "numbers";

  function handleDelete(id: string) {
    if (confirm("Supprimer cette note ?")) {
      onDelete(id);
    }
  }

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
              className="inline-flex items-center gap-[6px] pl-[12px] pr-[8px] py-[6px] rounded-full text-[13px] font-semibold bg-[var(--notes-bg)] text-[var(--notes-text)]"
            >
              {note.title}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note.id);
                }}
                aria-label="Supprimer la note"
                className={deleteButtonClass}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Numbers: "title · value" rows */}
      {notes.length > 0 && isNumbers && (
        <ul className="flex flex-col gap-[8px]">
          {notes.map((note) => (
            <li key={note.id} className="flex items-center justify-between gap-2 text-[13.5px] text-[var(--text-secondary)]">
              <span>
                {note.title}
                {note.content.trim() && (
                  <>
                    <span className="mx-[6px] text-[var(--text-muted)]">·</span>
                    <span className="font-semibold text-[var(--text-primary)]">{note.content}</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note.id);
                }}
                aria-label="Supprimer la note"
                className={deleteButtonClass}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Wifi / Codes: "title : value" rows */}
      {notes.length > 0 && !isIdeas && !isNumbers && (
        <ul className="flex flex-col gap-[8px]">
          {notes.map((note) => (
            <li key={note.id} className="flex items-center justify-between gap-2 text-[13.5px] text-[var(--text-secondary)]">
              <span>
                {note.title}
                {note.content.trim() && (
                  <>
                    <span className="mx-[4px] text-[var(--text-muted)]">:</span>
                    <span className="font-bold text-[var(--notes-text)]">{note.content}</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note.id);
                }}
                aria-label="Supprimer la note"
                className={deleteButtonClass}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
