import { cn } from "@/lib/utils";
import type { Task } from "./tasksData";
import type { HouseholdMember } from "@/lib/domain/types";

interface TaskItemRowProps {
  task: Task;
  onToggle: (id: string) => void;
  members: HouseholdMember[];
}

const DUE_ICON: Record<Task["dueType"], string | null> = {
  date: "📅",
  recurrence: "🔄",
  none: null,
};

export function TaskItemRow({ task, onToggle, members }: TaskItemRowProps) {
  const member = task.assignedTo ? members.find((m) => m.id === task.assignedTo) : undefined;
  const dueIcon = DUE_ICON[task.dueType];

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
    </div>
  );
}
