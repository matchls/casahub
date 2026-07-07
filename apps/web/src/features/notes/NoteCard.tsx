"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Note, NoteCategory } from "./notesData";
import { CATEGORY_META } from "./notesData";
import type { UpdateNoteInput } from "@/lib/supabase/notes";

interface NoteCardProps {
  category: NoteCategory;
  notes: Note[];
  onUpdate: (id: string, input: UpdateNoteInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const deleteButtonClass =
  "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[13px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer transition-opacity";

const editButtonClass =
  "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--notes-text)] cursor-pointer transition-opacity";

const inputClass =
  "min-w-0 rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] px-2 py-[5px] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--notes-accent)] transition-colors";

interface EditFormProps {
  note: Note;
  isIdeas: boolean;
  onUpdate: (id: string, input: UpdateNoteInput) => Promise<void>;
  onDone: () => void;
}

function NoteEditForm({ note, isIdeas, onUpdate, onDone }: EditFormProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Le titre est obligatoire.");
      return;
    }
    const trimmedContent = content.trim();
    if (trimmedTitle === note.title && trimmedContent === note.content) {
      onDone();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onUpdate(note.id, { title: trimmedTitle, content: trimmedContent });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-[6px] w-full">
      <div className="flex items-center gap-[6px]">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          className={cn(inputClass, "flex-1")}
        />
        {!isIdeas && (
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={saving}
            className={cn(inputClass, "flex-1")}
          />
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[8px] bg-[var(--notes-accent)] text-white font-semibold text-[12px] px-[10px] py-[4px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </form>
  );
}

export function NoteCard({ category, notes, onUpdate, onDelete }: NoteCardProps) {
  const meta = CATEGORY_META[category];
  const isWifi = category === "wifi";
  const isIdeas = category === "ideas";
  const isNumbers = category === "numbers";
  const [editingId, setEditingId] = useState<string | null>(null);

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
          {notes.map((note) =>
            editingId === note.id ? (
              <div key={note.id} className="w-full">
                <NoteEditForm note={note} isIdeas onUpdate={onUpdate} onDone={() => setEditingId(null)} />
              </div>
            ) : (
              <span
                key={note.id}
                className="inline-flex items-center gap-[6px] pl-[12px] pr-[8px] py-[6px] rounded-full text-[13px] font-semibold bg-[var(--notes-bg)] text-[var(--notes-text)]"
              >
                {note.title}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(note.id);
                  }}
                  aria-label="Modifier la note"
                  className={editButtonClass}
                >
                  ✎
                </button>
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
            )
          )}
        </div>
      )}

      {/* Numbers: "title · value" rows */}
      {notes.length > 0 && isNumbers && (
        <ul className="flex flex-col gap-[8px]">
          {notes.map((note) => (
            <li key={note.id} className="flex items-center justify-between gap-2 text-[13.5px] text-[var(--text-secondary)]">
              {editingId === note.id ? (
                <NoteEditForm note={note} isIdeas={false} onUpdate={onUpdate} onDone={() => setEditingId(null)} />
              ) : (
                <>
                  <span>
                    {note.title}
                    {note.content.trim() && (
                      <>
                        <span className="mx-[6px] text-[var(--text-muted)]">·</span>
                        <span className="font-semibold text-[var(--text-primary)]">{note.content}</span>
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(note.id);
                      }}
                      aria-label="Modifier la note"
                      className={editButtonClass}
                    >
                      ✎
                    </button>
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
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Wifi / Codes: "title : value" rows */}
      {notes.length > 0 && !isIdeas && !isNumbers && (
        <ul className="flex flex-col gap-[8px]">
          {notes.map((note) => (
            <li key={note.id} className="flex items-center justify-between gap-2 text-[13.5px] text-[var(--text-secondary)]">
              {editingId === note.id ? (
                <NoteEditForm note={note} isIdeas={false} onUpdate={onUpdate} onDone={() => setEditingId(null)} />
              ) : (
                <>
                  <span>
                    {note.title}
                    {note.content.trim() && (
                      <>
                        <span className="mx-[4px] text-[var(--text-muted)]">:</span>
                        <span className="font-bold text-[var(--notes-text)]">{note.content}</span>
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(note.id);
                      }}
                      aria-label="Modifier la note"
                      className={editButtonClass}
                    >
                      ✎
                    </button>
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
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
