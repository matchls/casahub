"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BudgetEntryInput } from "@/lib/supabase/budget";
import type { BudgetCategory, BudgetEntryKind } from "@/lib/domain/types";
import { groupBudgetCategories, todayIsoDate } from "./budgetData";

interface BudgetEntryFormProps {
  categories: BudgetCategory[];
  defaultCategoryId?: string;
  initial?: {
    title: string;
    amountCents: number;
    categoryId?: string;
    entryDate: string;
    kind: BudgetEntryKind;
    note?: string;
  };
  onSubmit: (input: BudgetEntryInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}

const inputClass = cn(
  "min-w-0 rounded-[10px] border-[1.5px] border-[var(--border-input)] bg-[var(--surface)]",
  "px-3 py-[9px] text-[14px] text-[var(--text-primary)]",
  "placeholder:text-[var(--placeholder)] focus:outline-none focus:border-[var(--budget-accent)] transition-colors"
);

export function BudgetEntryForm({
  categories,
  defaultCategoryId,
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: BudgetEntryFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(
    initial ? (initial.amountCents / 100).toString() : ""
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? defaultCategoryId ?? "");
  const [entryDate, setEntryDate] = useState(initial?.entryDate ?? todayIsoDate());
  const [kind, setKind] = useState<BudgetEntryKind>(initial?.kind ?? "fixed");
  const [note, setNote] = useState(initial?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = groupBudgetCategories(categories);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Le titre est obligatoire.");
      return;
    }
    const amountValue = Number(amount.replace(",", "."));
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Le montant doit être supérieur à 0.");
      return;
    }
    if (!categoryId) {
      setError("La catégorie est obligatoire.");
      return;
    }
    if (!entryDate) {
      setError("La date est obligatoire.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: trimmedTitle,
        amountCents: Math.round(amountValue * 100),
        categoryId,
        entryDate,
        kind,
        note: note.trim() || undefined,
      });
      if (!initial) {
        setTitle("");
        setAmount("");
        setNote("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          placeholder="Titre (ex : Loyer août)"
          autoFocus={!!initial}
          className={cn(inputClass, "flex-1")}
        />
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
          placeholder="Montant €"
          className={cn(inputClass, "w-[110px]")}
        />
      </div>

      <div className="flex gap-2">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={submitting}
          className={cn(inputClass, "flex-1")}
        >
          <option value="">Choisir une catégorie…</option>
          {groups.map(({ main, subcategories }) => (
            <optgroup key={main.id} label={`${main.icon} ${main.name}`}>
              <option value={main.id}>{main.name} (général)</option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.icon} {sub.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          disabled={submitting}
          className={cn(inputClass, "w-[150px]")}
        />
      </div>

      <div className="flex items-center gap-2">
        {(["fixed", "variable"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            disabled={submitting}
            aria-pressed={kind === k}
            className={cn(
              "px-3 py-[6px] rounded-full text-[13px] font-semibold cursor-pointer transition-colors",
              kind === k
                ? "bg-[var(--budget-accent)] text-white"
                : "bg-[var(--budget-bg)] text-[var(--budget-text)] opacity-60 hover:opacity-100"
            )}
          >
            {k === "fixed" ? "Fixe" : "Variable"}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={submitting}
        placeholder="Note (optionnel)"
        className={inputClass}
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[10px] bg-[var(--budget-accent)] text-white font-semibold text-[13px] px-4 py-[8px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Enregistrement…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
          >
            Annuler
          </button>
        )}
      </div>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
    </form>
  );
}
