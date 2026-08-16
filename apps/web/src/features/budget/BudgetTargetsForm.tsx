"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BudgetCategory, BudgetMonthlyTarget } from "@/lib/domain/types";
import { buildBudgetTargetLookup, groupBudgetCategories } from "./budgetData";

interface BudgetTargetsFormProps {
  categories: BudgetCategory[];
  targets: BudgetMonthlyTarget[];
  onSave: (changes: { categoryId: string; amountCents: number | null }[]) => Promise<void>;
  onCancel: () => void;
}

const inputClass = cn(
  "min-w-0 w-[110px] rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)]",
  "px-3 py-[9px] text-[14px] text-[var(--text-primary)] text-right tabular-nums",
  "placeholder:text-[var(--placeholder)] focus:outline-none focus:border-[var(--budget-accent)] transition-colors"
);

/**
 * One € input per MAIN category, prefilled from the current month's
 * targets (issue #113). Rendered as plain form content inside BudgetScreen's
 * existing <Modal>, mirroring BudgetEntryForm — Modal itself unmounts its
 * children while closed (see components/ui/Modal.tsx: `if (!open) return
 * null`), so a fresh instance of this component mounts every time the modal
 * reopens and its useState below always starts from the latest `targets`
 * prop, with no extra effect/resync needed.
 */
export function BudgetTargetsForm({ categories, targets, onSave, onCancel }: BudgetTargetsFormProps) {
  const mains = groupBudgetCategories(categories).map((group) => group.main);
  const targetLookup = buildBudgetTargetLookup(targets);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const main of mains) {
      const amountCents = targetLookup.get(main.id);
      initial[main.id] = amountCents ? (amountCents / 100).toString() : "";
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Blank or 0 means "no target" (issue #113) — both collapse to the same
    // `null` change so saveBudgetMonthlyTargets clears the row instead of
    // persisting a meaningless zero. Only categories whose resolved value
    // actually differs from what's already stored are sent, so re-saving
    // without touching anything is a no-op network-wise.
    const changes: { categoryId: string; amountCents: number | null }[] = [];
    for (const main of mains) {
      const raw = (values[main.id] ?? "").trim();
      let amountCents: number | null = null;
      if (raw) {
        const parsed = Number(raw.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) {
          setError(`Montant invalide pour "${main.name}".`);
          return;
        }
        amountCents = parsed > 0 ? Math.round(parsed * 100) : null;
      }
      const existingAmountCents = targetLookup.get(main.id) ?? null;
      if (amountCents !== existingAmountCents) {
        changes.push({ categoryId: main.id, amountCents });
      }
    }

    if (changes.length === 0) {
      onCancel();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSave(changes);
      // Only reached on success — onSave rejecting leaves the form open
      // with the error below, exactly like BudgetEntryForm's own submit.
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
      <p className="text-[13px] text-[var(--text-muted)]">
        Montant prévu par catégorie. Laissez vide pour ne pas planifier de budget.
      </p>

      <div className="flex flex-col gap-[6px] max-h-[50vh] overflow-y-auto -mx-1 px-1">
        {mains.map((main) => (
          <div key={main.id} className="flex items-center gap-3">
            <span className="shrink-0 text-[18px] leading-none w-6 text-center">{main.icon}</span>
            <span className="flex-1 min-w-0 text-[14px] font-semibold text-[var(--text-primary)] truncate">
              {main.name}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={values[main.id] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [main.id]: e.target.value }))}
              disabled={submitting}
              placeholder="—"
              aria-label={`Budget prévu pour ${main.name}`}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-1">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[10px] bg-[var(--budget-accent)] text-white font-semibold text-[13px] px-4 py-[8px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
    </form>
  );
}
