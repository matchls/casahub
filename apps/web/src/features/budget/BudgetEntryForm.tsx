"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CreateBudgetEntryInput } from "@/lib/supabase/budget";
import type { BudgetCategory, BudgetEntryKind, BudgetEntryRecurrence } from "@/lib/domain/types";
import { groupBudgetCategories, lastDayOfBudgetMonth, RECURRENCE_LABELS, todayIsoDate } from "./budgetData";

interface BudgetEntryFormProps {
  categories: BudgetCategory[];
  defaultCategoryId?: string;
  /** Date to prefill for a new entry (ignored once `initial` is set — edits keep their own date). */
  defaultEntryDate?: string;
  initial?: {
    title: string;
    amountCents: number;
    categoryId?: string;
    entryDate: string;
    kind: BudgetEntryKind;
    note?: string;
    /** Set when editing a generated recurring occurrence — restricts the date input to its own month (issue #105) and hides the recurrence selector, which only applies at creation time. */
    recurringExpenseId?: string;
  };
  onSubmit: (input: CreateBudgetEntryInput) => Promise<void>;
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
  defaultEntryDate,
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
  const [entryDate, setEntryDate] = useState(initial?.entryDate ?? defaultEntryDate ?? todayIsoDate());
  const [kind, setKind] = useState<BudgetEntryKind>(initial?.kind ?? "fixed");
  const [recurrence, setRecurrence] = useState<BudgetEntryRecurrence>("once");
  const [note, setNote] = useState(initial?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Generated once when this form instance mounts and reused for every
  // retry of the same submission (the modal stays open and this component
  // stays mounted on a failed submit — see BudgetScreen's handleAddSubmit),
  // so a network failure + retry reuses the recurring series the RPC
  // already created instead of creating a duplicate (issue #105). A fresh
  // value is generated automatically the next time a new instance mounts
  // (new form / after a successful create closes the modal).
  const [creationRequestId] = useState<string>(() => crypto.randomUUID());

  const groups = groupBudgetCategories(categories);

  // A generated recurring occurrence may move within its own month but must
  // never change entry_month (issue #105) — the DB enforces this too (see
  // guard_recurring_budget_entry_update in budget_recurring_expenses.sql),
  // this is just the friendly client-side half of that guarantee.
  const isRecurringOccurrence = !!initial?.recurringExpenseId;
  const recurringMonthMin = isRecurringOccurrence ? `${initial!.entryDate.slice(0, 7)}-01` : undefined;
  const recurringMonthMax = isRecurringOccurrence ? lastDayOfBudgetMonth(initial!.entryDate) : undefined;

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
    if (isRecurringOccurrence && entryDate.slice(0, 7) !== initial!.entryDate.slice(0, 7)) {
      setError("Une occurrence récurrente ne peut pas être déplacée vers un autre mois.");
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
        recurrence: initial ? "once" : recurrence,
        creationRequestId,
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
          min={recurringMonthMin}
          max={recurringMonthMax}
          className={cn(inputClass, "w-[150px]")}
        />
      </div>

      {isRecurringOccurrence && (
        <p className="text-[12px] text-[var(--text-muted)]">
          🔄 Occurrence d’une dépense récurrente mensuelle — modifiable uniquement dans son mois.
        </p>
      )}

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

      {/* Récurrence: independent of Fixe/Variable (kind) — only settable at creation, per issue #105. */}
      {!initial && (
        <div className="flex items-center gap-2">
          {(["once", "monthly"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRecurrence(r)}
              disabled={submitting}
              aria-pressed={recurrence === r}
              className={cn(
                "px-3 py-[6px] rounded-full text-[13px] font-semibold cursor-pointer transition-colors",
                recurrence === r
                  ? "bg-[var(--budget-accent)] text-white"
                  : "bg-[var(--budget-bg)] text-[var(--budget-text)] opacity-60 hover:opacity-100"
              )}
            >
              {RECURRENCE_LABELS[r]}
            </button>
          ))}
        </div>
      )}

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
