"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { BudgetCategory, BudgetEntry } from "@/lib/domain/types";
import type { BudgetEntryInput } from "@/lib/supabase/budget";
import { BudgetEntryForm } from "./BudgetEntryForm";
import { formatCents, KIND_LABELS } from "./budgetData";

interface BudgetEntryRowProps {
  entry: BudgetEntry;
  categories: BudgetCategory[];
  onUpdate: (id: string, input: BudgetEntryInput) => Promise<void>;
  onDelete: (id: string) => void;
}

function formatEntryDate(entryDate: string): string {
  const [year, month, day] = entryDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function BudgetEntryRow({ entry, categories, onUpdate, onDelete }: BudgetEntryRowProps) {
  const [editing, setEditing] = useState(false);
  const category = entry.categoryId ? categories.find((c) => c.id === entry.categoryId) : undefined;

  function handleDelete() {
    if (confirm("Supprimer cette dépense ?")) {
      onDelete(entry.id);
    }
  }

  if (editing) {
    return (
      <div className="px-4 py-[13px]">
        <BudgetEntryForm
          categories={categories}
          initial={{
            title: entry.title,
            amountCents: entry.amountCents,
            categoryId: entry.categoryId,
            entryDate: entry.entryDate,
            kind: entry.kind,
            note: entry.note,
            recurringExpenseId: entry.recurringExpenseId,
          }}
          submitLabel="Enregistrer"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await onUpdate(entry.id, input);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-[13px]">
      <span className="shrink-0 text-[20px] leading-none">{category?.icon ?? "❓"}</span>

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-snug truncate text-[var(--text-primary)]">
          {entry.title}
        </p>
        <p className="text-[12px] text-[var(--text-muted)] mt-[2px] flex items-center gap-[6px] flex-wrap">
          <span>{category?.name ?? "Sans catégorie"}</span>
          <span>·</span>
          <span>{formatEntryDate(entry.entryDate)}</span>
          {entry.recurringExpenseId && (
            <>
              <span>·</span>
              <span title="Dépense récurrente mensuelle">🔄 Mensuelle</span>
            </>
          )}
          {entry.note && (
            <>
              <span>·</span>
              <span className="truncate">{entry.note}</span>
            </>
          )}
        </p>
      </div>

      <Badge variant="budget" className={cn(entry.kind === "variable" && "opacity-70")}>
        {KIND_LABELS[entry.kind]}
      </Badge>

      <span className="shrink-0 text-[15px] font-bold tabular-nums text-[var(--text-primary)]">
        {formatCents(entry.amountCents)}
      </span>

      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Modifier la dépense"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[13px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--budget-text)] cursor-pointer transition-opacity"
      >
        ✎
      </button>

      <button
        type="button"
        onClick={handleDelete}
        aria-label="Supprimer la dépense"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[15px] leading-none text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
