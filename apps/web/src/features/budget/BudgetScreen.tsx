"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import type { BudgetCategory, BudgetEntry } from "@/lib/domain/types";
import type { BudgetEntryInput } from "@/lib/supabase/budget";
import { BudgetBreakdownChart } from "./BudgetBreakdownChart";
import { BudgetCategoryCard } from "./BudgetCategoryCard";
import { BudgetEntryForm } from "./BudgetEntryForm";
import { BudgetEntryRow } from "./BudgetEntryRow";
import { BudgetMonthlyEvolution } from "./BudgetMonthlyEvolution";
import {
  buildBudgetBreakdown,
  buildMainCategoryLookup,
  defaultBudgetEntryDate,
  formatBudgetMonthLabel,
  formatCents,
  groupBudgetCategories,
  shiftBudgetMonth,
  type BudgetMonthlyEvolutionPoint,
} from "./budgetData";

interface BudgetScreenProps {
  categories: BudgetCategory[];
  entries: BudgetEntry[];
  evolution: BudgetMonthlyEvolutionPoint[];
  month: string;
  monthLoading: boolean;
  onMonthChange: (month: string) => void;
  onAdd: (input: BudgetEntryInput) => Promise<void>;
  onUpdate: (id: string, input: BudgetEntryInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export function BudgetScreen({
  categories,
  entries,
  evolution,
  month,
  monthLoading,
  onMonthChange,
  onAdd,
  onUpdate,
  onDelete,
}: BudgetScreenProps) {
  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);

  const groups = useMemo(() => groupBudgetCategories(categories), [categories]);
  const mainCategoryLookup = useMemo(() => buildMainCategoryLookup(categories), [categories]);

  const totalCents = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amountCents, 0),
    [entries]
  );

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const entry of entries) {
      const mainId = entry.categoryId ? mainCategoryLookup.get(entry.categoryId) : undefined;
      const key = mainId ?? "uncategorized";
      totals.set(key, (totals.get(key) ?? 0) + entry.amountCents);
    }
    return totals;
  }, [entries, mainCategoryLookup]);

  const selectedGroup = groups.find((g) => g.main.id === selectedMainId);

  const visibleEntries = selectedMainId
    ? entries.filter(
        (entry) => entry.categoryId && mainCategoryLookup.get(entry.categoryId) === selectedMainId
      )
    : entries;

  const subcategoryTotals = useMemo(() => {
    if (!selectedGroup) return new Map<string, number>();
    const totals = new Map<string, number>();
    for (const entry of entries) {
      if (!entry.categoryId || mainCategoryLookup.get(entry.categoryId) !== selectedGroup.main.id) {
        continue;
      }
      totals.set(entry.categoryId, (totals.get(entry.categoryId) ?? 0) + entry.amountCents);
    }
    return totals;
  }, [entries, mainCategoryLookup, selectedGroup]);

  const uncategorizedCents = categoryTotals.get("uncategorized") ?? 0;
  const newEntryDefaultDate = defaultBudgetEntryDate(month);
  const breakdown = useMemo(() => buildBudgetBreakdown(entries, categories), [entries, categories]);

  return (
    <div className="max-w-[880px] flex flex-col gap-5">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(shiftBudgetMonth(month, -1))}
          aria-label="Mois précédent"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[18px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer transition-colors"
        >
          ‹
        </button>
        <span className="text-[15px] font-bold text-[var(--text-primary)] capitalize">
          {formatBudgetMonthLabel(month)}
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(shiftBudgetMonth(month, 1))}
          aria-label="Mois suivant"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[18px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer transition-colors"
        >
          ›
        </button>
      </div>

      {/* Total spent */}
      <Card className="!p-[20px] bg-[var(--budget-bg)]">
        <p className="text-[12px] font-bold uppercase tracking-[.05em] text-[var(--budget-text)] opacity-70">
          Total dépensé
        </p>
        <p
          className="text-[32px] font-extrabold mt-[4px] tabular-nums text-[var(--budget-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {monthLoading ? "…" : formatCents(totalCents)}
        </p>
      </Card>

      {selectedGroup ? (
        <>
          {/* Category detail header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedMainId(null)}
              aria-label="Retour aux catégories"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer transition-colors"
            >
              ←
            </button>
            <span className="text-[22px] leading-none">{selectedGroup.main.icon}</span>
            <div>
              <h2 className="text-[17px] font-extrabold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                {selectedGroup.main.name}
              </h2>
              <p className="text-[13px] text-[var(--text-muted)]">
                {formatCents(categoryTotals.get(selectedGroup.main.id) ?? 0)} ce mois-ci
              </p>
            </div>
          </div>

          {/* Subcategory totals */}
          <div className="flex flex-wrap gap-2">
            {selectedGroup.subcategories.map((sub) => (
              <span
                key={sub.id}
                className="inline-flex items-center gap-[6px] rounded-full px-3 py-[6px] text-[13px] font-semibold bg-[var(--surface-muted)] text-[var(--text-secondary)]"
              >
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
                <span className="tabular-nums text-[var(--text-muted)]">
                  {formatCents(subcategoryTotals.get(sub.id) ?? 0)}
                </span>
              </span>
            ))}
          </div>

          {/* Add entry */}
          <Card className="!p-[14px]">
            <BudgetEntryForm
              categories={categories}
              defaultCategoryId={selectedGroup.main.id}
              defaultEntryDate={newEntryDefaultDate}
              submitLabel="Ajouter"
              onSubmit={onAdd}
            />
          </Card>
        </>
      ) : (
        <>
          {/* Répartition du mois */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)] mb-3 px-1">
              Répartition du mois
            </h2>
            <Card className="!p-[16px]">
              <BudgetBreakdownChart breakdown={breakdown} />
            </Card>
          </section>

          {/* Évolution mensuelle */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)] mb-3 px-1">
              Évolution mensuelle
            </h2>
            <Card className="!p-[16px]">
              <BudgetMonthlyEvolution points={evolution} selectedMonth={month} />
            </Card>
          </section>

          {/* Category cards */}
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="text-[48px] opacity-40">💰</span>
              <p className="text-[15px] font-semibold text-[var(--text-muted)]">
                Préparation des catégories de budget…
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 min-[640px]:grid-cols-3 gap-3">
              {groups.map(({ main }) => {
                const catTotal = categoryTotals.get(main.id) ?? 0;
                const share = totalCents > 0 ? Math.round((catTotal / totalCents) * 100) : 0;
                return (
                  <BudgetCategoryCard
                    key={main.id}
                    category={main}
                    totalCents={catTotal}
                    sharePercent={share}
                    onClick={() => setSelectedMainId(main.id)}
                  />
                );
              })}
            </div>
          )}

          {uncategorizedCents > 0 && (
            <p className="text-[13px] text-[var(--text-muted)] px-1">
              Sans catégorie · {formatCents(uncategorizedCents)}
            </p>
          )}

          {/* Add entry */}
          <Card className="!p-[14px]">
            <BudgetEntryForm
              categories={categories}
              defaultEntryDate={newEntryDefaultDate}
              submitLabel="Ajouter une dépense"
              onSubmit={onAdd}
            />
          </Card>
        </>
      )}

      {/* Entries list */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)] mb-3 px-1">
          Dépenses du mois · {visibleEntries.length}
        </h2>

        {visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="text-[48px] opacity-40">🧾</span>
            <p className="text-[15px] font-semibold text-[var(--text-muted)]">
              Aucune dépense {selectedGroup ? "dans cette catégorie" : "ce mois-ci"}.
            </p>
            <p className="text-[13px] text-[var(--text-soft)]">
              Ajoutez une dépense ci-dessus pour commencer.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-[16px] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden",
              monthLoading && "opacity-50 pointer-events-none"
            )}
          >
            {visibleEntries.map((entry, index) => (
              <div key={entry.id} className={index > 0 ? "border-t border-[rgba(44,38,34,0.06)]" : ""}>
                <BudgetEntryRow entry={entry} categories={categories} onUpdate={onUpdate} onDelete={onDelete} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
