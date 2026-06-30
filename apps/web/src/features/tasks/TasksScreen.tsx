"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import type { Task } from "@/lib/domain/types";
import { TaskItemRow } from "./TaskItemRow";

interface TasksScreenProps {
  tasks: Task[];
  onToggle: (id: number) => void;
  onAdd: (title: string) => void;
}

export function TasksScreen({ tasks, onToggle, onAdd }: TasksScreenProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div className="max-w-[720px] flex flex-col gap-5">
      {/* Add task */}
      <Card className="flex items-center gap-3 !p-[14px]">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nouvelle tâche..."
          className={cn(
            "flex-1 min-w-0 bg-transparent text-[15px] text-[var(--text-primary)]",
            "placeholder:text-[var(--placeholder)] focus:outline-none"
          )}
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          aria-label="Ajouter une tâche"
          className={cn(
            "shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center",
            "text-white text-[22px] font-light leading-none",
            "cursor-pointer transition-opacity",
            "bg-[var(--tasks-accent)]",
            "shadow-[0_8px_18px_-8px_rgba(126,155,110,.7)]",
            "hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
          )}
        >
          +
        </button>
      </Card>

      {/* Empty state — only shown when there are no tasks at all */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-[56px] opacity-40">✅</span>
          <p className="text-[15px] font-semibold text-[var(--text-muted)]">
            Aucune tâche pour le moment.
          </p>
          <p className="text-[13px] text-[var(--text-soft)]">
            Ajoutez une tâche ci-dessus pour commencer.
          </p>
        </div>
      )}

      {/* À faire */}
      {pendingTasks.length > 0 && (
        <section>
          <div className="rounded-[16px] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden">
            {pendingTasks.map((task, index) => (
              <div
                key={task.id}
                className={index > 0 ? "border-t border-[rgba(44,38,34,0.06)]" : ""}
              >
                <TaskItemRow task={task} onToggle={onToggle} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Terminé */}
      {doneTasks.length > 0 && (
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)] mb-3 px-1">
            Terminé · {doneTasks.length}
          </h2>
          <div className="rounded-[16px] bg-[var(--surface-muted)] shadow-[var(--shadow-card)] overflow-hidden">
            {doneTasks.map((task, index) => (
              <div
                key={task.id}
                className={index > 0 ? "border-t border-[rgba(44,38,34,0.06)]" : ""}
              >
                <TaskItemRow task={task} onToggle={onToggle} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
