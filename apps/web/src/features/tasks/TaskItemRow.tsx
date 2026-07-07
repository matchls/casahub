"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Task } from "./tasksData";
import type { HouseholdMember } from "@/lib/domain/types";

interface TaskItemRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => void;
  members: HouseholdMember[];
}

const DUE_ICON: Record<Task["dueType"], string | null> = {
  date: "📅",
  recurrence: "🔄",
  none: null,
};

export function TaskItemRow({ task, onToggle, onUpdate, onDelete, members }: TaskItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const member = task.assignedTo ? members.find((m) => m.id === task.assignedTo) : undefined;
  const dueIcon = DUE_ICON[task.dueType];

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setTitle(task.title);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Le titre de la tâche est obligatoire.");
      return;
    }
    if (trimmed === task.title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onUpdate(task.id, trimmed);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 px-4 py-[13px]">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          className="w-full rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] px-3 py-[7px] text-[15px] font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--tasks-accent)] transition-colors"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-[10px] bg-[var(--tasks-accent)] text-white font-semibold text-[13px] px-3 py-[6px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-[13px]">
      {/* Round checkbox */}
      <button
        role="checkbox"
        aria-checked={task.done}
        onClick={() => onToggle(task.id)}
        className={cn(
          "shrink-0 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center",
          "cursor-pointer transition-colors",
          task.done
            ? "bg-[var(--tasks-accent)] border-[var(--tasks-accent)]"
            : "bg-transparent border-[rgba(44,38,34,0.20)] hover:border-[var(--tasks-accent)]"
        )}
        aria-label={task.done ? "Marquer comme à faire" : "Marquer comme terminé"}
      >
        {task.done && (
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
            <path
              d="M1 3.5L4 6.5L10 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Title + due label */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[15px] font-semibold leading-snug truncate",
            task.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
          )}
        >
          {task.title}
        </p>
        <p className="text-[12px] text-[var(--text-muted)] mt-[2px] flex items-center gap-1">
          {dueIcon && <span className="text-[11px]">{dueIcon}</span>}
          {task.dueLabel}
        </p>
      </div>

      {/* Member avatar (optional — only shown when the task is actually assigned) */}
      {member && (
        <div
          className="shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center text-white text-[11px] font-bold"
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
        aria-label="Modifier la tâche"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[13px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--tasks-accent)] cursor-pointer transition-opacity"
      >
        ✎
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        aria-label="Supprimer la tâche"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[15px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
