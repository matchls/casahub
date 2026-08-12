"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
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
  buildSubcategoryBreakdown,
  calculatePerPersonCents,
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
  /** Active household member count, for the informational "Par personne" split. */
  householdMemberCount: number;
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
  householdMemberCount,
  onMonthChange,
  onAdd,
  onUpdate,
  onDelete,
}: BudgetScreenProps) {
  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Closes the modal only once the entry is actually saved — if onAdd
  // rejects (validation/network failure), the throw propagates out before
  // reaching setAddModalOpen(false), so BudgetEntryForm's own try/catch
  // shows the error and the modal stays open, unchanged from before.
  async function handleAddSubmit(input: BudgetEntryInput) {
    await onAdd(input);
    setAddModalOpen(false);
  }

  const groups = useMemo(() => groupBudgetCategories(categories), [categories]);
  const mainCategoryLookup = useMemo(() => buildMainCategoryLookup(categories), [categories]);

  const totalCents = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amountCents, 0),
    [entries]
  );

  const perPersonCents = useMemo(
    () => calculatePerPersonCents(totalCents, householdMemberCount),
    [totalCents, householdMemberCount]
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

  const selectedGroupPerPersonCents = useMemo(
    () =>
      selectedGroup
        ? calculatePerPersonCents(categoryTotals.get(selectedGroup.main.id) ?? 0, householdMemberCount)
        : null,
    [selectedGroup, categoryTotals, householdMemberCount]
  );

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

  // visibleEntries is already scoped to the selected main category (its
  // subcategories AND any entries attached directly to the main category),
  // so its total matches the "X ce mois-ci" figure in the header below —
  // percentages here are share-of-category, not share-of-month. Direct-to-
  // main entries (the "(général)" option in BudgetEntryForm) are folded
  // into a synthetic "Général" slice by buildSubcategoryBreakdown, so the
  // donut always accounts for the full category total.
  const subcategoryBreakdown = useMemo(() => {
    if (!selectedGroup) return [];
    return buildSubcategoryBreakdown(visibleEntries, selectedGroup.main, selectedGroup.subcategories);
  }, [selectedGroup, visibleEntries]);

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
        {!monthLoading && perPersonCents !== null && (
          <p className="text-[13px] font-semibold mt-[2px] tabular-nums text-[var(--budget-text)] opacity-70">
            Par personne : {formatCents(perPersonCents)}
          </p>
        )}
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
              {selectedGroupPerPersonCents !== null && (
                <p className="text-[12px] font-semibold text-[var(--text-soft)]">
                  Par personne : {formatCents(selectedGroupPerPersonCents)}
                </p>
              )}
            </div>
          </div>

          {/* Répartition par sous-catégorie */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)] mb-3 px-1">
              Répartition par sous-catégorie
            </h2>
            <Card className="!p-[16px]">
              <BudgetBreakdownChart
                breakdown={subcategoryBreakdown}
                emptyStateTitle="Aucune dépense dans cette catégorie ce mois-ci."
              />
            </Card>
          </section>

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
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-[14px] bg-[var(--budget-accent)] text-white font-bold text-[14.5px] px-5 py-[13px] hover:opacity-90 transition-opacity cursor-pointer shadow-[0_8px_18px_-8px_rgba(79,143,132,.7)]"
          >
            <span className="text-[18px] leading-none">+</span>
            Ajouter une dépense
          </button>
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
                    perPersonCents={calculatePerPersonCents(catTotal, householdMemberCount)}
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
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-[14px] bg-[var(--budget-accent)] text-white font-bold text-[14.5px] px-5 py-[13px] hover:opacity-90 transition-opacity cursor-pointer shadow-[0_8px_18px_-8px_rgba(79,143,132,.7)]"
          >
            <span className="text-[18px] leading-none">+</span>
            Ajouter une dépense
          </button>
        </>
      )}

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Ajouter une dépense">
        <BudgetEntryForm
          categories={categories}
          defaultCategoryId={selectedGroup?.main.id}
          defaultEntryDate={newEntryDefaultDate}
          submitLabel="Ajouter"
          onCancel={() => setAddModalOpen(false)}
          onSubmit={handleAddSubmit}
        />
      </Modal>

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
