"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { NoteCard } from "./NoteCard";
import { initialNotes, CATEGORY_ORDER } from "./notesData";
import type { Note } from "./notesData";

interface NotesScreenProps {
  onNotesCountChange?: (count: number) => void;
}

export function NotesScreen({ onNotesCountChange }: NotesScreenProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const nextIdRef = useRef(initialNotes.length + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onNotesCountChange?.(notes.length);
  }, [notes.length, onNotesCountChange]);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const newNote: Note = {
      id: nextIdRef.current++,
      title: trimmed,
      content: "",
      category: "ideas",
      createdBy: "lea",
    };

    setNotes((prev) => [...prev, newNote]);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Quick-add — adds to Idées by default */}
      <Card className="flex items-center gap-3 !p-[14px]">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nouvelle idée..."
          className={cn(
            "flex-1 min-w-0 bg-transparent text-[15px] text-[var(--text-primary)]",
            "placeholder:text-[var(--placeholder)] focus:outline-none"
          )}
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          aria-label="Ajouter une idée"
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
          {CATEGORY_ORDER.map((category) => (
            <NoteCard
              key={category}
              category={category}
              notes={notes.filter((n) => n.category === category)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
