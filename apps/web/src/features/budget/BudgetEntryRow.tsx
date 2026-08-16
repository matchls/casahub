"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { BudgetCategory, BudgetEntry } from "@/lib/domain/types";
import type { BudgetEntryInput } from "@/lib/supabase/budget";
import { BudgetEntryForm } from "./BudgetEntryForm";
import { DELETE_SCOPE_LABELS, EDIT_SCOPE_LABELS, formatCents, KIND_LABELS, type BudgetSeriesScope } from "./budgetData";

interface BudgetEntryRowProps {
  entry: BudgetEntry;
  categories: BudgetCategory[];
  onUpdate: (id: string, input: BudgetEntryInput) => Promise<void>;
  /** "Ce mois et les suivants" (issue #110) — only ever reached for a recurring entry. */
  onUpdateSeries: (id: string, input: BudgetEntryInput) => Promise<void>;
  onDelete: (id: string, scope?: BudgetSeriesScope) => void;
}

function formatEntryDate(entryDate: string): string {
  const [year, month, day] = entryDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Two-option scope picker shared by the edit and delete flows below — both
 * ask the same "this month only, or the whole series from here" question
 * (issue #110), just with different copy/consequences, so the modal
 * chrome and button layout are factored out once rather than duplicated.
 */
function ScopeChoiceModal({
  open,
  onClose,
  title,
  description,
  labels,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  labels: Record<BudgetSeriesScope, string>;
  onChoose: (scope: BudgetSeriesScope) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-[13px] text-[var(--text-muted)] mb-3">{description}</p>
      <div className="flex flex-col gap-2">
        {(["occurrence", "series"] as const).map((scope) => (
          <button
            key={scope}
            type="button"
            onClick={() => onChoose(scope)}
            className="rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)] px-4 py-[10px] text-left text-[14px] font-semibold text-[var(--text-primary)] cursor-pointer transition-colors hover:bg-[var(--surface-muted)] hover:border-[var(--budget-accent)]"
          >
            {labels[scope]}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function BudgetEntryRow({ entry, categories, onUpdate, onUpdateSeries, onDelete }: BudgetEntryRowProps) {
  const [editing, setEditing] = useState(false);
  const [pendingEditInput, setPendingEditInput] = useState<BudgetEntryInput | null>(null);
  const [deleteScopeOpen, setDeleteScopeOpen] = useState(false);
  const category = entry.categoryId ? categories.find((c) => c.id === entry.categoryId) : undefined;
  const isRecurring = !!entry.recurringExpenseId;

  function handleDelete() {
    // Recurring occurrences must make the scope explicit (issue #110) — a
    // one-off expense keeps its plain confirm() exactly as before.
    if (isRecurring) {
      setDeleteScopeOpen(true);
      return;
    }
    if (confirm("Supprimer cette dépense ?")) {
      onDelete(entry.id);
    }
  }

  async function commitEditScope(scope: BudgetSeriesScope) {
    const input = pendingEditInput;
    setPendingEditInput(null);
    if (!input) return;
    try {
      if (scope === "series") {
        await onUpdateSeries(entry.id, input);
      } else {
        await onUpdate(entry.id, input);
      }
      setEditing(false);
    } catch {
      // BudgetEntryForm is already unmounted from this path (the scope
      // modal took over after its own submit), so there's no inline form
      // left to show the error — alert() matches the existing pattern used
      // elsewhere in this feature for actions with no form of their own.
      alert("La mise à jour de la dépense a échoué. Réessayez.");
    }
  }

  function commitDeleteScope(scope: BudgetSeriesScope) {
    setDeleteScopeOpen(false);
    onDelete(entry.id, scope);
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
            // A recurring occurrence must make its edit scope explicit
            // before anything is persisted (issue #110) — a one-off entry
            // keeps updating immediately exactly as before.
            if (isRecurring) {
              setPendingEditInput(input);
              return;
            }
            await onUpdate(entry.id, input);
            setEditing(false);
          }}
        />
        <ScopeChoiceModal
          open={!!pendingEditInput}
          onClose={() => setPendingEditInput(null)}
          title="Modifier la dépense récurrente"
          description="Cette dépense fait partie d'une série mensuelle. « Ce mois et les suivants » remplace aussi les valeurs des mois déjà générés dans le futur, y compris ceux modifiés manuellement."
          labels={EDIT_SCOPE_LABELS}
          onChoose={commitEditScope}
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

      <ScopeChoiceModal
        open={deleteScopeOpen}
        onClose={() => setDeleteScopeOpen(false)}
        title="Supprimer la dépense récurrente"
        description="Cette dépense fait partie d'une série mensuelle. « Arrêter à partir de ce mois » supprime aussi tous les mois déjà générés à partir de celui-ci et empêche la série de continuer."
        labels={DELETE_SCOPE_LABELS}
        onChoose={commitDeleteScope}
      />
    </div>
  );
}
