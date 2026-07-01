import { cn } from "@/lib/utils";
import type { ShoppingItem } from "./shoppingData";
import { MEMBERS } from "./shoppingData";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
}

export function ShoppingItemRow({ item, onToggle }: ShoppingItemRowProps) {
  const member = MEMBERS[item.assignedTo];

  return (
    <div className="flex items-center gap-3 px-4 py-[11px]">
      {/* Square checkbox */}
      <button
        role="checkbox"
        aria-checked={item.done}
        onClick={() => onToggle(item.id)}
        className={cn(
          "shrink-0 w-[22px] h-[22px] rounded-[6px] border-2 flex items-center justify-center",
          "cursor-pointer transition-colors",
          item.done
            ? "bg-[var(--shopping-accent)] border-[var(--shopping-accent)]"
            : "bg-transparent border-[rgba(44,38,34,0.20)] hover:border-[var(--shopping-accent)]"
        )}
        aria-label={item.done ? "Marquer comme à prendre" : "Marquer comme pris"}
      >
        {item.done && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path
              d="M1 4L4.5 7.5L11 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Label + optional quantity (separate spans so only label gets line-through) */}
      <div className="flex-1 min-w-0 flex items-baseline gap-1">
        <span
          className={cn(
            "text-[15px] font-medium truncate",
            item.done
              ? "text-[var(--text-muted)] line-through"
              : "text-[var(--text-primary)]"
          )}
        >
          {item.label}
        </span>
        {item.quantity !== undefined && (
          <span className="shrink-0 text-[13px] text-[var(--text-muted)] font-normal">
            ×{item.quantity}
          </span>
        )}
      </div>

      {/* Member avatar */}
      <div
        className="shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center text-white text-[11px] font-bold"
        style={{ backgroundColor: member.color }}
        title={member.name}
      >
        {member.initial}
      </div>
    </div>
  );
}
