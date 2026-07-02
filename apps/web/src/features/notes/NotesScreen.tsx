"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { NoteCard } from "./NoteCard";
import { CATEGORY_ORDER } from "./notesData";
import type { Note, NoteCategory } from "@/lib/domain/types";

const CATEGORY_SHORT_LABELS: Record<NoteCategory, string> = {
  wifi: "Wi-Fi",
  codes: "Codes",
  numbers: "Numéros",
  ideas: "Idées",
};

interface NotesScreenProps {
  notes: Note[];
  onAdd: (title: string, category: NoteCategory) => void;
}

export function NotesScreen({ notes, onAdd }: NotesScreenProps) {
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<NoteCategory>("ideas");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed, category);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Quick-add — category selector + input */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={cn(
                "px-3 py-[6px] rounded-full text-[13px] font-semibold cursor-pointer transition-colors",
                category === cat
                  ? "bg-[var(--notes-accent)] text-white"
                  : "bg-[var(--notes-bg)] text-[var(--notes-text)] opacity-60 hover:opacity-100"
              )}
            >
              {CATEGORY_SHORT_LABELS[cat]}
            </button>
          ))}
        </div>

        <Card className="flex items-center gap-3 !p-[14px]">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nouvelle note..."
            className={cn(
              "flex-1 min-w-0 bg-transparent text-[15px] text-[var(--text-primary)]",
              "placeholder:text-[var(--placeholder)] focus:outline-none"
            )}
          />
          <button
            onClick={handleAdd}
            disabled={!draft.trim()}
            aria-label="Ajouter une note"
            className={cn(
              "shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center",
              "text-white text-[22px] font-light leading-none",
              "cursor-pointer transition-opacity",
              "bg-[var(--notes-accent)]",
              "shadow-[0_8px_18px_-8px_rgba(201,154,63,.7)]",
              "hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
            )}
          >
            +
          </button>
        </Card>
      </div>

      {/* Notes grid: 1 col mobile, 2 cols desktop */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-[56px] opacity-40">📝</span>
          <p className="text-[15px] font-semibold text-[var(--text-muted)]">
            Aucune note partagée pour le moment.
          </p>
          <p className="text-[13px] text-[var(--text-soft)]">
            Ajoutez une idée ci-dessus pour commencer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[880px]:grid-cols-2 gap-4">
          {CATEGORY_ORDER.map((cat) => (
            <NoteCard
              key={cat}
              category={cat}
              notes={notes.filter((n) => n.category === cat)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
